import { subscribe } from "@fal-ai/serverless-client";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessons } from "@/lib/db/schema/lessons";
import { quizzes, scenes } from "@/lib/db/schema/scenes";
import {
  generateNarrationAudio,
  selectVoiceForEducation,
} from "@/lib/tts/gemini-tts";
import type {
  AgentEvent,
  GeoGebraExperimentOutput,
  StoryContentOutput,
} from "@/types/adk-types";

const ADK_API_URL = "http://localhost:8000";
const APP_NAME = "fable_agent";

type RouteContext = {
  params: Promise<{ lessonId: string }>;
};

/**
 * SSE endpoint for lesson generation with database persistence.
 * Streams progress events to the client while processing ADK output.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { lessonId } = await context.params;

  // Verify lesson exists and is in generating state
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  if (lesson.status === "completed") {
    return NextResponse.json(
      { error: "Lesson already completed" },
      { status: 400 },
    );
  }

  // Get query params for generation settings
  const searchParams = request.nextUrl.searchParams;
  const targetAge = searchParams.get("targetAge") || "middle";
  const sceneCount = searchParams.get("sceneCount") || "medium";

  const educationLevel =
    targetAge === "elementary"
      ? "elementary_school"
      : targetAge === "middle"
        ? "middle_school"
        : "high_school";

  const userId = lesson.userId || `user_${Date.now()}`;
  const sessionId = `session_${lessonId}`;

  // Format the prompt
  const formattedPrompt = `Education: ${educationLevel}, Length: ${sceneCount}, Topic: ${lesson.topic}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ event, data })}\n\n`),
        );
      };

      try {
        // Create ADK session
        try {
          await fetch(
            `${ADK_API_URL}/apps/${APP_NAME}/users/${userId}/sessions/${sessionId}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            },
          );
        } catch {
          console.log("Session creation skipped");
        }

        sendEvent("status", {
          message: "Starting generation...",
          agent: "System",
        });

        // Call ADK run_sse
        const adkResponse = await fetch(`${ADK_API_URL}/run_sse`, {
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

        if (!adkResponse.ok) {
          throw new Error(`ADK API error: ${adkResponse.status}`);
        }

        const reader = adkResponse.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let storyContent: StoryContentOutput | null = null;
        let geogebraExperiment: GeoGebraExperimentOutput | null = null;

        // Process SSE stream from ADK
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            try {
              const event: AgentEvent = JSON.parse(line.slice(6));

              // Send progress event to client
              sendEvent("agent", {
                author: event.author,
                hasState: !!event.actions?.stateDelta,
              });

              // Check for state updates
              if (event.actions?.stateDelta) {
                const { stateDelta } = event.actions;

                if (stateDelta.story_content) {
                  storyContent = stateDelta.story_content as StoryContentOutput;
                  sendEvent("status", {
                    message: "Story content received",
                    agent: event.author,
                  });
                }

                if (stateDelta.geogebra_experiment) {
                  geogebraExperiment =
                    stateDelta.geogebra_experiment as GeoGebraExperimentOutput;
                  sendEvent("status", {
                    message: "GeoGebra experiment received",
                    agent: event.author,
                  });
                }
              }

              // Check for completion
              if (event.author === "Finisher") {
                sendEvent("status", {
                  message: "Processing complete, saving to database...",
                  agent: "System",
                });
              }
            } catch (parseError) {
              console.error("Parse error:", parseError);
            }
          }
        }

        // Now persist to database
        if (storyContent && storyContent.scenes.length > 0) {
          sendEvent("status", {
            message: "Creating scenes...",
            agent: "System",
          });

          // Update lesson title from first scene
          await db
            .update(lessons)
            .set({ title: storyContent.scenes[0].title })
            .where(eq(lessons.id, lessonId));

          // Select voice based on target age
          const voiceForAge = selectVoiceForEducation(
            targetAge as "elementary" | "middle" | "high",
          );

          // Create story scenes
          let sceneNumber = 1;
          for (const adkScene of storyContent.scenes) {
            sendEvent("status", {
              message: `Creating scene ${sceneNumber}...`,
              agent: "System",
            });

            // Generate image using Fal.ai
            let imageUrl = "";
            try {
              sendEvent("status", {
                message: `Generating image for scene ${sceneNumber}...`,
                agent: "System",
              });
              imageUrl = await generateImage(
                adkScene.image_prompt,
                adkScene.title,
              );
              sendEvent("scene_image", { sceneNumber, imageUrl });
            } catch (imgError) {
              console.error("Image generation error:", imgError);
              imageUrl = `https://placehold.co/1920x1080/3B82F6/FFFFFF/png?text=Scene+${sceneNumber}`;
            }

            // Generate narration audio using Gemini TTS
            let narrationUrl = "";
            let narrationDuration = 0;
            try {
              sendEvent("status", {
                message: `Generating narration audio for scene ${sceneNumber}...`,
                agent: "System",
              });
              const narrationResult = await generateNarrationAudio(
                adkScene.narration,
                voiceForAge,
              );
              narrationUrl = narrationResult.audioUrl;
              narrationDuration = narrationResult.durationSeconds;
              sendEvent("scene_audio", { sceneNumber, audioUrl: narrationUrl });
            } catch (audioError) {
              console.error("Narration generation error:", audioError);
              // Continue without audio - it's not critical
            }

            // Insert scene
            await db.insert(scenes).values({
              lessonId: lessonId,
              sceneNumber: sceneNumber,
              title: adkScene.title,
              storyText: adkScene.narration,
              learningObjective: `Learning objective for scene ${sceneNumber}`,
              visualType: "image",
              imageUrl: imageUrl,
              narrationUrl: narrationUrl || null,
              narrationDuration: narrationDuration || null,
              hasQuiz: false,
            });

            sendEvent("scene_ready", { sceneNumber });
            sceneNumber++;
          }

          // Add GeoGebra scene if available
          if (geogebraExperiment) {
            sendEvent("status", {
              message: "Creating GeoGebra experiment scene...",
              agent: "System",
            });

            const [_geoScene] = await db
              .insert(scenes)
              .values({
                lessonId: lessonId,
                sceneNumber: sceneNumber,
                title: "Interactive Experiment",
                storyText:
                  geogebraExperiment.setup_instructions ||
                  "Explore this interactive experiment to deepen your understanding.",
                learningObjective:
                  geogebraExperiment.learning_objectives?.join(", ") ||
                  "Interactive learning",
                visualType: "geogebra",
                geogebraConfig: JSON.stringify({
                  appName: "classic",
                  commands: geogebraExperiment.geogebra_commands,
                  description: geogebraExperiment.setup_instructions,
                  educationalNotes: geogebraExperiment.interaction_guide
                    ? [geogebraExperiment.interaction_guide]
                    : [],
                }),
                hasQuiz: false,
              })
              .returning();

            sendEvent("scene_ready", { sceneNumber, type: "geogebra" });
            sceneNumber++;
          }

          // Add quiz scene if questions available
          if (storyContent.questions && storyContent.questions.length > 0) {
            sendEvent("status", {
              message: "Creating quiz scene...",
              agent: "System",
            });

            // Create quiz scene
            const [quizScene] = await db
              .insert(scenes)
              .values({
                lessonId: lessonId,
                sceneNumber: sceneNumber,
                title: "Knowledge Check",
                storyText:
                  "Let's test what you've learned! Answer the following questions.",
                learningObjective: "Assessment of learning",
                visualType: "image",
                imageUrl:
                  "https://placehold.co/1920x1080/10B981/FFFFFF/png?text=Quiz+Time",
                hasQuiz: true,
              })
              .returning();

            // Create first quiz (we can only have one quiz per scene with current schema)
            const firstQuestion = storyContent.questions[0];
            const options = firstQuestion.options || [
              firstQuestion.answer,
              "Option B",
              "Option C",
              "Option D",
            ];
            const correctIndex = options.indexOf(firstQuestion.answer);

            await db.insert(quizzes).values({
              sceneId: quizScene.id,
              question: firstQuestion.question,
              options: options,
              correctIndex: correctIndex >= 0 ? correctIndex : 0,
              explanation: firstQuestion.hint || "Great job!",
            });

            sendEvent("scene_ready", { sceneNumber, type: "quiz" });
          }

          // Mark lesson as completed
          await db
            .update(lessons)
            .set({ status: "completed" })
            .where(eq(lessons.id, lessonId));

          sendEvent("completed", { lessonId, totalScenes: sceneNumber - 1 });
        } else {
          throw new Error("No story content received from ADK");
        }
      } catch (error) {
        console.error("Generation error:", error);

        // Mark lesson as error
        await db
          .update(lessons)
          .set({ status: "error" })
          .where(eq(lessons.id, lessonId));

        sendEvent("error", {
          message: error instanceof Error ? error.message : "Generation failed",
        });
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
}

/**
 * Generate image using Fal.ai and upload to Uploadthing for permanent storage
 */
