import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { generateLesson } from "@/lib/ai/lesson-generator";
import { db } from "@/lib/db";
import { lessons } from "@/lib/db/schema/lessons";
import { protectedProcedure, publicProcedure, router } from "@/lib/server/trpc";

export const lessonsRouter = router({
  getById: publicProcedure
    .input(z.object({ lessonId: z.string() }))
    .query(async ({ input }) => {
      const [lesson] = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, input.lessonId))
        .limit(1);

      if (!lesson) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson not found",
        });
      }

      return lesson;
    }),

  generate: protectedProcedure
    .input(
      z.object({
        topic: z.string(),
        complexity: z.enum(["Elementary", "Middle", "High"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const lesson = await generateLesson({
          topic: input.topic,
          complexity: input.complexity,
          userId: ctx.session.user?.id,
        });
        return { lessonId: lesson.id };
      } catch (error) {
        console.error("Failed to generate lesson:", error);
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to generate lesson: ${errorMessage}`,
        });
      }
    }),

  getMyLessons: protectedProcedure.query(async ({ ctx }) => {
    // Only show completed lessons in history
    const userLessons = await ctx.db.query.lessons.findMany({
      where: (lessons, { and, eq }) =>
        and(
          eq(lessons.userId, ctx.session.user.id),
          eq(lessons.status, "completed"),
        ),
      with: {
        scenes: {
          limit: 1,
          orderBy: (scenes, { asc }) => [asc(scenes.sceneNumber)],
        },
      },
      orderBy: (lessons, { desc }) => [desc(lessons.createdAt)],
    });

    return userLessons;
  }),
});
