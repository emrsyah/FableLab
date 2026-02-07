"use client";

import { cn } from "@/lib/utils";
import type { Scene } from "../types/scene.types";
import { SceneNarrative } from "./scene-narrative";
import { SceneVisuals } from "./scene-visuals";

interface SceneStandardViewProps {
  scene: Scene;
  currentSceneIndex: number;
  totalScenes: number;
  currentNarrationTime?: number;
  isNarratorPlaying?: boolean;
}

export function SceneStandardView({
  scene,
  currentSceneIndex,
  totalScenes,
  currentNarrationTime = 0,
  isNarratorPlaying = false,
}: SceneStandardViewProps) {
  return (
    <>
      {/* 1. Scene Visuals (Image + Badges) */}
      <div
        className={cn(
          "w-full mx-auto transition-all duration-300",
          scene.visualType === "p5" ? "max-w-full" : "max-w-3xl",
        )}
      >
        <SceneVisuals
          scene={scene}
          currentSceneIndex={currentSceneIndex}
          totalScenes={totalScenes}
        />
      </div>

      {/* 2. Scene Narrative (with karaoke highlighting when available) */}
      <SceneNarrative
        text={scene.storyText || "No narrative available for this scene."}
        alignment={scene.narrationAlignment}
        currentTime={currentNarrationTime}
        isPlaying={isNarratorPlaying}
      />
    </>
  );
}
