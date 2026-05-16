import { eq } from "drizzle-orm";
import { db } from "@/db";
import { emailLog } from "@/db/schema/email-log-schema";
import { sendEmail, type EmailAttachment } from "@/lib/ses";
import { authenticateApiKey } from "@/service/api-keys";

export type SendEmailInput = {
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: EmailAttachment[];
    replyTo?: string[];
};

export type SendEmailErrorCode =
    | "invalid_api_key"
    | "missing_permission"
    | "domain_not_verified"
    | "domain_mismatch";

export class SendEmailError extends Error {
    constructor(
        public code: SendEmailErrorCode,
        message: string,
    ) {
        super(message);
        this.name = "SendEmailError";
    }
}

function extractEmailAddress(address: string) {
    const match = address.match(/<([^>]+)>/);
    return (match?.[1] ?? address).trim().toLowerCase();
}

function getEmailDomain(address: string) {
    const emailAddress = extractEmailAddress(address);
    const atIndex = emailAddress.lastIndexOf("@");

    if (atIndex === -1) {
        return null;
    }

    return emailAddress.slice(atIndex + 1);
}

function canSendFromDomain(fromDomain: string, verifiedDomain: string) {
    const normalizedVerifiedDomain = verifiedDomain.toLowerCase();
    return (
        fromDomain === normalizedVerifiedDomain ||
        fromDomain.endsWith(`.${normalizedVerifiedDomain}`)
    );
}

export async function sendApiEmail(rawApiKey: string, input: SendEmailInput) {
    const authenticatedKey = await authenticateApiKey(rawApiKey);

    if (!authenticatedKey) {
        throw new SendEmailError(
            "invalid_api_key",
            "Missing or invalid authorization header",
        );
    }

    if (!authenticatedKey.permissions.includes("send")) {
        throw new SendEmailError(
            "missing_permission",
            "API key does not have permission to send emails",
        );
    }

    if (authenticatedKey.domainStatus !== "verified") {
        throw new SendEmailError(
            "domain_not_verified",
            "Domain is not verified",
        );
    }

    const fromDomain = getEmailDomain(input.from);

    if (!fromDomain || !canSendFromDomain(fromDomain, authenticatedKey.domain)) {
        throw new SendEmailError(
            "domain_mismatch",
            "The from address must use the domain attached to this API key",
        );
    }

    const [createdLog] = await db
        .insert(emailLog)
        .values({
            apiKeyId: authenticatedKey.id,
            domainId: authenticatedKey.domainId,
            fromEmail: input.from,
            toEmails: input.to,
            ccEmails: input.cc ?? [],
            bccEmails: input.bcc ?? [],
            subject: input.subject,
            htmlContent: input.html,
            textContent: input.text,
            attachments: input.attachments?.map((attachment) => ({
                filename: attachment.filename,
                contentType: attachment.contentType,
            })) ?? [],
            status: "pending",
        })
        .returning({ id: emailLog.id });

    try {
        const sesMessageId = await sendEmail({
            ...input,
            configurationSetName: authenticatedKey.sesConfigurationSet ?? undefined,
        });

        await db
            .update(emailLog)
            .set({
                messageId: createdLog.id,
                sesMessageId,
                status: "sent",
            })
            .where(eq(emailLog.id, createdLog.id));

        return {
            id: createdLog.id,
            sesMessageId,
        };
    } catch (error) {
        await db
            .update(emailLog)
            .set({
                messageId: createdLog.id,
                status: "failed",
                errorMessage: error instanceof Error ? error.message : String(error),
            })
            .where(eq(emailLog.id, createdLog.id));

        throw error;
    }
}
