import { relations } from "drizzle-orm";
import {
    index,
    jsonb,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { domain } from "./domain-schema";

export type ApiKeyPermission = "send" | "receive" | "webhooks";

export const apiKey = pgTable(
    "api_keys",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),

        domainId: text("domain_id")
            .notNull()
            .references(() => domain.id, { onDelete: "cascade" }),

        keyName: varchar("key_name", { length: 255 }).notNull(),
        keyHash: varchar("key_hash", { length: 255 }).notNull(),
        keyPrefix: varchar("key_prefix", { length: 20 }).notNull(),
        permissions: jsonb("permissions")
            .$type<ApiKeyPermission[]>()
            .default(["send"])
            .notNull(),

        lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        uniqueIndex("api_keys_userId_keyName_uidx").on(table.userId, table.keyName),
        index("api_keys_userId_idx").on(table.userId),
        index("api_keys_domainId_idx").on(table.domainId),
        index("api_keys_keyPrefix_idx").on(table.keyPrefix),
    ],
);

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
    user: one(user, {
        fields: [apiKey.userId],
        references: [user.id],
    }),
    domain: one(domain, {
        fields: [apiKey.domainId],
        references: [domain.id],
    }),
}));

export type ApiKey = typeof apiKey.$inferSelect;
export type NewApiKey = typeof apiKey.$inferInsert;

export const apiKeySchema = {
    apiKey,
};
