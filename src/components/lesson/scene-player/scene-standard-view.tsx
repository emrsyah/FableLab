"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { SceneVisuals } from "./scene-visuals";
import { SceneNarrative } from "./scene-narrative";
import { Scene } from "../types/scene.types";

interface SceneStandardViewProps {
  scene: Scene;
  currentSceneIndex: number;
  totalScenes: number;
  isNarratorActive: boolean;
  isMusicActive: boolean;
  onNext: () => void;
  onPrev: () => void;
  onToggleNarrator: () => void;
  onToggleMusic: () => void;
}

export function SceneStandardView({
  scene,
  currentSceneIndex,
  totalScenes,
  isNarratorActive,
  isMusicActive,
  onNext,
  onPrev,
  onToggleNarrator,
  onToggleMusic,
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

      {/* 2. Scene Narrative (Text + Controls) */}
      <SceneNarrative
        text={scene.storyText || "No narrative available for this scene."}
        isNarratorActive={isNarratorActive}
        isMusicActive={isMusicActive}
        onToggleNarrator={onToggleNarrator}
        onToggleMusic={onToggleMusic}
      />

      {/* 3. Bottom Navigation */}
      <div className="flex items-center justify-between mt-8 px-4">
        <button
          onClick={onPrev}
          disabled={currentSceneIndex === 0}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
          Previous
        </button>

        <button
          onClick={onNext}
          disabled={currentSceneIndex === totalScenes - 1}
          className="flex items-center gap-2 text-[#3B82F6] hover:text-blue-600 font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight size={20} />
        </button>
      </div>
    </>
  );
}
