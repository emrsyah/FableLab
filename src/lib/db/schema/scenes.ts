import {
  boolean,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { lessons } from "./lessons";

export const scenes = pgTable("scenes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  lessonId: text("lesson_id").references(() => lessons.id, {
    onDelete: "cascade",
  }),
  sceneNumber: integer("scene_number").notNull(), // 1-7

  // Content
  title: text("title").notNull(),
  storyText: text("story_text").notNull(), // 150-200 words
  learningObjective: text("learning_objective").notNull(),

  // Visual
  visualType: text("visual_type", {
    enum: ["image", "geogebra", "video"],
  }).default("image"),
  imageUrl: text("image_url"),
  geogebraConfig: text("geogebra_config"), // XML or commands

  // Audio
  narrationUrl: text("narration_url"),
  narrationDuration: integer("narration_duration"), // seconds
  backgroundMusicUrl: text("background_music_url"),

  // Quiz (nullable - only for milestone scenes)
  hasQuiz: boolean("has_quiz").default(false),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const quizzes = pgTable("quizzes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  sceneId: text("scene_id").references(() => scenes.id, {
    onDelete: "cascade",
  }),

  question: text("question").notNull(),
  options: json("options").$type<string[]>().notNull(), // 4 options
  correctIndex: integer("correct_index").notNull(), // 0-3
  explanation: text("explanation").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});
