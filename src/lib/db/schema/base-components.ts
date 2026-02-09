import { json, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { lessons } from "./lessons";

/**
 * Base components for consistent image generation across scenes.
 * Stores reusable assets (characters, backgrounds, style references) generated
 * from the visual style guide, then edited per scene using fal-ai/nano-banana-pro/edit.
 */
export const baseComponents = pgTable("base_components", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  lessonId: text("lesson_id").references(() => lessons.id, {
    onDelete: "cascade",
  }),

  // Component classification
  componentType: text("component_type", {
    enum: ["character", "background", "style_reference", "prop"],
  }).notNull(),

  // Unique name for this component within the lesson
  // e.g., "main_character", "supporting_character_1", "primary_background_wide", "closeup_background"
  componentName: text("component_name").notNull(),

  // Permanent storage URL (Uploadthing)
  imageUrl: text("image_url").notNull(),

  // Optional metadata for prompt building and component selection
  metadata: json("metadata").$type<{
    description?: string;
    tags?: string[];
    generationPrompt?: string;
    spec?: Record<string, unknown>; // Original ADK spec (CharacterSpec, EnvironmentSpec, etc.)
  }>(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});
