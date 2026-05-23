ALTER TABLE "user_profiles" ALTER COLUMN "skills" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "resume_key" varchar(255);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "resume_file_name" varchar(255);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "resume_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "resume_url";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "plan_credits";