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

/**
 * Word-level alignment data for karaoke effect
 */
export interface NarrationAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

interface GenerateNarrationResult {
  audioUrl: string;
  durationSeconds: number;
  alignment?: NarrationAlignment;
}

/**
 * Generate word-level alignments using Gemini's audio understanding.
 * Takes the audio URL and original transcript, returns character-level timing.
 */
async function generateWordAlignments(
  audioBase64: string,
  transcript: string,
): Promise<NarrationAlignment | null> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    console.error("No API key for alignment generation");
    return null;
  }

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: "audio/wav",
                    data: audioBase64,
                  },
                },
                {
                  text: `You are a precise audio alignment tool. Listen to this audio and align it with the following transcript. For EACH WORD in the transcript, provide the exact start and end time in seconds when that word is spoken.

TRANSCRIPT:
${transcript}

Return ONLY a valid JSON object with this exact structure:
{
  "words": [
    { "word": "first_word", "start": 0.0, "end": 0.5 },
    { "word": "second_word", "start": 0.5, "end": 1.0 }
  ]
}

Rules:
1. Include EVERY word from the transcript, in order
2. Times must be in seconds with decimal precision
3. Words should not overlap
4. Cover the entire audio duration
5. Return ONLY the JSON, no markdown or explanation`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini Alignment Error:", errorText);
      return null;
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error("No alignment data in response");
      return null;
    }

    // Parse the JSON response
    const alignmentData = JSON.parse(responseText) as {
      words: Array<{ word: string; start: number; end: number }>;
    };

    if (!alignmentData.words || !Array.isArray(alignmentData.words)) {
      console.error("Invalid alignment data structure");
      return null;
    }

    // Convert to our schema format (word-level, not character-level)
    const characters: string[] = [];
    const startTimes: number[] = [];
    const endTimes: number[] = [];

    for (const wordData of alignmentData.words) {
      characters.push(wordData.word);
      startTimes.push(wordData.start);
      endTimes.push(wordData.end);
    }

    return {
      characters,
      character_start_times_seconds: startTimes,
      character_end_times_seconds: endTimes,
    };
  } catch (error) {
    console.error("Error generating word alignments:", error);
    return null;
  }
}

/**
 * Generate narration audio using Gemini TTS API and upload to Uploadthing.
 * Also generates word-level alignments for karaoke effect.
 *
 * @param text - The narration text to convert to speech
 * @param voiceName - The voice to use (default: "Kore" - firm, educational voice)
 * @returns Object with audioUrl, duration, and optional alignment data
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

  // Run upload and alignment generation in parallel
  const wavBase64 = wavBuffer.toString("base64");
  const [uploadResult, alignment] = await Promise.all([
    utapi.uploadFiles([audioFile]),
    generateWordAlignments(wavBase64, text),
  ]);

  if (!uploadResult[0]?.data?.ufsUrl) {
    throw new Error("Failed to upload audio to Uploadthing");
  }

  // Estimate duration: PCM is 24kHz, 16-bit (2 bytes per sample), mono
  const bytesPerSecond = 24000 * 2 * 1; // sample rate * bytes per sample * channels
  const durationSeconds = Math.ceil(audioBuffer.length / bytesPerSecond);

  return {
    audioUrl: uploadResult[0].data.ufsUrl,
    durationSeconds,
    alignment: alignment ?? undefined,
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
