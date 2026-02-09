import { GoogleGenAI, Modality } from "@google/genai";
import { MANA_SYSTEM_INSTRUCTION } from "@/lib/ai/safety";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

interface TokenRequest {
  lessonContext: {
    topic: string;
    sceneTitle: string;
    sceneContent: string;
    sceneNumber: number;
  };
}

export async function POST(req: Request) {
  try {
    const body: TokenRequest = await req.json();
    const { lessonContext } = body;

    const systemInstruction = `${MANA_SYSTEM_INSTRUCTION}

Current Lesson Context:
- Topic: ${lessonContext.topic}
- Current Scene (${lessonContext.sceneNumber}): ${lessonContext.sceneTitle}
- Scene Content: ${lessonContext.sceneContent}

Use this context to provide relevant, helpful answers about the current lesson. Keep responses brief and encouraging for voice interaction.`;

    // Create ephemeral token with locked config
    const now = new Date();
    const expireTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
    const newSessionExpireTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes to start

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: expireTime.toISOString(),
        newSessionExpireTime: newSessionExpireTime.toISOString(),
        liveConnectConstraints: {
          model: "gemini-2.5-flash-native-audio-preview-12-2025",
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: systemInstruction,
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Kore" },
              },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        },
        httpOptions: { apiVersion: "v1alpha" },
      },
    });

    return Response.json({
      token: token.name,
      expiresAt: expireTime.toISOString(),
    });
  } catch (error) {
    console.error("Error creating ephemeral token:", error);
    return Response.json(
      { error: "Failed to create voice session token" },
      { status: 500 },
    );
  }
}
