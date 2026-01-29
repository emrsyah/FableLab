
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ELEVENLABS_API_KEY is missing" }, { status: 500 });
    }

    // ElevenLabs Streaming Endpoint
    // Voice ID: '21m00Tcm4TlvDq8ikWAM' (Rachel) or 'JBFqnCBsd6RMkjVDRZzb' (Adam)
    // Using Rachel as default
    const voiceId = "21m00Tcm4TlvDq8ikWAM"; 
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2", 
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs Error:", errorText);
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    // Stream the response body directly
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });

  } catch (error: any) {
    console.error("TTS API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
