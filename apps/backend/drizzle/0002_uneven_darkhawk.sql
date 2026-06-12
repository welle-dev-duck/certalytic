CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"role_id" uuid,
	"name" text NOT NULL,
	"email" text,
	"role_title" text,
	"job_description" text,
	"cv_path" text,
	"cv_text" text,
	"cv_format" text,
	"linkedin_url" text,
	"github_username" text,
	"linkedin_text" text,
	"github_text" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"cv_analysis_results" jsonb,
	"integrity_score" numeric(5, 2),
	"score_breakdown" jsonb,
	"follow_up_suggested" jsonb,
	"high_inconsistency_warning" boolean DEFAULT false NOT NULL,
	"error_message" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_rounds" (
	"id" uuid PRIMARY KEY NOT NULL,
	"candidate_id" uuid NOT NULL,
	"round_number" smallint NOT NULL,
	"transcript_text" text NOT NULL,
	"interviewer_notes" text,
	"was_truncated" boolean DEFAULT false NOT NULL,
	"round_scores" jsonb,
	"variance_delta" numeric(5, 2),
	"deep_dive_prompts" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_exports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"path" text,
	"error_message" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_rounds" ADD CONSTRAINT "interview_rounds_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_exports" ADD CONSTRAINT "role_exports_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_exports" ADD CONSTRAINT "role_exports_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_exports" ADD CONSTRAINT "role_exports_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "candidates_organizationId_idx" ON "candidates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "candidates_organizationId_status_idx" ON "candidates" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "candidates_roleId_idx" ON "candidates" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "interview_rounds_candidate_round_uidx" ON "interview_rounds" USING btree ("candidate_id","round_number");--> statement-breakpoint
CREATE INDEX "interview_rounds_candidateId_idx" ON "interview_rounds" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "role_exports_roleId_status_idx" ON "role_exports" USING btree ("role_id","status");