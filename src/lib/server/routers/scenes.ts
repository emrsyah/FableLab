import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { quizzes, scenes } from "@/lib/db/schema/scenes";
import { protectedProcedure, publicProcedure, router } from "@/lib/server/trpc";

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
            correctIndex: quizzes.correctIndex,
            explanation: quizzes.explanation,
            sceneId: quizzes.sceneId,
            createdAt: quizzes.createdAt,
            updatedAt: quizzes.updatedAt,
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
        visualType: z
          .enum(["image", "geogebra", "p5", "video"])
          .default("image"),
        imageUrl: z.string().optional(),
        geogebraConfig: z.string().optional(),
        p5Config: z.string().optional(),
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
          p5Config: input.p5Config,
          narrationUrl: input.narrationUrl,
          narrationDuration: input.narrationDuration,
          backgroundMusicUrl: input.backgroundMusicUrl,
          hasQuiz: input.hasQuiz,
        })
        .returning();
      return newScene;
    }),
});
