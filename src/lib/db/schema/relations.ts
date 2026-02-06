import { relations } from "drizzle-orm";
import { lessons } from "./lessons";
import { quizzes, scenes } from "./scenes";

export const lessonsRelations = relations(lessons, ({ many }) => ({
  scenes: many(scenes),
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

export const quizzesRelations = relations(quizzes, ({ one }) => ({
  scene: one(scenes, {
    fields: [quizzes.sceneId],
    references: [scenes.id],
  }),
}));
