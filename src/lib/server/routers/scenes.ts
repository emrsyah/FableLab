import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "@/lib/server/trpc";
import { db } from "@/lib/db";
import { scenes, quizzes } from "@/lib/db/schema/scenes";

export const scenesRouter = router({
  getByLessonId: publicProcedure
    .input(z.object({ lessonId: z.string() }))
    .query(async ({ input }) => {
      // Fetch scenes and their associated quizzes
      const sceneList = await db
        .select({
          scene: scenes,
          quiz: {
            id: quizzes.id,
            question: quizzes.question,
            options: quizzes.options,
            // Exclude correctIndex and explanation to prevent cheating
          },
        })
        .from(scenes)
        .leftJoin(quizzes, eq(scenes.id, quizzes.sceneId))
        .where(eq(scenes.lessonId, input.lessonId))
        .orderBy(asc(scenes.sceneNumber));

      return sceneList.map(({ scene, quiz }) => ({
        ...scene,
        quiz: scene.hasQuiz ? quiz : null,
      }));
    }),

  create: protectedProcedure
    .input(
      z.object({
        lessonId: z.string(),
        sceneNumber: z.number(),
        title: z.string(),
        storyText: z.string(),
        learningObjective: z.string(),
        visualType: z.enum(["image", "geogebra", "video"]).default("image"),
        imageUrl: z.string().optional(),
        geogebraConfig: z.string().optional(),
        narrationUrl: z.string().optional(),
        narrationDuration: z.number().optional(),
        backgroundMusicUrl: z.string().optional(),
        hasQuiz: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input }) => {
      const [newScene] = await db
        .insert(scenes)
        .values({
          lessonId: input.lessonId,
          sceneNumber: input.sceneNumber,
          title: input.title,
          storyText: input.storyText,
          learningObjective: input.learningObjective,
          visualType: input.visualType,
          imageUrl: input.imageUrl,
          geogebraConfig: input.geogebraConfig,
          narrationUrl: input.narrationUrl,
          narrationDuration: input.narrationDuration,
          backgroundMusicUrl: input.backgroundMusicUrl,
          hasQuiz: input.hasQuiz,
        })
        .returning();
      return newScene;
    }),
});
