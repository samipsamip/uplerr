CREATE TABLE "resume_moderations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"raw_text" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "is_banned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "resume_moderations" ADD CONSTRAINT "resume_moderations_profile_id_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;