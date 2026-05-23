"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clipboard,
  Globe2,
  Loader2,
  RefreshCcw,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DomainStatus = "pending" | "verifying" | "verified" | "failed";

type DNSRecord = {
  type: "TXT" | "CNAME" | "MX";
  name: string;
  value: string;
  ttl: number;
  priority?: number;
  description: string;
};

type Domain = {
  id: string;
  domain: string;
  status: DomainStatus;
  dkimVerified: boolean;
  dnsRecords: DNSRecord[] | null;
  createdAt: string;
  updatedAt: string;
};

type LoadingAction =
  | "initial"
  | "add"
  | `verify:${string}`
  | `retry:${string}`
  | `delete:${string}`;

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
};

async function readResponse<T>(response: Response) {
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload;
}

function statusClassName(status: DomainStatus) {
  if (status === "verified") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "failed") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  return "border-amber-500/30 bg-amber-500/10 text-amber-200";
}

function formatRecordValue(record: DNSRecord) {
  if (record.priority === undefined) {
    return record.value;
  }

  return `${record.priority} ${record.value}`;
}

export function DomainsDashboard() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainName, setDomainName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<LoadingAction | null>(
    "initial",
  );

  const verifiedCount = useMemo(
    () => domains.filter((item) => item.status === "verified").length,
    [domains],
  );

  useEffect(() => {
    let ignore = false;

    async function loadInitialDomains() {
      try {
        const payload = await readResponse<{ domains: Domain[] }>(
          await fetch("/api/domains", { cache: "no-store" }),
        );

        if (!ignore) {
          setDomains(payload.data?.domains ?? []);
        }
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Unable to load domains";

        if (!ignore) {
          setError(message);
          toast.error(message);
        }
      } finally {
        if (!ignore) {
          setLoadingAction(null);
        }
      }
    }

    void loadInitialDomains();

    return () => {
      ignore = true;
    };
  }, []);

  async function addDomain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!domainName.trim()) {
      return;
    }

    setError(null);
    setLoadingAction("add");

    try {
      const payload = await readResponse<{
        domain: Domain;
        dnsRecords: DNSRecord[];
      }>(
        await fetch("/api/domains", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: domainName }),
        }),
      );

      const createdDomain = payload.data?.domain;

      if (createdDomain) {
        setDomains((current) => [createdDomain, ...current]);
      }

      setDomainName("");
      toast.success(payload.message ?? "Domain added");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to add domain";
      setError(message);
      toast.error(message);
    } finally {
      setLoadingAction(null);
    }
  }

  async function verifyDomain(domainId: string) {
    setLoadingAction(`verify:${domainId}`);

    try {
      const payload = await readResponse<{ domain: Domain }>(
        await fetch(`/api/domains?id=${domainId}`, { method: "PATCH" }),
      );

      const updatedDomain = payload.data?.domain;

      if (updatedDomain) {
        setDomains((current) =>
          current.map((item) =>
            item.id === domainId ? updatedDomain : item,
          ),
        );
      }

      toast.success(payload.message ?? "Verification checked");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to verify domain";
      toast.error(message);
    } finally {
      setLoadingAction(null);
    }
  }

  async function retryDomain(domainId: string) {
    setLoadingAction(`retry:${domainId}`);

    try {
      const payload = await readResponse<{
        domain: Domain;
        dnsRecords: DNSRecord[];
      }>(
        await fetch(`/api/domains/retry?id=${domainId}`, { method: "POST" }),
      );

      const updatedDomain = payload.data?.domain;

      if (updatedDomain) {
        setDomains((current) =>
          current.map((item) =>
            item.id === domainId ? updatedDomain : item,
          ),
        );
      }

      toast.success(payload.message ?? "Domain setup retried");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to retry domain setup";
      toast.error(message);
    } finally {
      setLoadingAction(null);
    }
  }

  async function deleteDomain(domainId: string, domain: string) {
    if (!window.confirm(`Delete ${domain}?`)) {
      return;
    }

    setLoadingAction(`delete:${domainId}`);

    try {
      const payload = await readResponse<Record<string, never>>(
        await fetch(`/api/domains?id=${domainId}`, { method: "DELETE" }),
      );

      setDomains((current) => current.filter((item) => item.id !== domainId));
      toast.success(payload.message ?? "Domain deleted");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete domain";
      toast.error(message);
    } finally {
      setLoadingAction(null);
    }
  }

  async function copyToClipboard(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-[#212121] px-4 pb-10 text-[#ececec] md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="flex flex-col gap-4 pt-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-[#b4b4b4]">
              <Globe2 className="size-4" />
              Domain verification
            </div>
            <h1 className="text-3xl font-semibold tracking-normal text-white">
              Sending domains
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[#b4b4b4]">
              Add a domain, publish the generated DNS records at your domain
              provider, then check verification here.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm md:min-w-64">
            <div className="rounded-lg border border-[#3a3a3a] bg-[#262626] p-3">
              <div className="text-[#9b9b9b]">Total</div>
              <div className="mt-1 text-2xl font-semibold text-white">
                {domains.length}
              </div>
            </div>
            <div className="rounded-lg border border-[#3a3a3a] bg-[#262626] p-3">
              <div className="text-[#9b9b9b]">Verified</div>
              <div className="mt-1 text-2xl font-semibold text-white">
                {verifiedCount}
              </div>
            </div>
          </div>
        </section>

        <form
          onSubmit={addDomain}
          className="flex flex-col gap-3 rounded-lg border border-[#3a3a3a] bg-[#262626] p-4 md:flex-row"
        >
          <Input
            value={domainName}
            onChange={(event) => setDomainName(event.target.value)}
            placeholder="example.com"
            className="h-10 rounded-lg border-[#464646] bg-[#1f1f1f] text-white placeholder:text-[#777] focus-visible:ring-[#5b4ef8]/50"
            disabled={loadingAction === "add"}
          />
          <Button
            type="submit"
            className="h-10 rounded-lg bg-[#5b4ef8] px-5 text-white hover:bg-[#6b5ef8]"
            disabled={loadingAction === "add" || !domainName.trim()}
          >
            {loadingAction === "add" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Globe2 className="size-4" />
            )}
            Add domain
          </Button>
        </form>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {loadingAction === "initial" ? (
          <div className="flex h-52 items-center justify-center rounded-lg border border-[#3a3a3a] bg-[#262626] text-sm text-[#b4b4b4]">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading domains
          </div>
        ) : domains.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#464646] bg-[#262626] px-6 py-16 text-center">
            <Globe2 className="mx-auto size-8 text-[#8f8f8f]" />
            <h2 className="mt-4 text-lg font-medium text-white">
              No domains added
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#b4b4b4]">
              Start by adding the domain you want to send email from. DNS
              records will appear after setup succeeds.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {domains.map((item) => (
              <DomainCard
                key={item.id}
                domain={item}
                loadingAction={loadingAction}
                onCopy={copyToClipboard}
                onVerify={verifyDomain}
                onRetry={retryDomain}
                onDelete={deleteDomain}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DomainCard({
  domain,
  loadingAction,
  onCopy,
  onVerify,
  onRetry,
  onDelete,
}: {
  domain: Domain;
  loadingAction: LoadingAction | null;
  onCopy: (value: string, label: string) => Promise<void>;
  onVerify: (domainId: string) => Promise<void>;
  onRetry: (domainId: string) => Promise<void>;
  onDelete: (domainId: string, domain: string) => Promise<void>;
}) {
  const records = domain.dnsRecords ?? [];
  const isVerified = domain.status === "verified";

  return (
    <article className="rounded-lg border border-[#3a3a3a] bg-[#262626]">
      <div className="flex flex-col gap-4 border-b border-[#3a3a3a] p-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-white">
              {domain.domain}
            </h2>
            <span
              className={cn(
                "inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium capitalize",
                statusClassName(domain.status),
              )}
            >
              {domain.status}
            </span>
            {domain.dkimVerified ? (
              <span className="inline-flex h-6 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 text-xs text-emerald-300">
                <CheckCircle2 className="size-3" />
                DKIM
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-[#9b9b9b]">
            Add these records at your DNS provider, then verify the domain.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg border-[#464646] bg-[#1f1f1f] text-[#ececec] hover:bg-[#303030]"
            disabled={loadingAction === `verify:${domain.id}`}
            onClick={() => onVerify(domain.id)}
          >
            {loadingAction === `verify:${domain.id}` ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCcw className="size-4" />
            )}
            Check
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-lg border-[#464646] bg-[#1f1f1f] text-[#ececec] hover:bg-[#303030]"
            disabled={loadingAction === `retry:${domain.id}` || isVerified}
            onClick={() => onRetry(domain.id)}
          >
            {loadingAction === `retry:${domain.id}` ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            Retry
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-lg"
            disabled={loadingAction === `delete:${domain.id}`}
            onClick={() => onDelete(domain.id, domain.domain)}
          >
            {loadingAction === `delete:${domain.id}` ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Delete
          </Button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="p-4 text-sm text-[#b4b4b4]">
          No DNS records are available. Retry setup to generate records.
        </div>
      ) : (
        <div className="divide-y divide-[#333]">
          {records.map((record, index) => (
            <div
              key={`${record.type}-${record.name}-${index}`}
              className="grid gap-3 p-4 text-sm lg:grid-cols-[88px_minmax(0,1fr)_minmax(0,1.4fr)_96px]"
            >
              <div>
                <div className="mb-1 text-xs text-[#8f8f8f] lg:hidden">
                  Type
                </div>
                <span className="inline-flex h-7 items-center rounded-md border border-[#464646] bg-[#1f1f1f] px-2 font-mono text-xs text-white">
                  {record.type}
                </span>
              </div>

              <RecordValue
                label="Name"
                value={record.name}
                onCopy={() => onCopy(record.name, "Record name")}
              />
              <RecordValue
                label="Value"
                value={formatRecordValue(record)}
                description={record.description}
                onCopy={() => onCopy(formatRecordValue(record), "Record value")}
              />

              <div className="text-[#b4b4b4]">
                <div className="mb-1 text-xs text-[#8f8f8f]">TTL</div>
                <span className="font-mono">{record.ttl}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function RecordValue({
  label,
  value,
  description,
  onCopy,
}: {
  label: string;
  value: string;
  description?: string;
  onCopy: () => void;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-xs text-[#8f8f8f]">{label}</div>
      <div className="flex min-w-0 items-center gap-2">
        <code className="min-w-0 flex-1 overflow-hidden text-ellipsis rounded-md border border-[#3a3a3a] bg-[#1f1f1f] px-2 py-1.5 font-mono text-xs text-[#ececec]">
          {value}
        </code>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-lg text-[#b4b4b4] hover:bg-[#303030] hover:text-white"
          onClick={onCopy}
          aria-label={`Copy ${label.toLowerCase()}`}
        >
          <Clipboard className="size-4" />
        </Button>
      </div>
      {description ? (
        <p className="mt-1 text-xs leading-5 text-[#8f8f8f]">{description}</p>
      ) : null}
    </div>
  );
}
