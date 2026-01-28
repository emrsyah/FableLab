import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "@/lib/server/trpc";
import { db } from "@/lib/db";
import { quizzes } from "@/lib/db/schema/scenes";
import { TRPCError } from "@trpc/server";

export const quizzesRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        quizId: z.string(),
        selectedOptionIndex: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const [quiz] = await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.id, input.quizId))
        .limit(1);

      if (!quiz) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quiz not found",
        });
      }

      const isCorrect = quiz.correctIndex === input.selectedOptionIndex;

      return {
        correct: isCorrect,
        explanation: quiz.explanation,
        correctIndex: quiz.correctIndex, // Optional: reveal correct answer
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        sceneId: z.string(),
        question: z.string(),
        options: z.array(z.string()).min(2),
        correctIndex: z.number(),
        explanation: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const [newQuiz] = await db
        .insert(quizzes)
        .values({
          sceneId: input.sceneId,
          question: input.question,
          options: input.options,
          correctIndex: input.correctIndex,
          explanation: input.explanation,
        })
        .returning();
      return newQuiz;
    }),
});
