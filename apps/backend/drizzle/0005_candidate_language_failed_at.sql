ALTER TABLE "candidates" ADD COLUMN "language" text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "failed_at" timestamp;
