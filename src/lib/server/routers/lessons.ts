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
});
