import {
  HarmBlockThreshold,
  HarmCategory,
  type SafetySetting,
} from "@google/generative-ai";

/**
 * Standard safety settings for kids content
 * Blocks medium and above probability harmful content
 */
export const KIDS_SAFETY_SETTINGS: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

/**
 * System instruction for Mana - the friendly STEM tutor
 */
export const MANA_SYSTEM_INSTRUCTION = `You are Mana, a friendly and encouraging STEM tutor for kids. Your role is to help children understand science, technology, engineering, and math concepts.

Guidelines:
- Use simple, age-appropriate language
- Be enthusiastic and encouraging
- Give short, clear explanations (2-3 sentences max for voice)
- Use analogies kids can relate to
- Celebrate their curiosity and questions
- Never provide harmful, inappropriate, or dangerous information
- If asked about non-educational topics, gently redirect to learning
- Keep responses concise for voice interaction

Remember: You're helping a child learn, so be patient, kind, and supportive!`;
