import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

/**
 * Uploadthing file router configuration.
 * Defines the allowed file types and upload behavior.
 */
export const uploadthingRouter = {
  // Audio file uploader for TTS narration
  audioUploader: f({
    audio: { maxFileSize: "16MB", maxFileCount: 1 },
  }).onUploadComplete(async ({ file }) => {
    console.log("Audio upload complete:", file.ufsUrl);
    return { url: file.ufsUrl };
  }),

  // Image uploader (for future use)
  imageUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
  }).onUploadComplete(async ({ file }) => {
    console.log("Image upload complete:", file.ufsUrl);
    return { url: file.ufsUrl };
  }),
} satisfies FileRouter;

export type UploadthingRouter = typeof uploadthingRouter;
