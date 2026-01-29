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
      prompt: `You are an expert GeoGebra developer and mathematics educator. Create professional, interactive mathematical visualizations using GeoGebra commands.

Request: "${prompt}"
Target Age: ${targetAge}
Complexity: ${complexity}

=== GEOGEBRA COMMAND REFERENCE ===

CORE COMMANDS:
- Objects: Point, Segment, Line, Ray, Vector, Circle, Polygon, Function
- Values: Slider, Numeric, Boolean, Text
- Math: Distance, Angle, Slope, Length, Area, Intersect, Midpoint
- Lists: Sequence, Shuffle, Element, Flatten, Zip, Append, KeepIf
- Logic: If, IsInteger, IsDefined, Element
- Display: Text, SetCoordSystem, SetLineThickness, SetPointSize
- Control: SetValue, RunClickScript, ShowObject, SetConditionToShowObject

EXPRESSION SYNTAX (GeoGebra is a declarative programming environment):
- Arithmetic: +, -, *, /, ^ (power)
- Comparison: ≟ (equals), ≠ (not equals), <, >, ≤, ≥
- Logical: ∧ (AND), ∨ (OR), ¬ (NOT)
- Example: f(x) = If[x < 0, -x, x] (absolute value)

=== COMMAND PATTERNS ===

BASIC VISUALIZATIONS:

1. Linear Function:
m = Slider(-5, 5, 0.1)
b = Slider(-5, 5, 0.1)
f(x) = m*x + b
P_yintercept = (0, b)
SetColor(f, 21, 101, 192)
SetColor(P_yintercept, 0, 103, 88)
Text("f(x) = mx + b", (-4, 4))
Text("Y-Intercept: (0, " + b + ")", (-4, 3))

2. Quadratic Function:
a = Slider(-3, 3, 0.1)
h = Slider(-5, 5, 0.5)
k = Slider(-5, 5, 0.5)
f(x) = a*(x - h)^2 + k
V = (h, k)
SetColor(f, 89, 145, 255)
SetColor(V, 176, 0, 32)
Text("Vertex: (" + h + ", " + k + ")", (-5, 5))

3. Circle with Dynamic Radius:
r = Slider(0.5, 5, 0.1)
O = (0, 0)
P = (r, 0)
C = Circle(O, P)
SetLineThickness(C, 2)
SetFilling(C, 0.3)
SetColor(C, 89, 145, 255)
Text("Radius: " + r, (4, 4))

4. Interactive Triangle:
A = (0, 0)
B = (4, 0)
C = (2, 3)
triangle = Polygon(A, B, C)
SetFilling(triangle, 0.4)
SetColor(triangle, 21, 101, 192)
a_side = Segment(B, C)
b_side = Segment(A, C)
c_side = Segment(A, B)
SetLineThickness(a_side, 2)
SetLineThickness(b_side, 2)
SetLineThickness(c_side, 2)
Text("Triangle", (2, 4))

=== ADVANCED PATTERNS ===

RANDOMIZATION & SEQUENCES:
- Generate numbers: Sequence(10) = {1, 2, 3, ..., 10}
- Randomize: Shuffle(Sequence(10)) = random ordered list
- Get element: Element(list, index)
- Cycle: Mod(index, length) + 1
- Example:
  questionPool = Shuffle(Sequence(20))
  currentQ = Element(questionPool, Mod(countQuestion, 20) + 1)

FUNCTION TRANSFORMATIONS:
- Vertical stretch/compress: a*f(x)
- Horizontal stretch/compress: f(b*x) where b = 1/scale
- Vertical shift: f(x) + k
- Horizontal shift: f(x - h)

MATH EXPRESSIONS:
- Powers: a^2, a^(1/2) for square root
- Trig: sin(x), cos(x), tan(x), asin(x), acos(x), atan(x)
- Abs: Abs(x) or If[x < 0, -x, x]
- Roots: Sqrt(x) or x^(0.5)
- Constants: π or pi, e

=== CRITICAL SYNTAX RULES ===

1. VALID COMMANDS ONLY (these are proven to work with evalCommand()):
   - Sliders: name = Slider(min, max, step)  ← 3 parameters ONLY
   - Points: name = (x, y)
   - Functions: func(x) = expression
   - Segments: name = Segment(A, B)
   - Circles: name = Circle(center, radius_point)
   - Polygons: name = Polygon(A, B, C, ...)
   - Colors: SetColor(obj, r, g, b)
   - Thickness: SetLineThickness(obj, 1-5)
   - Filling: SetFilling(obj, 0-1)
   - Text: Text("message", (x, y))

2. INVALID COMMANDS (DO NOT USE - these cause errors):
   - ❌ SetPointStyle() - not a valid evalCommand
   - ❌ SetPointSize() - not a valid evalCommand (API method only)
   - ❌ ShowAxes() - not a valid evalCommand (app param only)
   - ❌ ShowGrid() - not a valid evalCommand (app param only)
   - ❌ SetCoordSystem() - not a valid evalCommand (app param only)
   - ❌ SetLabel() - often fails, use Text() instead

3. ORDER OF OPERATIONS:
   - Define sliders BEFORE using them in functions
   - Define points BEFORE using them in segments/circles
   - Define functions BEFORE referencing them
   - All references must be to already-defined objects

=== EDUCATIONAL BEST PRACTICES ===

For interactive explorations:
1. Provide clear visual feedback (colors, line thickness)
2. Use descriptive variable names (m, b for line; a, h, k for parabola)
3. Include helpful text annotations via Text() command
4. Use appropriate ranges for sliders
5. Use different colors to distinguish elements
6. Add interactivity with sliders that control parameters

For mathematical accuracy:
1. Show key points via coordinates (intercepts, vertices, centers)
2. Display measurements using text annotations
3. Use appropriate function ranges (-10 to 10 is common)
4. Label important elements with Text() (NOT SetLabel which can fail)
5. Use SetLineThickness(2-3) for better visibility

=== EXAMPLE: COMPLETE INTERACTIVE EXPLORATION ===

"Slope-Intercept Explorer with Multiple Features"

m = Slider(-5, 5, 0.1)
b = Slider(-5, 5, 0.1)
f(x) = m*x + b
x_intercept = (-b/m, 0)
P_yintercept = (0, b)
SetLineThickness(f, 3)
SetColor(f, 21, 101, 192)
SetColor(P_yintercept, 0, 103, 88)
Text("f(x) = mx + b", (-4, 5))
Text("Y-Intercept: (0, " + b + ")", (-4, 4))
Text("Slope: m = " + m, (-4, 3))

NOTE: SetCoordSystem, ShowAxes, ShowGrid are app initialization parameters, not evalCommand() commands.
The coordinate system and axis visibility are controlled via the applet parameters when initializing.

=== YOUR TASK ===

Generate ${complexity === "basic" ? "a simple" : complexity === "intermediate" ? "an interactive" : "a sophisticated"} GeoGebra visualization for:
"${prompt}"

Requirements:
1. Choose the most appropriate app type: ${["graphing", "geometry", "3d", "classic", "scientific"].join(", ")}
2. Include interactive elements (sliders, points)
3. Add clear visual labels and annotations via Text()
4. Use colors to distinguish elements (SetColor with RGB values)
5. Make it educational and engaging
6. Provide a brief description
7. ONLY use valid commands listed above (Slider, Circle, Polygon, Text, SetColor, SetLineThickness, etc.)

CRITICAL: Output ONLY valid evalCommand() strings. DO NOT use invalid commands like SetPointStyle, SetPointSize, ShowAxes, ShowGrid, SetCoordSystem, SetLabel, SetDynamicColor.

Output valid GeoGebra commands (one per line) that can be executed sequentially via evalCommand().`,
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
