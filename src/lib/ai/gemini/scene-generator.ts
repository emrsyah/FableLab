import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const sceneGenerationPrompt = `
You are creating Scene {sceneNumber} of a {complexity} level STEM lesson.

TOPIC: {lessonTopic}
SCENE TYPE: {sceneType}
PREVIOUS SCENES SUMMARY: {previousScenesSummary}

GENERATE THE FOLLOWING (JSON format):
{
  "title": "Engaging scene title (5-10 words)",
  "storyText": "150-200 words narrative. Start with a hook. Use age-appropriate language. Include one key concept.",
  "learningObjective": "One sentence: 'Student will understand...'",

  // Only if Scene 4 (Exploration):
  "geogebraConfig": "GeoGebra commands to create interactive simulation",

  // Only if Scene 3 or 6 (Quiz):
  "quiz": {
    "question": "Question testing the scene's key concept",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": "Why this answer is correct (2-3 sentences)"
  }
}

RULES:
- Story must flow from previous scenes
- Include sensory details (what you see, hear, feel)
- Elementary: simple words, short sentences, playful
- Middle: balanced, some technical terms explained
- High: technical terms, complex reasoning
`;

const quizSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().min(0).max(3),
  explanation: z.string(),
});

const sceneSchema = z.object({
  title: z.string(),
  storyText: z.string(),
  learningObjective: z.string(),
  geogebraConfig: z.string().optional(),
  quiz: quizSchema.optional(),
});

type SceneGeneratorParams = {
  sceneNumber: number;
  complexity: "Elementary" | "Middle" | "High";
  lessonTopic: string;
  sceneType: string;
  previousScenesSummary: string;
};

export async function generateScene(params: SceneGeneratorParams) {
  const prompt = sceneGenerationPrompt
    .replace("{sceneNumber}", params.sceneNumber.toString())
    .replace("{complexity}", params.complexity)
    .replace("{lessonTopic}", params.lessonTopic)
    .replace("{sceneType}", params.sceneType)
    .replace("{previousScenesSummary}", params.previousScenesSummary);

  const { object } = await generateObject({
    model: google("gemini-flash-latest"),
    schema: sceneSchema,
    prompt,
  });

  return object;
}
