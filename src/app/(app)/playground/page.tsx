"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { GeoGebraWidget } from "@/components/playground/GeoGebraWidget";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GeoGebraConfig } from "@/types/geogebra";

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<GeoGebraConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [targetAge, setTargetAge] = useState<"elementary" | "middle" | "high">(
    "middle",
  );
  const [complexity, setComplexity] = useState<
    "basic" | "intermediate" | "advanced"
  >("intermediate");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/playground/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          targetAge,
          complexity,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
      } else {
        setError(data.error || "Failed to generate visualization");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const [_api, setApi] = useState<any>(null);

  const handleReset = () => {
    setConfig(null);
    setApi(null);
    setError(null);
    setPrompt("");
  };

  // Memoize the onInit callback to prevent re-renders
  const handleGeoGebraInit = useCallback((ggbApi: any) => {
    setApi(ggbApi);
  }, []);

  // Handle GeoGebra command errors
  const handleGeoGebraError = useCallback((errorMsg: string) => {
    setError(`GeoGebra Error: ${errorMsg}`);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            GeoGebra Playground
          </h1>
          <p className="text-gray-600">
            Create interactive mathematical visualizations using AI
          </p>
        </div>

        {/* Prompt Input */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Create a Visualization</CardTitle>
            <CardDescription>
              Describe what you want to visualize and let AI generate an
              interactive GeoGebra experiment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Settings */}
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-medium mb-2 block">Target Age</p>
                <Select
                  value={targetAge}
                  onValueChange={(v: any) => setTargetAge(v)}
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
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-medium mb-2 block">Complexity</p>
                <Select
                  value={complexity}
                  onValueChange={(v: any) => setComplexity(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prompt Input */}
            <PromptInput
              onSubmit={() => void handleGenerate()}
              className="border-0"
            >
              <PromptInputTextarea
                placeholder="e.g., Show me a sine wave with adjustable amplitude and frequency"
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
                  size={"sm"}
                  disabled={!prompt.trim() || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Visualization"
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

        {/* GeoGebra Display */}
        {config && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Description */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">
                    About This Visualization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{config.description}</p>
                </CardContent>
              </Card>

              {config.educationalNotes &&
                config.educationalNotes.length > 0 && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Educational Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {config.educationalNotes.map((note, i) => (
                          <li
                            key={i}
                            className="text-sm text-gray-700 flex gap-2"
                          >
                            <span className="text-purple-600 font-bold">•</span>
                            {note}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
            </div>

            {/* GeoGebra Widget */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    Interactive Visualization
                  </CardTitle>
                  <CardDescription>
                    Adjust parameters and interact with the visualization
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 bg-white">
                  <GeoGebraWidget
                    config={config}
                    width={800}
                    height={600}
                    onInit={handleGeoGebraInit}
                    onError={handleGeoGebraError}
                    className="border-0"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Examples */}
        {!config && (
          <Card className="mt-6 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle>Try These Examples</CardTitle>
              <CardDescription>
                Click on any example to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {examplePrompts.map((example, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
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
    title: "Sine Wave",
    prompt: "Show me a sine wave with adjustable amplitude and frequency",
  },
  {
    title: "Quadratic Function",
    prompt: "Create an interactive parabola with vertex and roots controls",
  },
  {
    title: "Triangle Properties",
    prompt:
      "Build an interactive triangle with angle and side length measurements",
  },
  {
    title: "Circle Geometry",
    prompt:
      "Show a circle with radius, diameter, and circumference calculations",
  },
  {
    title: "3D Torus",
    prompt: "Create a 3D torus visualization with adjustable parameters",
  },
  {
    title: "Linear Function",
    prompt: "Show a line with adjustable slope and y-intercept",
  },
];
