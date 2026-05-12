ALTER TABLE "domain" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "domain" ADD CONSTRAINT "domain_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "domain_organizationId_idx" ON "domain" USING btree ("organization_id");
