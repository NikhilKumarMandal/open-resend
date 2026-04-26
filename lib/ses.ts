import {
  SESClient,
  SendEmailCommand,
  SendRawEmailCommand,
  VerifyDomainIdentityCommand,
  VerifyDomainDkimCommand,
  GetIdentityVerificationAttributesCommand,
  GetIdentityDkimAttributesCommand,
  DeleteIdentityCommand,
  CreateConfigurationSetCommand,
} from "@aws-sdk/client-ses";
import type { DNSRecord } from "@/db/schema/domain-schema";

const ses = new SESClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});


export type EmailAttachment = {
  filename: string;
  content: string;       // base64
  contentType: string;
};

export type SendEmailOptions = {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  replyTo?: string[];
  configurationSetName?: string;
  tags?: Record<string, string>;
};

export type SESRegistrationResult = {
  verificationToken: string;
  dkimTokens: string[];
  configurationSet: string;
};

export type SESDomainStatus = {
  sesVerified: boolean;
  dkimVerified: boolean;
  dkimStatus: "Success" | "Pending" | "Failed" | "NotStarted" | "TemporaryFailure";
};


/**
 * Called once when user adds a domain.
 * Runs all 3 SES setup commands in parallel for speed.
 */
export async function registerDomainWithSES(
  domainName: string
): Promise<SESRegistrationResult> {
  const [identityRes, dkimRes] = await Promise.all([
    ses.send(new VerifyDomainIdentityCommand({ Domain: domainName })),
    ses.send(new VerifyDomainDkimCommand({ Domain: domainName })),
  ]);

  if (!identityRes.VerificationToken) {
    throw new Error("SES did not return a verification token");
  }
  if (!dkimRes.DkimTokens?.length) {
    throw new Error("SES did not return DKIM tokens");
  }

  // Create config set for bounce/complaint tracking
  const configurationSet = await createConfigurationSet(domainName);

  return {
    verificationToken: identityRes.VerificationToken,
    dkimTokens: dkimRes.DkimTokens,
    configurationSet,
  };
}


/**
 * Ask SES what the current verification + DKIM status is.
 * SES polls DNS itself every ~5 min — we just read the result.
 */
export async function getSESDomainStatus(
  domainName: string
): Promise<SESDomainStatus> {
  const [verificationRes, dkimRes] = await Promise.all([
    ses.send(
      new GetIdentityVerificationAttributesCommand({ Identities: [domainName] })
    ),
    ses.send(
      new GetIdentityDkimAttributesCommand({ Identities: [domainName] })
    ),
  ]);

  const verificationAttrs =
    verificationRes.VerificationAttributes?.[domainName];
  const dkimAttrs = dkimRes.DkimAttributes?.[domainName];

  const sesVerified = verificationAttrs?.VerificationStatus === "Success";
  const dkimStatus =
    (dkimAttrs?.DkimVerificationStatus as SESDomainStatus["dkimStatus"]) ??
    "NotStarted";
  const dkimVerified = dkimStatus === "Success";

  return { sesVerified, dkimVerified, dkimStatus };
}

export async function deleteDomainFromSES(domainName: string): Promise<void> {
  await ses.send(new DeleteIdentityCommand({ Identity: domainName }));
}



export async function createConfigurationSet(
  domainName: string
): Promise<string> {
  const name = `freeresend-${domainName.replace(/\./g, "-")}`;

  try {
    await ses.send(
      new CreateConfigurationSetCommand({ ConfigurationSet: { Name: name } })
    );
  } catch (error: unknown) {
    const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    // Already exists — fine, just return the name
    if (
      err.name === "AlreadyExistsException" ||
      err.name === "ConfigurationSetAlreadyExistsException" ||
      err.$metadata?.httpStatusCode === 409
    ) {
      return name;
    }
    throw error;
  }

  return name;
}


