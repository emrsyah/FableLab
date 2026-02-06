import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

/**
 * Available Gemini TTS voices.
 * See: https://ai.google.dev/gemini-api/docs/speech-generation#voices
 */
export const GEMINI_TTS_VOICES = [
  "Zephyr", // Bright
  "Puck", // Upbeat
  "Charon", // Informative
  "Kore", // Firm
  "Fenrir", // Excitable
  "Leda", // Youthful
  "Orus", // Firm
  "Aoede", // Breezy
  "Callirrhoe", // Easy-going
  "Autonoe", // Bright
  "Enceladus", // Breathy
  "Iapetus", // Clear
  "Umbriel", // Easy-going
  "Algieba", // Smooth
  "Despina", // Smooth
  "Erinome", // Clear
  "Algenib", // Gravelly
  "Rasalgethi", // Informative
  "Laomedeia", // Upbeat
  "Achernar", // Soft
  "Alnilam", // Firm
  "Schedar", // Even
  "Gacrux", // Mature
  "Pulcherrima", // Forward
  "Achird", // Friendly
  "Zubenelgenubi", // Casual
  "Vindemiatrix", // Gentle
  "Sadachbia", // Lively
  "Sadaltager", // Knowledgeable
  "Sulafat", // Warm
] as const;

export type GeminiVoice = (typeof GEMINI_TTS_VOICES)[number];

interface GenerateNarrationResult {
  audioUrl: string;
  durationSeconds: number;
}

/**
 * Generate narration audio using Gemini TTS API and upload to Uploadthing.
 *
 * @param text - The narration text to convert to speech
 * @param voiceName - The voice to use (default: "Kore" - firm, educational voice)
 * @returns Object with audioUrl and estimated duration
 */
export async function generateNarrationAudio(
  text: string,
  voiceName: GeminiVoice = "Kore",
): Promise<GenerateNarrationResult> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }

  // Call Gemini TTS API
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Read this educational narration in a clear, engaging way for students: ${text}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName,
              },
            },
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini TTS Error:", errorText);
    throw new Error(`Gemini TTS API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Extract audio data from response
  const audioBase64 =
    data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!audioBase64) {
    throw new Error("No audio data received from Gemini TTS");
  }

  // Decode base64 to buffer - Gemini returns raw PCM audio (24kHz, 16-bit, mono)
  const audioBuffer = Buffer.from(audioBase64, "base64");

  // Convert PCM to WAV format
  const wavBuffer = pcmToWav(audioBuffer, 24000, 16, 1);

  // Create a File object for uploadthing
  // Convert Buffer to Uint8Array to satisfy BlobPart type
  const audioFile = new File(
    [new Uint8Array(wavBuffer)],
    `narration-${Date.now()}.wav`,
    { type: "audio/wav" },
  );

  // Upload to Uploadthing
  const uploadResult = await utapi.uploadFiles([audioFile]);

  if (!uploadResult[0]?.data?.ufsUrl) {
    throw new Error("Failed to upload audio to Uploadthing");
  }

  // Estimate duration: PCM is 24kHz, 16-bit (2 bytes per sample), mono
  const bytesPerSecond = 24000 * 2 * 1; // sample rate * bytes per sample * channels
  const durationSeconds = Math.ceil(audioBuffer.length / bytesPerSecond);

  return {
    audioUrl: uploadResult[0].data.ufsUrl,
    durationSeconds,
  };
}

/**
 * Convert raw PCM audio data to WAV format.
 * Gemini TTS returns raw PCM (24kHz, 16-bit, mono).
 */
function pcmToWav(
  pcmData: Buffer,
  sampleRate: number,
  bitsPerSample: number,
  numChannels: number,
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const headerSize = 44;
  const fileSize = headerSize + dataSize;

  const buffer = Buffer.alloc(fileSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write("WAVE", 8);

  // fmt sub-chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcmData.copy(buffer, 44);

  return buffer;
}

/**
 * Voice selection based on content type.
 * Returns a voice suitable for educational content.
 */
export function selectVoiceForEducation(
  targetAge: "elementary" | "middle" | "high" = "middle",
): GeminiVoice {
  switch (targetAge) {
    case "elementary":
      return "Puck"; // Upbeat, engaging for younger students
    case "middle":
      return "Kore"; // Firm, clear for middle schoolers
    case "high":
      return "Charon"; // Informative, mature for high schoolers
    default:
      return "Kore";
  }
}
