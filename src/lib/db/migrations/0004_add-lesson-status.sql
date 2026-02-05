ALTER TABLE "scenes" ALTER COLUMN "has_quiz" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "status" text DEFAULT 'completed' NOT NULL;