"use client";

import { Calculator } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { GeoGebraWidget } from "@/components/playground/GeoGebraWidget";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HangingBanner } from "@/components/ui/hanging-banner";
import { cn } from "@/lib/utils";
import type { GeoGebraConfig } from "@/types/geogebra";
import type { Scene } from "../types/scene.types";

interface SceneVisualsProps {
  scene: Scene;
  currentSceneIndex: number;
  totalScenes: number;
}

export function SceneVisuals({
  scene,
  currentSceneIndex,
  totalScenes,
}: SceneVisualsProps) {
  const [showBorder, setShowBorder] = useState(false);
  const [_geogebraApi, setGeogebraApi] = useState<any>(null);
  const [geogebraError, setGeogebraError] = useState<string | null>(null);

  // Parse GeoGebra config if visualType is geogebra
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

  const handleGeoGebraInit = useCallback((api: any) => {
    setGeogebraApi(api);
  }, []);

  const handleGeoGebraError = useCallback((error: string) => {
    setGeogebraError(error);
  }, []);

  // Render GeoGebra scene
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
            "relative w-full rounded-3xl overflow-hidden shadow-sm border-[14px] bg-white z-40 transition-colors duration-700 ease-in",
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
      {/* Top Badge: Question/Title */}
      {/* <HangingBanner
        text={scene.title || "Scene Title"}
        onAnimationComplete={() => setShowBorder(true)}
      /> */}

      {/* Main Image Container */}
      <div
        className={cn(
          "relative w-full aspect-video mt-6 rounded-3xl overflow-hidden shadow-sm border-[14px] bg-blue-50/50 z-40 transition-colors duration-700 ease-in",
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
