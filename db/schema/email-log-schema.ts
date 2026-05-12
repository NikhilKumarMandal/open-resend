import { relations } from "drizzle-orm";
import {
    index,
    jsonb,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { domain } from "./domain-schema";

export type EmailLogStatus =
    | "pending"
    | "sent"
    | "failed"
    | "delivered"
    | "bounced"
    | "complained";

export type EmailAttachment = {
    filename?: string;
    contentType?: string;
    size?: number;
    path?: string;
    url?: string;
};

export const emailLog = pgTable(
    "email_logs",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        apiKeyId: text("api_key_id"),

        domainId: text("domain_id")
            .notNull()
            .references(() => domain.id, { onDelete: "cascade" }),

        messageId: varchar("message_id", { length: 255 }),
        fromEmail: varchar("from_email", { length: 255 }).notNull(),
        toEmails: jsonb("to_emails").$type<string[]>().notNull(),
        ccEmails: jsonb("cc_emails").$type<string[]>().default([]),
        bccEmails: jsonb("bcc_emails").$type<string[]>().default([]),
        subject: varchar("subject", { length: 500 }),
        htmlContent: text("html_content"),
        textContent: text("text_content"),
        attachments: jsonb("attachments").$type<EmailAttachment[]>().default([]),
        status: varchar("status", { length: 50 })
            .$type<EmailLogStatus>()
            .default("pending"),
        sesMessageId: varchar("ses_message_id", { length: 255 }),
        errorMessage: text("error_message"),
        webhookData: jsonb("webhook_data").$type<Record<string, unknown>>(),

        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("email_logs_apiKeyId_idx").on(table.apiKeyId),
        index("email_logs_domainId_idx").on(table.domainId),
        index("email_logs_messageId_idx").on(table.messageId),
        index("email_logs_status_idx").on(table.status),
        index("email_logs_createdAt_idx").on(table.createdAt),
    ],
);

export const emailLogRelations = relations(emailLog, ({ one }) => ({
    domain: one(domain, {
        fields: [emailLog.domainId],
        references: [domain.id],
    }),
}));

export type EmailLog = typeof emailLog.$inferSelect;
export type NewEmailLog = typeof emailLog.$inferInsert;

export const emailLogSchema = {
    emailLog,
};
