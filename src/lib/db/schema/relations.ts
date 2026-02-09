import { relations } from "drizzle-orm";
import { baseComponents } from "./base-components";
import { lessons } from "./lessons";
import { quizzes, scenes } from "./scenes";

export const lessonsRelations = relations(lessons, ({ many }) => ({
  scenes: many(scenes),
  baseComponents: many(baseComponents),
}));

export const scenesRelations = relations(scenes, ({ one }) => ({
  lesson: one(lessons, {
    fields: [scenes.lessonId],
    references: [lessons.id],
  }),
  quiz: one(quizzes, {
    fields: [scenes.id],
    references: [quizzes.sceneId],
  }),
}));

export const baseComponentsRelations = relations(baseComponents, ({ one }) => ({
  lesson: one(lessons, {
    fields: [baseComponents.lessonId],
    references: [lessons.id],
  }),
}));

export const quizzesRelations = relations(quizzes, ({ one }) => ({
  scene: one(scenes, {
    fields: [quizzes.sceneId],
    references: [scenes.id],
  }),
}));
