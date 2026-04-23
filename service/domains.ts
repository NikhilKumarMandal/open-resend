
export interface DNSRecord {
    type: string;
    name: string;
    value: string;
    ttl?: number;
}

function safeParseDNSRecords(dnsRecords: unknown): DNSRecord[] {
    if (!dnsRecords) return [];
    if (typeof dnsRecords === "string") {
        try {
            return JSON.parse(dnsRecords);
        } catch {
            return [];
        }
    }
    if (Array.isArray(dnsRecords)) {
        return dnsRecords;
    }
    return [];
};


export async function getUserDomains(userId: string): Promise<Domain[]> {
    try {
        const result = await query(
            `SELECT * FROM domains 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
            [userId]
        );

        return result.rows.map((row) => ({
            ...row,
            dns_records: safeParseDNSRecords(row.dns_records),
        }));
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch domains: ${errorMessage}`);
    }
}