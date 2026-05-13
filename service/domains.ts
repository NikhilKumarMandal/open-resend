import { randomUUID } from "crypto";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import {
    domain,
    type DNSRecord,
    type Domain,
    type DomainStatus,
} from "@/db/schema/domain-schema";
import {
    buildDNSRecords,
    deleteDomainFromSES,
    getSESDomainStatus,
    registerDomainWithSES,
} from "@/lib/ses";

function normalizeDomain(domainName: string) {
    return domainName.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

function domainAccessClause(userId: string, organizationId?: string | null) {
    return organizationId
        ? or(eq(domain.userId, userId), eq(domain.organizationId, organizationId))
        : eq(domain.userId, userId);
}

function toDomainSetupResponse(domainRecord: Domain) {
    return {
        domain: domainRecord,
        dnsRecords: domainRecord.dnsRecords ?? [],
    };
}

export async function getUserDomains(
    userId: string,
    organizationId?: string | null,
): Promise<Domain[]> {
    try {
        return await db
            .select()
            .from(domain)
            .where(domainAccessClause(userId, organizationId))
            .orderBy(desc(domain.createdAt));
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch domains: ${errorMessage}`);
    }
}

export async function getAccessibleDomain(input: {
    userId: string;
    organizationId?: string | null;
    domainId: string;
}): Promise<Domain | null> {
    const [domainRecord] = await db
        .select()
        .from(domain)
        .where(
            and(
                eq(domain.id, input.domainId),
                domainAccessClause(input.userId, input.organizationId),
            ),
        )
        .limit(1);

    return domainRecord ?? null;
}

export async function addDomain(
    userId: string,
    domainName: string,
    organizationId?: string | null,
): Promise<{ domain: Domain; dnsRecords: DNSRecord[] }> {
    const normalizedDomain = normalizeDomain(domainName);

    try {
        const sesResult = await registerDomainWithSES(normalizedDomain);
        const dnsRecords = buildDNSRecords(
            normalizedDomain,
            sesResult.verificationToken,
            sesResult.dkimTokens,
        );

        const [createdDomain] = await db
            .insert(domain)
            .values({
                id: randomUUID(),
                userId,
                organizationId,
                domain: normalizedDomain,
                status: "pending",
                verificationToken: sesResult.verificationToken,
                dkimTokens: sesResult.dkimTokens,
                sesConfigurationSet: sesResult.configurationSet,
                dnsRecords,
            })
            .returning();

        return toDomainSetupResponse(createdDomain);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to add domain: ${errorMessage}`);
    }
}

export async function refreshDomainStatus(input: {
    userId: string;
    organizationId?: string | null;
    domainId: string;
}): Promise<Domain | null> {
    const existingDomain = await getAccessibleDomain(input);

    if (!existingDomain) {
        return null;
    }

    const sesStatus = await getSESDomainStatus(existingDomain.domain);
    const status: DomainStatus =
        sesStatus.sesVerified && sesStatus.dkimVerified ? "verified" : "pending";

    const [updatedDomain] = await db
        .update(domain)
        .set({
            status,
            dkimVerified: sesStatus.dkimVerified,
        })
        .where(eq(domain.id, existingDomain.id))
        .returning();

    return updatedDomain;
}

export async function retryDomainSetup(input: {
    userId: string;
    organizationId?: string | null;
    domainId: string;
}): Promise<{ domain: Domain; dnsRecords: DNSRecord[] } | null> {
    const existingDomain = await getAccessibleDomain(input);

    if (!existingDomain) {
        return null;
    }

    const sesResult = await registerDomainWithSES(existingDomain.domain);
    const dnsRecords = buildDNSRecords(
        existingDomain.domain,
        sesResult.verificationToken,
        sesResult.dkimTokens,
    );

    const [updatedDomain] = await db
        .update(domain)
        .set({
            status: "pending",
            verificationToken: sesResult.verificationToken,
            dkimTokens: sesResult.dkimTokens,
            dkimVerified: false,
            sesConfigurationSet: sesResult.configurationSet,
            dnsRecords,
        })
        .where(eq(domain.id, existingDomain.id))
        .returning();

    return toDomainSetupResponse(updatedDomain);
}

export async function deleteAccessibleDomain(input: {
    userId: string;
    organizationId?: string | null;
    domainId: string;
}) {
    const existingDomain = await getAccessibleDomain(input);

    if (!existingDomain) {
        return false;
    }

    await deleteDomainFromSES(existingDomain.domain);
    await db.delete(domain).where(eq(domain.id, existingDomain.id));
    return true;
}