export function buildDNSRecords(
  domainName: string,
  verificationToken: string,
  dkimTokens: string[]
): DNSRecord[] {
  const region = process.env.AWS_REGION ?? "us-east-1";

  return [
    // 1. SES ownership proof
    {
      type: "TXT",
      name: `_amazonses.${domainName}`,
      value: verificationToken,
      ttl: 300,
      description: "SES domain ownership verification",
    },
    // 2. SPF — tells receivers SES is allowed to send for you
    {
      type: "TXT",
      name: domainName,
      value: "v=spf1 include:amazonses.com ~all",
      ttl: 300,
      description: "SPF — authorizes SES to send from this domain",
    },
    // 3. DMARC — tells receivers what to do with failed SPF/DKIM
    {
      type: "TXT",
      name: `_dmarc.${domainName}`,
      value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domainName}`,
      ttl: 300,
      description: "DMARC policy — quarantine emails that fail SPF/DKIM",
    },
    // 4. MX — routes bounces back to SES for processing
    {
      type: "MX",
      name: domainName,
      value: `inbound-smtp.${region}.amazonaws.com`,
      ttl: 300,
      priority: 10,
      description: "MX — routes bounces and complaints to SES",
    },
    // 5-7. DKIM — 3 CNAMEs, cryptographic proof emails are really from you
    ...dkimTokens.map((token) => ({
      type: "CNAME" as const,
      name: `${token}._domainkey.${domainName}`,
      value: `${token}.dkim.amazonses.com`,
      ttl: 1800,
      description: `DKIM signing key (${token.substring(0, 8)}...)`,
    })),
  ];
}


export async function sendEmail(options: SendEmailOptions): Promise<string> {
  if (options.attachments?.length) {
    return sendRawEmail(options);
  }

  const res = await ses.send(
    new SendEmailCommand({
      Source: options.from,
      Destination: {
        ToAddresses: options.to,
        CcAddresses: options.cc,
        BccAddresses: options.bcc,
      },
      Message: {
        Subject: { Data: options.subject, Charset: "UTF-8" },
        Body: {
          Html: options.html ? { Data: options.html, Charset: "UTF-8" } : undefined,
          Text: options.text ? { Data: options.text, Charset: "UTF-8" } : undefined,
        },
      },
      ReplyToAddresses: options.replyTo,
      ConfigurationSetName: options.configurationSetName,
      Tags: options.tags
        ? Object.entries(options.tags).map(([Name, Value]) => ({ Name, Value }))
        : undefined,
    })
  );

  return res.MessageId!;
}

export async function sendRawEmail(options: SendEmailOptions): Promise<string> {
  const {
    from, to, cc, bcc, subject,
    html, text, attachments = [], replyTo,
  } = options;

  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const recipients = [...to, ...(cc ?? []), ...(bcc ?? [])];

  const lines: string[] = [
    `From: ${from}`,
    `To: ${to.join(", ")}`,
    ...(cc?.length ? [`Cc: ${cc.join(", ")}`] : []),
    ...(replyTo?.length ? [`Reply-To: ${replyTo.join(", ")}`] : []),
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: multipart/alternative; boundary="${boundary}-alt"`,
    ``,
    ...(text
      ? [
          `--${boundary}-alt`,
          `Content-Type: text/plain; charset=UTF-8`,
          ``,
          text,
          ``,
        ]
      : []),
    ...(html
      ? [
          `--${boundary}-alt`,
          `Content-Type: text/html; charset=UTF-8`,
          ``,
          html,
          ``,
        ]
      : []),
    `--${boundary}-alt--`,
    ...attachments.flatMap((a) => [
      `--${boundary}`,
      `Content-Type: ${a.contentType}`,
      `Content-Disposition: attachment; filename="${a.filename}"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      a.content,
    ]),
    `--${boundary}--`,
  ];

  const res = await ses.send(
    new SendRawEmailCommand({
      Source: from,
      Destinations: recipients,
      RawMessage: { Data: new TextEncoder().encode(lines.join("\r\n")) },
    })
  );

  return res.MessageId!;
}