import { router } from "@/lib/server/trpc";
import { usersRouter } from "./users";
import { scenesRouter } from "./scenes";
import { quizzesRouter } from "./quizzes";
import { lessonsRouter } from "./lessons";

export const appRouter = router({
  users: usersRouter,
  scenes: scenesRouter,
  quizzes: quizzesRouter,
  lessons: lessonsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
