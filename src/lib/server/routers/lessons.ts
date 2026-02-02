import { z } from "zod";
import { router, protectedProcedure } from "@/lib/server/trpc";
import { generateLesson } from "@/lib/ai/lesson-generator";
import { TRPCError } from "@trpc/server";

export const lessonsRouter = router({
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
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to generate lesson: ${errorMessage}`,
        });
      }
    }),

  getMyLessons: protectedProcedure.query(async ({ ctx }) => {
    // Basic query to get lessons for the current user
    // Since we don't have direct access to 'db' import here yet (it's in context),
    // and we need to import 'lessons' table schema.
    
    // We need to import 'db' and 'lessons' - adding imports first.
    // For now, let's assume imports will be added in a separate step or I can add them if I rewrite the file.
    // Let's rewrite the file imports to be safe in the next step, or just use context if available.
    
    // Using ctx.db as it is standard in tRPC context
    const userLessons = await ctx.db.query.lessons.findMany({
        where: (lessons, { eq }) => eq(lessons.userId, ctx.session.user.id),
        orderBy: (lessons, { desc }) => [desc(lessons.createdAt)],
    });
    
    return userLessons;
  }),
});
