import { router } from "@/lib/server/trpc";
import { lessonsRouter } from "./lessons";
import { quizzesRouter } from "./quizzes";
import { scenesRouter } from "./scenes";
import { usersRouter } from "./users";

export const appRouter = router({
  users: usersRouter,
  scenes: scenesRouter,
  quizzes: quizzesRouter,
  lessons: lessonsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
