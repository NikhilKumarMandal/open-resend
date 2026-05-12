CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_log_id" uuid,
	"event_type" varchar(50) NOT NULL,
	"event_data" jsonb NOT NULL,
	"processed" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_email_log_id_email_logs_id_fk" FOREIGN KEY ("email_log_id") REFERENCES "public"."email_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "webhook_events_emailLogId_idx" ON "webhook_events" USING btree ("email_log_id");--> statement-breakpoint
CREATE INDEX "webhook_events_eventType_idx" ON "webhook_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "webhook_events_processed_idx" ON "webhook_events" USING btree ("processed");--> statement-breakpoint
CREATE INDEX "webhook_events_createdAt_idx" ON "webhook_events" USING btree ("created_at");