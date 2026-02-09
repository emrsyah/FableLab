import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import type { P5ExperimentOutput } from "@/types/adk-types";

const p5ExperimentSchema = z.object({
  p5_code: z.string().describe("Complete p5.js code for the experiment"),
  setup_instructions: z
    .string()
    .describe("Brief setup instructions for the user"),
  interaction_guide: z.string().describe("How to interact with the experiment"),
  learning_objectives: z.array(z.string()).describe("What the user will learn"),
  variables: z
    .array(z.string())
    .describe("Interactive variables exposed to the user"),
});

interface GenerateRequest {
  prompt: string;
  targetAge?: "elementary" | "middle" | "high";
  compareContext?: {
    title: string;
    prompt: string;
    experiment: P5ExperimentOutput;
  };
}

export async function POST(req: Request) {
  try {
    const body: GenerateRequest = await req.json();
    const { prompt, targetAge = "middle", compareContext } = body;

    if (!prompt) {
      return Response.json(
        { success: false, error: "Prompt is required" },
        { status: 400 },
      );
    }

    const comparisonInstructions = compareContext
      ? `
COMPARISON MODE: The user wants to compare with an existing experiment.
Existing experiment prompt: "${compareContext.prompt}"
Existing experiment title: "${compareContext.title}"

Create a NEW experiment that:
1. Uses similar structure but different parameters
2. Clearly shows the difference being compared
3. Uses the same visual style for easy comparison
4. Has similar interactive controls where applicable
`
      : "";

    const result = await generateObject({
      model: google("gemini-2.5-flash-preview-05-20"),
      schema: p5ExperimentSchema,
      prompt: `You are an expert p5.js developer and STEM educator creating interactive physics experiments for K12 students.

Target Age: ${targetAge}
User Request: "${prompt}"
${comparisonInstructions}

=== P5.JS EXPERIMENT REQUIREMENTS ===

1. CODE STRUCTURE:
   - Use instance mode: \`new p5((p) => { ... })\`
   - Include setup() and draw() functions
   - Make it responsive to container size
   - Use clear variable names

2. INTERACTIVITY:
   - Add sliders for key physics parameters using p5.js createSlider()
   - Add buttons for reset/play/pause where appropriate
   - Make variables adjustable in real-time
   - Show current values on screen

3. VISUAL DESIGN:
   - Use a clean, educational aesthetic
   - Add labels and annotations
   - Use colors to distinguish elements
   - Show trajectories/paths where relevant

4. PHYSICS ACCURACY:
   - Use realistic physics equations
   - Scale appropriately for visualization
   - Include units in displays

5. EDUCATIONAL VALUE:
   - Demonstrate the concept clearly
   - Allow exploration of "what if" scenarios
   - Show cause and effect relationships

=== EXAMPLE CODE STRUCTURE ===

new p5((p) => {
  let gravity, mass, position, velocity;
  let gravitySlider, massSlider;
  let resetButton;
  
  p.setup = function() {
    const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent(p.canvas.parentElement);
    
    // Create UI controls
    gravitySlider = p.createSlider(1, 20, 9.8, 0.1);
    gravitySlider.position(20, 20);
    
    // Initialize physics
    reset();
  };
  
  function reset() {
    position = p.createVector(p.width/2, 50);
    velocity = p.createVector(0, 0);
  }
  
  p.draw = function() {
    p.background(248, 250, 252);
    
    // Update physics
    gravity = gravitySlider.value();
    velocity.y += gravity * 0.01;
    position.add(velocity);
    
    // Draw
    p.fill(59, 130, 246);
    p.ellipse(position.x, position.y, 30);
    
    // Labels
    p.fill(0);
    p.text(\`Gravity: \${gravity.toFixed(1)} m/s²\`, 20, 60);
  };
  
  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
});

=== OUTPUT REQUIREMENTS ===

Generate a complete, working p5.js experiment that:
1. Runs in instance mode
2. Is self-contained (no external dependencies except p5.js)
3. Handles window resizing
4. Has clear, readable code
5. Includes interactive controls
6. Shows educational annotations

The code should be production-ready and work immediately when executed.`,
    });

    const experiment = result.object as P5ExperimentOutput;

    return Response.json({
      success: true,
      experiment,
    });
  } catch (error) {
    console.error("Error generating p5 experiment:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate experiment",
      },
      { status: 500 },
    );
  }
}
