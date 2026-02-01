ALTER TABLE "scenes" ALTER COLUMN "visual_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "narration_alignment" json;