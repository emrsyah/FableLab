import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import type {
  GeoGebraGenerationRequest,
  GeoGebraGenerationResponse,
} from "@/types/geogebra";

const geoGebraSchema = z.object({
  description: z.string(),
  appName: z.enum(["graphing", "geometry", "3d", "classic", "scientific"]),
  commands: z.array(z.string()),
  parameters: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(["slider", "checkbox", "input"]),
        min: z.number().optional(),
        max: z.number().optional(),
        step: z.number().optional(),
        default: z.number().optional(),
        label: z.string(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  educationalNotes: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const body: GeoGebraGenerationRequest = await req.json();

    const { prompt, targetAge = "middle", complexity = "intermediate" } = body;

    if (!prompt) {
      return Response.json(
        {
          success: false,
          error: "Prompt is required",
        } as GeoGebraGenerationResponse,
        { status: 400 },
      );
    }

    const result = await generateObject({
      model: google("gemini-2.5-flash-lite-preview-09-2025"),
      schema: geoGebraSchema,
      prompt: `Generate a GeoGebra visualization for following request:

Request: "${prompt}"

Target Age: ${targetAge}
Complexity: ${complexity}

Requirements:
1. Use English command names only (GeoGebra commands)
2. Include interactive sliders for key parameters when appropriate
3. Set appropriate coordinate system bounds
4. Use clear object naming (A, B, C for points; f, g for functions)
5. Add helpful text annotations where needed
6. Create an educational and engaging visualization
7. Include a brief description explaining what visualization shows

Available app types:
- graphing: For functions, calculus, algebra
- geometry: For 2D geometric constructions
- 3d: For 3D surfaces, solids, vectors
- classic: Full-featured with all tools
- scientific: Basic calculations, scientific functions

Choose the most appropriate app type for the visualization.

Output valid GeoGebra evalCommand() strings that can be executed sequentially.`,
    });

    const config = result.object;

    return Response.json({
      success: true,
      config: {
        appName: config.appName,
        commands: config.commands,
        parameters: config.parameters,
        description: config.description,
        educationalNotes: config.educationalNotes,
      },
    } as GeoGebraGenerationResponse);
  } catch (error) {
    console.error("Error generating GeoGebra content:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate visualization",
      } as GeoGebraGenerationResponse,
      { status: 500 },
    );
  }
}
