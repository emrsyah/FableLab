import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [anonymousClient()],
  /** The base URL of the server (optional if you're using the same domain) */
  // baseURL: process.env.NEXT_PUBLIC_BASE_URL!
});
