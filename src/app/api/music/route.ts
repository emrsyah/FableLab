
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ELEVENLABS_API_KEY is missing" }, { status: 500 });
    }

    // ElevenLabs Sound Generation Endpoint
    const url = "https://api.elevenlabs.io/v1/sound-generation";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: prompt, // The description of the sound
        duration_seconds: 10, // Generate a loopable clip
        prompt_influence: 0.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs Sound Gen Error:", errorText);
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    // Stream the response body directly
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });

  } catch (error: any) {
    console.error("Music API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
