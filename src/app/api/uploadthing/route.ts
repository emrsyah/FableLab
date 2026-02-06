import { createRouteHandler } from "uploadthing/next";
import { uploadthingRouter } from "@/lib/uploadthing";

// Export routes for Next.js App Router
export const { GET, POST } = createRouteHandler({
  router: uploadthingRouter,
  config: {
    // Optional: customize uploadthing behavior
  },
});
