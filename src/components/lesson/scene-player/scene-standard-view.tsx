"use client";

import type { Scene } from "../types/scene.types";
import { SceneNarrative } from "./scene-narrative";
import { SceneVisuals } from "./scene-visuals";

interface SceneStandardViewProps {
  scene: Scene;
  currentSceneIndex: number;
  totalScenes: number;
}

export function SceneStandardView({
  scene,
  currentSceneIndex,
  totalScenes,
}: SceneStandardViewProps) {
  return (
    <>
      {/* 1. Scene Visuals (Image + Badges) */}
      <div className="w-full max-w-3xl mx-auto">
        <SceneVisuals
          scene={scene}
          currentSceneIndex={currentSceneIndex}
          totalScenes={totalScenes}
        />
      </div>

      {/* 2. Scene Narrative (Text only, controls moved to header) */}
      <SceneNarrative
        text={scene.storyText || "No narrative available for this scene."}
      />
    </>
  );
}
