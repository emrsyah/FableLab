import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessons } from "@/lib/db/schema/lessons";

/**
 * Creates a lesson shell immediately and returns the lessonId for redirect.
 * The actual generation happens via the stream endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, prompt, targetAge, _sceneCount } = body;

    // Map frontend values to backend expected format
    const complexity =
      targetAge === "elementary"
        ? "Elementary"
        : targetAge === "middle"
          ? "Middle"
          : "High";

    // Generate a predictable ID so we can redirect immediately
    const lessonId = nanoid();

    // Create lesson with "generating" status
    await db.insert(lessons).values({
      id: lessonId,
      topic: prompt,
      complexity: complexity,
      title: `Generating lesson...`, // Placeholder, will be updated
      status: "generating",
      userId: userId || null,
    });

    return NextResponse.json({
      success: true,
      lessonId: lessonId,
    });
  } catch (error) {
    console.error("Create lesson error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
