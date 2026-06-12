CREATE TABLE "billing_pack_purchases" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"stripe_checkout_session_id" text NOT NULL,
	"pack_key" text NOT NULL,
	"tokens" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_pack_purchases_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id")
);
--> statement-breakpoint
ALTER TABLE "billing_pack_purchases" ADD CONSTRAINT "billing_pack_purchases_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "billing_pack_purchases_organizationId_idx" ON "billing_pack_purchases" USING btree ("organization_id");