import { relations } from "drizzle-orm";
import {
    pgTable,
    text,
    timestamp,
    boolean,
    jsonb,
    index,
    uniqueIndex,
    pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";


export const domainStatus = pgEnum("domain_status", [
    "pending",   
    "verifying", 
    "verified",  
    "failed",   
]);



export type DNSRecord = {
    type: "TXT" | "CNAME" | "MX";
    name: string;
    value: string;
    ttl: number;
    priority?: number;     
    description: string;
};

export type SmtpCredentials = {
    username: string;
    password: string;        
    host: string;
    port: number;
};


export const domain = pgTable(
    "domain",
    {
        id: text("id").primaryKey(), 

        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),

        domain: text("domain").notNull(),

        status: domainStatus("status").default("pending").notNull(),

        verificationToken: text("verification_token"),
        dkimTokens: jsonb("dkim_tokens").$type<string[]>().default([]),
        dkimVerified: boolean("dkim_verified").default(false).notNull(),

        sesConfigurationSet: text("ses_configuration_set"),

        dnsRecords: jsonb("dns_records").$type<DNSRecord[]>().default([]),

        smtpCredentials: jsonb("smtp_credentials").$type<SmtpCredentials>(),

        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        uniqueIndex("domain_domain_uidx").on(table.domain),
        index("domain_userId_idx").on(table.userId),
        index("domain_status_idx").on(table.status),   
    ]
);



export const domainRelations = relations(domain, ({ one }) => ({
    user: one(user, {
        fields: [domain.userId],
        references: [user.id],
    }),
}));

// Add to your existing userRelations in auth-schema.ts:
// domains: many(domain)


export type Domain = typeof domain.$inferSelect;
export type NewDomain = typeof domain.$inferInsert;
export type DomainStatus = (typeof domainStatus.enumValues)[number];



export const domainSchema = {
    domain,
};