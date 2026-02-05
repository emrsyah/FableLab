"use server";

import { generateImageForScene } from "@/lib/ai/lesson-generator";

export async function testGenerateImage(formData: FormData) {
  const title = formData.get("title") as string;
  const storyText = formData.get("storyText") as string;
  const complexity =
    (formData.get("complexity") as "Elementary" | "Middle" | "High") ||
    "Elementary";

  try {
    const imageUrl = await generateImageForScene(
      { title, storyText },
      1, // default scene number
      complexity,
    );
    return { success: true, imageUrl };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
