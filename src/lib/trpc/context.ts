import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";

export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */

  // Get the session from better-auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return {
    db,
    session: session
      ? {
          user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
          },
        }
      : null,
  };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
