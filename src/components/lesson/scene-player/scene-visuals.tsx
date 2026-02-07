"use client";

import {
  Beaker,
  BookOpen,
  Calculator,
  HelpCircle,
  Lightbulb,
  MousePointer2,
  Notebook,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { GeoGebraWidget } from "@/components/playground/GeoGebraWidget";
import { P5Widget } from "@/components/playground/P5Widget";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HangingBanner } from "@/components/ui/hanging-banner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { P5ExperimentOutput } from "@/types/adk-types";
import type { GeoGebraConfig } from "@/types/geogebra";
import type { Scene } from "../types/scene.types";
import { KaraokeText } from "./karaoke-text";

interface SceneVisualsProps {
  scene: Scene;
  currentSceneIndex: number;
  totalScenes: number;
  currentNarrationTime?: number;
  isNarratorPlaying?: boolean;
}

export function SceneVisuals({
  scene,
  currentSceneIndex,
  totalScenes,
  currentNarrationTime = 0,
  isNarratorPlaying = false,
}: SceneVisualsProps) {
  const [showBorder, setShowBorder] = useState(false);
  const [_geogebraApi, setGeogebraApi] = useState<any>(null);
  const [geogebraError, setGeogebraError] = useState<string | null>(null);

  // Parse GeoGebra config if visualType is geogebra (Legacy)
  const geogebraConfig = useMemo<GeoGebraConfig | null>(() => {
    if (scene.visualType !== "geogebra" || !scene.geogebraConfig) {
      return null;
    }
    try {
      return JSON.parse(scene.geogebraConfig) as GeoGebraConfig;
    } catch {
      console.error("Failed to parse geogebra config");
      return null;
    }
  }, [scene.visualType, scene.geogebraConfig]);

  // Parse p5.js config if visualType is p5
  const p5Config = useMemo<P5ExperimentOutput | null>(() => {
    if (scene.visualType !== "p5" || !scene.p5Config) {
      return null;
    }
    try {
      return JSON.parse(scene.p5Config) as P5ExperimentOutput;
    } catch {
      console.error("Failed to parse p5 config");
      return null;
    }
  }, [scene.visualType, scene.p5Config]);

  const handleGeoGebraInit = useCallback((api: any) => {
    setGeogebraApi(api);
  }, []);

  const handleGeoGebraError = useCallback((error: string) => {
    setGeogebraError(error);
  }, []);

  // Render p5.js scene
  if (scene.visualType === "p5") {
    return (
      <div className="relative w-full">
        {/* Main Experiment Container - Simple Layout */}
        <div className="relative w-full h-[calc(100vh-140px)] bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-100">
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {/* Story Button - Opens Narrative Modal */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2 shadow-md bg-white/90 backdrop-blur-sm hover:bg-white"
                >
                  <Notebook className="w-4 h-4" />
                  <span>Story</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Story</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <KaraokeText
                    text={scene.storyText || "No narrative available."}
                    alignment={scene.narrationAlignment}
                    currentTime={currentNarrationTime}
                    isPlaying={isNarratorPlaying}
                  />
                </div>
              </DialogContent>
            </Dialog>

            {/* Help Button - Using shadcn Dialog */}
            {p5Config && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2 shadow-md bg-white/90 backdrop-blur-sm hover:bg-white"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Help</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0">
                  <DialogHeader className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
                    <DialogTitle className="flex items-center gap-2 text-white">
                      <Beaker className="w-5 h-5" />
                      Experiment Guide
                    </DialogTitle>
                    <DialogDescription className="text-purple-100">
                      Learn how to use this interactive experiment
                    </DialogDescription>
                  </DialogHeader>

                  <ScrollArea className="max-h-[calc(85vh-180px)]">
                    <div className="p-6 space-y-6">
                      {/* Setup Instructions */}
                      {p5Config.setup_instructions && (
                        <div className="bg-purple-50 rounded-xl p-4 border-l-4 border-purple-500">
                          <h3 className="flex items-center gap-2 font-semibold text-purple-900 mb-2">
                            <BookOpen className="w-4 h-4" />
                            About This Experiment
                          </h3>
                          <p className="text-sm text-purple-800 leading-relaxed">
                            {p5Config.setup_instructions}
                          </p>
                        </div>
                      )}

                      {/* Learning Objectives */}
                      {p5Config.learning_objectives &&
                        p5Config.learning_objectives.length > 0 && (
                          <div>
                            <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-3">
                              <Lightbulb className="w-4 h-4 text-amber-500" />
                              Learning Objectives
                            </h3>
                            <ul className="space-y-2">
                              {p5Config.learning_objectives.map(
                                (objective, i) => (
                                  <li
                                    key={i}
                                    className="flex gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg"
                                  >
                                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                                      {i + 1}
                                    </span>
                                    {objective}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}

                      {/* Interaction Guide */}
                      {p5Config.interaction_guide && (
                        <div>
                          <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-3">
                            <MousePointer2 className="w-4 h-4 text-blue-500" />
                            How to Use This Experiment
                          </h3>
                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <div className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                              {p5Config.interaction_guide}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Interactive Controls */}
                      {p5Config.variables && p5Config.variables.length > 0 && (
                        <div>
                          <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-3">
                            <Calculator className="w-4 h-4 text-green-500" />
                            Available Controls
                          </h3>
                          <div className="grid gap-2">
                            {p5Config.variables.map((variable, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100"
                              >
                                <span className="flex-shrink-0 w-2 h-2 bg-amber-400 rounded-full" />
                                {variable}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-lg">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      Got it, let&apos;s experiment!
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {p5Config ? (
            <div className="w-full  h-full">
              <P5Widget
                code={p5Config.p5_code}
                width="100%"
                height="100%"
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-b from-purple-50 to-white">
              <div className="text-center opacity-30">
                <div className="text-6xl mb-2">🎨</div>
                <p className="font-semibold text-slate-500">p5.js Experiment</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render GeoGebra scene (Legacy)
  if (scene.visualType === "geogebra") {
    return (
      <div className="relative w-full">
        {/* Top Badge */}
        <HangingBanner
          text={scene.title || "Interactive Experiment"}
          onAnimationComplete={() => setShowBorder(true)}
        />

        {/* Top Right Floating Badge: Scene Counter */}
        <div className="absolute top-0 right-0 -mt-6 z-30 transform translate-y-[-50%]">
          <div className="bg-white text-green-600 pl-4 pr-3 py-3 rounded-full font-medium text-sm flex items-center gap-2">
            <Calculator size={16} />
            Experiment
          </div>
        </div>

        {/* GeoGebra Container */}
        <Card
          className={cn(
            "relative w-full rounded-3xl overflow-hidden shadow-sm border-14 bg-white z-40 transition-colors duration-700 ease-in",
            showBorder ? "border-green-100" : "border-transparent",
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="w-5 h-5 text-green-600" />
              Interactive Experiment
            </CardTitle>
            {geogebraConfig?.description && (
              <CardDescription>{geogebraConfig.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {geogebraConfig ? (
              <GeoGebraWidget
                config={geogebraConfig}
                width={800}
                height={500}
                onInit={handleGeoGebraInit}
                onError={handleGeoGebraError}
                className="border-0 w-full"
              />
            ) : (
              <div className="w-full h-[500px] flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
                <div className="text-center opacity-30">
                  <div className="text-6xl mb-2">📐</div>
                  <p className="font-semibold text-slate-500">
                    GeoGebra Experiment
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          {/* Interaction Guide */}
          {geogebraConfig?.educationalNotes &&
            geogebraConfig.educationalNotes.length > 0 && (
              <CardContent className="pt-4 border-t">
                <h4 className="text-sm font-semibold text-slate-800 mb-2">
                  How to Explore:
                </h4>
                <ul className="space-y-1">
                  {geogebraConfig.educationalNotes.map((note, i) => (
                    <li key={i} className="text-sm text-slate-600 flex gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </CardContent>
            )}

          {/* Error Display */}
          {geogebraError && (
            <CardContent className="pt-2">
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {geogebraError}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  // Default: Image scene
  return (
    <div className="relative w-full">
      {/* Main Image Container */}
      <div
        className={cn(
          "relative w-full aspect-video mt-6 rounded-3xl overflow-hidden shadow-sm border-14 bg-blue-50/50 z-40 transition-colors duration-700 ease-in",
          showBorder ? "border-[#dbeafe]" : "border-transparent",
        )}
      >
        {scene.visualType === "image" && scene.imageUrl ? (
          <Image
            src={scene.imageUrl}
            alt={scene.title || "Scene Visual"}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-blue-100 to-white">
            <div className="text-center opacity-30">
              <div className="text-6xl mb-2">🎨</div>
              <p className="font-semibold text-slate-500">Visual Placeholder</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
