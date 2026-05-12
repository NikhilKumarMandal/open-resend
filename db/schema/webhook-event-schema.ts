import { relations } from "drizzle-orm";
import {
    boolean,
    index,
    jsonb,
    pgTable,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { emailLog } from "./email-log-schema";

export type WebhookEventType =
    | "sent"
    | "delivered"
    | "bounced"
    | "complained"
    | "failed"
    | "opened"
    | "clicked";

export const webhookEvent = pgTable(
    "webhook_events",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        emailLogId: uuid("email_log_id").references(() => emailLog.id, {
            onDelete: "cascade",
        }),

        eventType: varchar("event_type", { length: 50 })
            .$type<WebhookEventType>()
            .notNull(),
        eventData: jsonb("event_data").$type<Record<string, unknown>>().notNull(),
        processed: boolean("processed").default(false),

        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("webhook_events_emailLogId_idx").on(table.emailLogId),
        index("webhook_events_eventType_idx").on(table.eventType),
        index("webhook_events_processed_idx").on(table.processed),
        index("webhook_events_createdAt_idx").on(table.createdAt),
    ],
);

export const webhookEventRelations = relations(webhookEvent, ({ one }) => ({
    emailLog: one(emailLog, {
        fields: [webhookEvent.emailLogId],
        references: [emailLog.id],
    }),
}));

export type WebhookEvent = typeof webhookEvent.$inferSelect;
export type NewWebhookEvent = typeof webhookEvent.$inferInsert;

export const webhookEventSchema = {
    webhookEvent,
};
