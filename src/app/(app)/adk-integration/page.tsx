"use client";

import {
  BookOpen,
  Bot,
  Calculator,
  CheckCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useCallback, useState } from "react";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { GeoGebraWidget } from "@/components/playground/GeoGebraWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GeoGebraConfig } from "@/types/geogebra";

const APP_NAME = "fable_agent";

interface AgentEvent {
  id?: string;
  author: string;
  content?: {
    parts?: Array<{
      text?: string;
      functionCall?: { name: string; args: Record<string, unknown> };
      functionResponse?: { name: string; response: unknown };
    }>;
  };
  partial?: boolean;
  actions?: {
    stateDelta?: Record<string, unknown>;
  };
  isFinalResponse?: boolean;
  timestamp?: string;
}

interface StoryContent {
  scenes: Array<{
    scene_id: string;
    scene_number: number;
    title: string;
    image_prompt: string;
    narration: string;
  }>;
  questions: Array<{
    question: string;
    type: string;
    options?: string[];
    answer: string;
    hint: string;
  }>;
  summary: string;
}

interface GeoGebraExperiment {
  geogebra_commands: string[];
  setup_instructions: string;
  interaction_guide: string;
  learning_objectives: string[];
}

export default function ADKIntegrationPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "running" | "completed" | "error"
  >("idle");
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [storyContent, setStoryContent] = useState<StoryContent | null>(null);
  const [geogebraExperiment, setGeogebraExperiment] =
    useState<GeoGebraExperiment | null>(null);
  const [geogebraConfig, setGeogebraConfig] = useState<GeoGebraConfig | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [targetAge, setTargetAge] = useState<"elementary" | "middle" | "high">(
    "middle",
  );
  const [userId] = useState(() => `user_${Date.now()}`);

  const getCurrentStep = () => {
    if (events.length === 0) return "Initializing...";

    const lastEvent = events[events.length - 1];
    const author = lastEvent.author;

    if (author === "Orchestrator") {
      // Check if outline has been created
      if (lastEvent.actions?.stateDelta?.story_outline) {
        return "Creating story outline...";
      }
      return "Consulting Librarian...";
    }

    if (author === "ParallelContentCreators") {
      return "Starting content generation...";
    }

    if (author === "Plotter") {
      return "Generating story content...";
    }

    if (author === "GraphMaster") {
      return "Creating GeoGebra experiment...";
    }

    if (author === "Finisher") {
      return "Finalizing...";
    }

    return "Processing...";
  };

  const getAuthorIcon = (author: string) => {
    switch (author) {
      case "Orchestrator":
        return <Bot className="w-4 h-4" />;
      case "Plotter":
        return <BookOpen className="w-4 h-4" />;
      case "GraphMaster":
        return <Calculator className="w-4 h-4" />;
      case "ParallelContentCreators":
        return <Sparkles className="w-4 h-4" />;
      case "Finisher":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const getAuthorColor = (author: string) => {
    switch (author) {
      case "Orchestrator":
        return "bg-blue-100 text-blue-800";
      case "Plotter":
        return "bg-purple-100 text-purple-800";
      case "GraphMaster":
        return "bg-green-100 text-green-800";
      case "ParallelContentCreators":
        return "bg-orange-100 text-orange-800";
      case "Finisher":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const runAgent = useCallback(async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setStatus("running");
    setEvents([]);
    setStoryContent(null);
    setGeogebraExperiment(null);
    setGeogebraConfig(null);
    setError(null);

    const sessionId = `session_${Date.now()}`;

    try {
      const response = await fetch("/api/adk/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          sessionId: sessionId,
          prompt: prompt,
          targetAge: targetAge,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(6);
              const event: AgentEvent = JSON.parse(jsonStr);

              setEvents((prev) => [...prev, event]);

              // Check for errors
              if ("errorCode" in event || "errorMessage" in event) {
                throw new Error(
                  `Agent Error: ${(event as { errorMessage?: string }).errorMessage || "Unknown error"}`,
                );
              }

              console.log("Event:", event);

              // Check for state updates
              if (event.actions?.stateDelta) {
                const { stateDelta } = event.actions;

                // Plotter now saves to 'story_content' (structured output)
                if (stateDelta.story_content) {
                  const storyData = stateDelta.story_content as StoryContent;
                  setStoryContent(storyData);
                }

                // GraphMaster saves to 'geogebra_experiment' (structured output)
                if (stateDelta.geogebra_experiment) {
                  const exp =
                    stateDelta.geogebra_experiment as GeoGebraExperiment;
                  setGeogebraExperiment(exp);
                  // Convert to GeoGebraConfig format
                  setGeogebraConfig({
                    appName: "classic",
                    commands: exp.geogebra_commands,
                    description: exp.setup_instructions,
                    educationalNotes: exp.interaction_guide
                      ? [exp.interaction_guide]
                      : [],
                  });
                }
              }

              // Check for completion - Finisher sends isFinalResponse: true
              if (event.author === "Finisher") {
                setStatus("completed");
                // Optional: Parse completion status
                try {
                  const completionText = event.content?.parts?.[0]?.text;
                  if (completionText) {
                    const completionData = JSON.parse(completionText);
                    console.log(
                      "Workflow complete:",
                      completionData.message || "Learning experience ready!",
                    );
                  }
                } catch (e) {
                  // Text might not be JSON, that's ok
                }
              }
            } catch (parseError) {
              console.error("Error parsing SSE event:", parseError);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }, [prompt, targetAge, userId]);

  const handleReset = () => {
    setPrompt("");
    setStatus("idle");
    setEvents([]);
    setStoryContent(null);
    setGeogebraExperiment(null);
    setGeogebraConfig(null);
    setError(null);
  };

  const [_api, setApi] = useState<any>(null);

  const handleGeoGebraInit = useCallback((ggbApi: any) => {
    setApi(ggbApi);
  }, []);

  const handleGeoGebraError = useCallback((errorMsg: string) => {
    setError(`GeoGebra Error: ${errorMsg}`);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
            ADK Integration Lab
          </h1>
          <p className="text-gray-600">
            Experience AI-powered learning with multi-agent story generation and
            interactive GeoGebra experiments
          </p>
        </div>

        {/* Prompt Input */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Create Learning Experience</CardTitle>
            <CardDescription>
              Describe what you want to learn and let our multi-agent system
              create a complete interactive lesson with stories and experiments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Settings */}
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-medium mb-2 block">Target Age</p>
                <Select
                  value={targetAge}
                  onValueChange={(v: "elementary" | "middle" | "high") =>
                    setTargetAge(v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elementary">
                      Elementary School
                    </SelectItem>
                    <SelectItem value="middle">Middle School</SelectItem>
                    <SelectItem value="high">High School</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prompt Input */}
            <PromptInput onSubmit={() => void runAgent()} className="border-0">
              <PromptInputTextarea
                placeholder="e.g., Teach fractions to 5th graders using a pizza party story"
                value={prompt}
                onChange={(e) => setPrompt(e.currentTarget.value)}
                className="min-h-[120px] text-base"
              />
              <PromptInputFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </Button>
                <PromptInputSubmit
                  size="sm"
                  disabled={!prompt.trim() || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Learning Experience"
                  )}
                </PromptInputSubmit>
              </PromptInputFooter>
            </PromptInput>

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <span className="text-sm">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Section */}
        {status === "running" && (
          <Card className="mb-6 shadow-lg border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                {getCurrentStep()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <div className="space-y-2">
                  {events.map((event, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                    >
                      <Badge
                        variant="secondary"
                        className={`${getAuthorColor(event.author)} flex items-center gap-1`}
                      >
                        {getAuthorIcon(event.author)}
                        {event.author}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {event.actions?.stateDelta
                          ? "⚡ State Update"
                          : event.content?.parts?.[0]?.text
                            ? "💬 Message"
                            : "🔄 Processing"}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {(storyContent || geogebraConfig) && status !== "running" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Story Content */}
            {storyContent && storyContent.scenes.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    Story Content
                  </CardTitle>
                  <CardDescription>
                    {storyContent.scenes.length} scenes generated
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-6">
                      {storyContent.scenes.map((scene, i) => (
                        <div
                          key={i}
                          className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg"
                        >
                          <h4 className="font-semibold text-purple-800 mb-2">
                            Scene {scene.scene_number}: {scene.title}
                          </h4>
                          <p className="text-sm text-gray-700 mb-3">
                            {scene.narration}
                          </p>
                          <p className="text-xs text-gray-500 italic">
                            Image: {scene.image_prompt}
                          </p>
                        </div>
                      ))}
                    </div>

                    {storyContent.questions &&
                      storyContent.questions.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="font-semibold text-gray-800 mb-4">
                            Quiz Questions
                          </h4>
                          <div className="space-y-4">
                            {storyContent.questions.map((q, i) => {
                              // Find correct answer index for multiple choice
                              const correctIndex = q.options
                                ? q.options.findIndex((opt) => opt === q.answer)
                                : -1;
                              return (
                                <div
                                  key={i}
                                  className="p-4 bg-gray-50 rounded-lg"
                                >
                                  <p className="font-medium text-sm mb-2">
                                    {i + 1}. {q.question}
                                  </p>
                                  {q.options && (
                                    <div className="space-y-1 ml-4">
                                      {q.options.map((opt, j) => (
                                        <p
                                          key={j}
                                          className={`text-sm ${j === correctIndex ? "text-green-600 font-medium" : "text-gray-600"}`}
                                        >
                                          {String.fromCharCode(65 + j)}. {opt}
                                          {j === correctIndex && " ✓"}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                  {!q.options && (
                                    <p className="text-sm text-green-600 font-medium ml-4">
                                      Answer: {q.answer}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-2 italic">
                                    Hint: {q.hint}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* GeoGebra Experiment */}
            {geogebraConfig && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-green-600" />
                    Interactive Experiment
                  </CardTitle>
                  <CardDescription>
                    {geogebraExperiment?.setup_instructions ||
                      "Explore the concept interactively"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <GeoGebraWidget
                    config={geogebraConfig}
                    width={600}
                    height={500}
                    onInit={handleGeoGebraInit}
                    onError={handleGeoGebraError}
                    className="border-0"
                  />
                </CardContent>
                {geogebraExperiment?.interaction_guide && (
                  <CardContent className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      {geogebraExperiment.interaction_guide}
                    </p>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        )}

        {/* Examples */}
        {!geogebraConfig && !storyContent && (
          <Card className="mt-6 shadow-lg bg-gradient-to-br from-indigo-50 to-pink-50">
            <CardHeader>
              <CardTitle>Try These Examples</CardTitle>
              <CardDescription>
                Click on any example to get started with the ADK multi-agent
                system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {examplePrompts.map((example, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start text-left hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                    onClick={() => setPrompt(example.prompt)}
                  >
                    <div className="font-semibold">{example.title}</div>
                    <div className="text-xs text-gray-600 line-clamp-2">
                      {example.prompt}
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

const examplePrompts = [
  {
    title: "Fractions with Pizza",
    prompt: "Teach fractions to 5th graders using a pizza party story",
  },
  {
    title: "Linear Equations",
    prompt:
      "Create an adventure story about a treasure hunt that teaches linear equations to middle schoolers",
  },
  {
    title: "Geometry Basics",
    prompt:
      "Teach basic geometry concepts like area and perimeter through a story about building a garden",
  },
  {
    title: "Probability",
    prompt:
      "Explain probability concepts using a carnival game scenario for high school students",
  },
  {
    title: "Quadratic Functions",
    prompt:
      "Create a physics-based story about projectile motion that introduces quadratic functions",
  },
  {
    title: "Pythagorean Theorem",
    prompt:
      "Teach the Pythagorean theorem through an ancient Egyptian pyramid building story",
  },
];
