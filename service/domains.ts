import { randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { domain, type Domain } from "@/db/schema/domain-schema";
import { buildDNSRecords, registerDomainWithSES } from "@/lib/ses";

function normalizeDomain(domainName: string) {
    return domainName.trim().toLowerCase();
}

export async function getUserDomains(userId: string): Promise<Domain[]> {
    try {
        return await db
            .select()
            .from(domain)
            .where(eq(domain.userId, userId))
            .orderBy(desc(domain.createdAt));
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch domains: ${errorMessage}`);
    }
}

export async function addDomain(userId: string, domainName: string): Promise<Domain> {
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
                domain: normalizedDomain,
                status: "pending",
                verificationToken: sesResult.verificationToken,
                dkimTokens: sesResult.dkimTokens,
                sesConfigurationSet: sesResult.configurationSet,
                dnsRecords,
            })
            .returning();

        return createdDomain;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to add domain: ${errorMessage}`);
    }
}
