CREATE TABLE "lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"topic" text NOT NULL,
	"complexity" text NOT NULL,
	"title" text NOT NULL,
	"slug" text,
	"views" integer DEFAULT 0,
	"completions" integer DEFAULT 0,
	"user_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "lessons_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" text PRIMARY KEY NOT NULL,
	"scene_id" text,
	"question" text NOT NULL,
	"options" json NOT NULL,
	"correct_index" integer NOT NULL,
	"explanation" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scenes" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text,
	"scene_number" integer NOT NULL,
	"title" text NOT NULL,
	"story_text" text NOT NULL,
	"learning_objective" text NOT NULL,
	"visual_type" text DEFAULT 'image',
	"image_url" text,
	"geogebra_config" text,
	"narration_url" text,
	"narration_duration" integer,
	"background_music_url" text,
	"has_quiz" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;