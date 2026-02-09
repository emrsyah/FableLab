import { type NextRequest, NextResponse } from "next/server";

const ADK_API_URL = process.env.ADK_BASE_URL || "http://localhost:8000";
const APP_NAME = "fable_agent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId, prompt, targetAge, sceneCount } = body;

    // Map frontend values to backend expected format
    const educationLevel =
      targetAge === "elementary"
        ? "elementary_school"
        : targetAge === "middle"
          ? "middle_school"
          : "high_school";

    // First, try to create the session
    try {
      await fetch(
        `${ADK_API_URL}/apps/${APP_NAME}/users/${userId}/sessions/${sessionId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
    } catch (error) {
      // Session might already exist or error - continue anyway
      console.log("Session creation attempt:", error);
    }

    // Format the prompt with education level and scene count
    const formattedPrompt = `Education: ${educationLevel}, Length: ${sceneCount}, Topic: ${prompt}`;

    // Now call /run_sse
    const response = await fetch(`${ADK_API_URL}/run_sse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appName: APP_NAME,
        userId: userId,
        sessionId: sessionId,
        newMessage: {
          role: "user",
          parts: [{ text: formattedPrompt }],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `ADK API error: ${response.status} - ${errorText}` },
        { status: response.status },
      );
    }

    // Stream the response back to the client
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        if (!response.body) {
          controller.close();
          return;
        }

        const reader = response.body.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            controller.enqueue(encoder.encode(text));
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
