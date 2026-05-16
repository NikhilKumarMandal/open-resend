import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import {
    apiKey,
    type ApiKey,
    type ApiKeyPermission,
} from "@/db/schema/api-key-schema";
import { domain } from "@/db/schema/domain-schema";

const API_KEY_PREFIX = "ors";
const API_KEY_RANDOM_BYTES = 32;
const API_KEY_PREFIX_LENGTH = 12;

export type PublicApiKey = Omit<ApiKey, "keyHash">;

export type CreatedApiKey = PublicApiKey & {
    key: string;
};

function getApiKeyHashSecret() {
    const secret = process.env.API_KEY_HASH_SECRET ?? process.env.BETTER_AUTH_SECRET;

    if (!secret) {
        throw new Error("API_KEY_HASH_SECRET or BETTER_AUTH_SECRET must be set");
    }

    return secret;
}

function hashApiKey(key: string) {
    return createHmac("sha256", getApiKeyHashSecret()).update(key).digest("hex");
}

function toPublicApiKey(key: ApiKey): PublicApiKey {
    const { keyHash, ...publicKey } = key;
    void keyHash;
    return publicKey;
}

function domainAccessClause(userId: string, organizationId?: string | null) {
    return organizationId
        ? or(eq(domain.userId, userId), eq(domain.organizationId, organizationId))
        : eq(domain.userId, userId);
}

export function generateApiKey() {
    return `${API_KEY_PREFIX}_${randomBytes(API_KEY_RANDOM_BYTES).toString("base64url")}`;
}

export function verifyApiKey(rawKey: string, storedHash: string) {
    const rawHash = Buffer.from(hashApiKey(rawKey), "hex");
    const savedHash = Buffer.from(storedHash, "hex");

    if (rawHash.length !== savedHash.length) {
        return false;
    }

    return timingSafeEqual(rawHash, savedHash);
}

export async function getAccessibleApiKeys(input: {
    userId: string;
    organizationId?: string | null;
}): Promise<PublicApiKey[]> {
    const keys = await db
        .select({
            id: apiKey.id,
            userId: apiKey.userId,
            domainId: apiKey.domainId,
            keyName: apiKey.keyName,
            keyPrefix: apiKey.keyPrefix,
            permissions: apiKey.permissions,
            lastUsedAt: apiKey.lastUsedAt,
            createdAt: apiKey.createdAt,
            updatedAt: apiKey.updatedAt,
        })
        .from(apiKey)
        .innerJoin(domain, eq(apiKey.domainId, domain.id))
        .where(domainAccessClause(input.userId, input.organizationId))
        .orderBy(desc(apiKey.createdAt));

    return keys;
}

export async function createAccessibleApiKey(input: {
    userId: string;
    organizationId?: string | null;
    domainId: string;
    keyName: string;
    permissions: ApiKeyPermission[];
}): Promise<CreatedApiKey> {
    const [ownedDomain] = await db
        .select({ id: domain.id })
        .from(domain)
        .where(
            and(
                eq(domain.id, input.domainId),
                domainAccessClause(input.userId, input.organizationId),
            ),
        )
        .limit(1);

    if (!ownedDomain) {
        throw new Error("Domain not found");
    }

    const rawKey = generateApiKey();
    const [createdKey] = await db
        .insert(apiKey)
        .values({
            userId: input.userId,
            domainId: input.domainId,
            keyName: input.keyName,
            keyHash: hashApiKey(rawKey),
            keyPrefix: rawKey.slice(0, API_KEY_PREFIX_LENGTH),
            permissions: input.permissions,
        })
        .returning();

    return {
        ...toPublicApiKey(createdKey),
        key: rawKey,
    };
}

export async function deleteAccessibleApiKey(input: {
    userId: string;
    organizationId?: string | null;
    apiKeyId: string;
}) {
    const [existingKey] = await db
        .select({ id: apiKey.id })
        .from(apiKey)
        .innerJoin(domain, eq(apiKey.domainId, domain.id))
        .where(
            and(
                eq(apiKey.id, input.apiKeyId),
                domainAccessClause(input.userId, input.organizationId),
            ),
        )
        .limit(1);

    if (!existingKey) {
        return false;
    }

    await db.delete(apiKey).where(eq(apiKey.id, input.apiKeyId));
    return true;
}

export async function authenticateApiKey(rawKey: string) {
    const keyPrefix = rawKey.slice(0, API_KEY_PREFIX_LENGTH);
    const matchingKeys = await db
        .select({
            id: apiKey.id,
            userId: apiKey.userId,
            domainId: apiKey.domainId,
            keyHash: apiKey.keyHash,
            permissions: apiKey.permissions,
            domain: domain.domain,
            domainStatus: domain.status,
            sesConfigurationSet: domain.sesConfigurationSet,
        })
        .from(apiKey)
        .innerJoin(domain, eq(apiKey.domainId, domain.id))
        .where(eq(apiKey.keyPrefix, keyPrefix));

    const authenticatedKey = matchingKeys.find((key) =>
        verifyApiKey(rawKey, key.keyHash),
    );

    if (!authenticatedKey) {
        return null;
    }

    await db
        .update(apiKey)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKey.id, authenticatedKey.id));

    const { keyHash, ...publicKey } = authenticatedKey;
    void keyHash;

    return publicKey;
}
