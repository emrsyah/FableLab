import { subscribe } from "@fal-ai/serverless-client";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { lessons } from "@/lib/db/schema/lessons";
import { quizzes, scenes } from "@/lib/db/schema/scenes";
import { generateScene } from "./gemini/scene-generator";

type LessonGeneratorParams = {
  topic: string;
  complexity: "Elementary" | "Middle" | "High";
  userId?: string;
};

const SCENE_TYPES = ["Introduction", "Foundation", "Checkpoint"];

// Import moved to top-level in next step, but assumed available
export async function generateImageForScene(
  sceneContent: { title: string; storyText: string },
  sceneNumber: number,
  complexity: string,
): Promise<string> {
  const apiKey = process.env.FAL_KEY;

  if (!apiKey) {
    console.warn("FAL_KEY is not set. Skipping image generation.");
    return `https://placehold.co/1920x1080/000000/FFFFFF/png?text=fal_key_missing_${sceneNumber}`;
  }

  try {
    const prompt = `A digital illustration for a STEM lesson titled "${sceneContent.title}". The scene should visualize: "${sceneContent.storyText}". The style should be vibrant and engaging for a ${complexity} level audience.`;

    // Using fal-ai/flux/schnell for fast generation
    const result: any = await subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: "landscape_16_9",
        num_inference_steps: 4,
        seed: Math.floor(Math.random() * 1000000),
        enable_safety_checker: true,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    if (result.images && result.images.length > 0) {
      return result.images[0].url;
    }

    throw new Error("No image URL returned from Fal.ai");
  } catch (error: any) {
    console.error(
      `Error generating image with Fal.ai for scene ${sceneNumber}:`,
      error,
    );
    return `https://placehold.co/1920x1080/DD2C00/FFFFFF/png?text=Image+Gen+Failed+(${sceneNumber})`;
  }
}

export async function generateLesson(params: LessonGeneratorParams) {
  const returnedLessons = await db
    .insert(lessons)
    .values({
      topic: params.topic,
      complexity: params.complexity,
      userId: params.userId,
      title: `Lesson on ${params.topic}`, // Placeholder title
    })
    .returning();

  if (!returnedLessons || returnedLessons.length === 0) {
    console.error("Database did not return a lesson after insert.");
    throw new Error("Failed to create lesson in the database.");
  }
  const lesson = returnedLessons[0];

  let previousScenesSummary = "";
  const generatedScenes = [];

  // 2. Generate each scene
  for (let i = 0; i < SCENE_TYPES.length; i++) {
    const sceneNumber = i + 1;
    const sceneType = SCENE_TYPES[i];
    const hasQuiz = sceneNumber === 3 || sceneNumber === 6;

    const generatedContent = await generateScene({
      sceneNumber,
      complexity: params.complexity,
      lessonTopic: params.topic,
      sceneType,
      previousScenesSummary,
    });

    const imageUrl = await generateImageForScene(
      generatedContent,
      sceneNumber,
      params.complexity,
    );

    // 3. Save the scene to the database

    const returnedScenes = await db
      .insert(scenes)
      .values({
        lessonId: lesson.id,
        sceneNumber,
        title: generatedContent.title,
        storyText: generatedContent.storyText,
        learningObjective: generatedContent.learningObjective,
        hasQuiz,
        visualType: "image",
        imageUrl: imageUrl,
        // geogebraConfig is ignored as per user instruction
      })
      .returning();

    if (!returnedScenes || returnedScenes.length === 0) {
      console.error(
        `Database did not return a scene after insert for scene number ${sceneNumber}.`,
      );
      throw new Error(
        `Failed to create scene number ${sceneNumber} in the database.`,
      );
    }
    const scene = returnedScenes[0];

    // 4. If the scene has a quiz, save it
    if (hasQuiz && generatedContent.quiz) {
      const returnedQuizzes = await db
        .insert(quizzes)
        .values({
          sceneId: scene.id,
          question: generatedContent.quiz.question,
          options: generatedContent.quiz.options,
          correctIndex: generatedContent.quiz.correctIndex,
          explanation: generatedContent.quiz.explanation,
        })
        .returning();

      if (!returnedQuizzes || returnedQuizzes.length === 0) {
        console.error(
          `Database did not return a quiz after insert for scene number ${sceneNumber}.`,
        );
        throw new Error(
          `Failed to create quiz for scene number ${sceneNumber} in the database.`,
        );
      }
    }

    previousScenesSummary += `Scene ${sceneNumber}: ${generatedContent.storyText}\n`;
    generatedScenes.push(scene);
  }

  // 5. Update lesson title
  if (generatedScenes.length > 0) {
    await db
      .update(lessons)
      .set({ title: generatedScenes[0].title })
      .where(eq(lessons.id, lesson.id));
  }

  return lesson;
}
