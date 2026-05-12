CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_key_id" text,
	"domain_id" text NOT NULL,
	"message_id" varchar(255),
	"from_email" varchar(255) NOT NULL,
	"to_emails" jsonb NOT NULL,
	"cc_emails" jsonb DEFAULT '[]'::jsonb,
	"bcc_emails" jsonb DEFAULT '[]'::jsonb,
	"subject" varchar(500),
	"html_content" text,
	"text_content" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(50) DEFAULT 'pending',
	"ses_message_id" varchar(255),
	"error_message" text,
	"webhook_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_domain_id_domain_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domain"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_logs_apiKeyId_idx" ON "email_logs" USING btree ("api_key_id");--> statement-breakpoint
CREATE INDEX "email_logs_domainId_idx" ON "email_logs" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "email_logs_messageId_idx" ON "email_logs" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "email_logs_status_idx" ON "email_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_logs_createdAt_idx" ON "email_logs" USING btree ("created_at");