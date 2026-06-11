ALTER TABLE "study_plans" ADD COLUMN "weekly_hours" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "study_plans" ADD COLUMN "timeline_target" text;