async function generateImage(prompt: string, title: string): Promise<string> {
  const apiKey = process.env.FAL_KEY;

  if (!apiKey) {
    console.warn("FAL_KEY not set, using placeholder");
    return `https://placehold.co/1920x1080/3B82F6/FFFFFF/png?text=${encodeURIComponent(title)}`;
  }

  const fullPrompt = `A digital illustration for a STEM lesson. ${prompt}. Style: vibrant, educational, engaging for students.`;

  const result: any = await subscribe("fal-ai/nano-banana", {
    input: {
      prompt: fullPrompt,
      image_size: "landscape_16_9",
      num_inference_steps: 4,
      seed: Math.floor(Math.random() * 1000000),
      enable_safety_checker: true,
    },
    logs: false,
  });

  if (!result.images || result.images.length === 0) {
    throw new Error("No image returned from Fal.ai");
  }

  const tempImageUrl = result.images[0].url;

  // Download the image from Fal.ai and re-upload to Uploadthing for permanent storage
  try {
    const { UTApi } = await import("uploadthing/server");
    const utapi = new UTApi();

    // Fetch the image from Fal.ai temporary URL
    const imageResponse = await fetch(tempImageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch image from Fal.ai");
    }

    const imageBlob = await imageResponse.blob();
    const imageFile = new File([imageBlob], `scene-${Date.now()}.png`, {
      type: "image/png",
    });

    // Upload to Uploadthing
    const uploadResult = await utapi.uploadFiles([imageFile]);

    if (uploadResult[0]?.data?.ufsUrl) {
      return uploadResult[0].data.ufsUrl;
    }

    // Fallback to temporary URL if upload fails
    console.warn("Uploadthing upload failed, using temporary Fal.ai URL");
    return tempImageUrl;
  } catch (uploadError) {
    console.error("Error uploading image to Uploadthing:", uploadError);
    // Fallback to temporary URL
    return tempImageUrl;
  }
}
