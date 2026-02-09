CREATE TABLE "base_components" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text,
	"component_type" text NOT NULL,
	"component_name" text NOT NULL,
	"image_url" text NOT NULL,
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "base_component_ids" json;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_anonymous" boolean;--> statement-breakpoint
ALTER TABLE "base_components" ADD CONSTRAINT "base_components_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;