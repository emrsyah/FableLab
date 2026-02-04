"use client";

import { cn } from "@/lib/utils";

import Image from "next/image";
import { useState } from "react";
import { SceneGenerationStatus } from "../loading-overlay";
import { Scene } from "../types/scene.types";
import { HangingBanner } from "@/components/ui/hanging-banner";

interface SceneVisualsProps {
  scene: Scene; 
  currentSceneIndex: number;
  totalScenes: number;
}

export function SceneVisuals({ scene, currentSceneIndex, totalScenes }: SceneVisualsProps) {
  const [showBorder, setShowBorder] = useState(false);

  return (
    <div className="relative w-full">
      {/* Top Floating Badge: Question/Title */}
      {/* Top Badge: Question/Title */}
      {/* Top Badge: Question/Title */}
      <HangingBanner 
        text={scene.title || "Scene Title"} 
        onAnimationComplete={() => setShowBorder(true)}
      />

      {/* Top Right Floating Badge: Scene Counter */}
      <div className="absolute top-0 right-0 -mt-6 z-30 transform translate-y-[-50%]">
        <div className="bg-white text-[#3e7dea] pl-4 pr-3 py-3 rounded-full font-medium text-sm">
           Scene {currentSceneIndex + 1} of {totalScenes}
        </div>
      </div>

      {/* Main Image Container */}
      <div 
        className={cn(
            "relative w-full aspect-[16/9] rounded-3xl overflow-hidden shadow-sm border-[14px] bg-blue-50/50 z-40 transition-colors duration-700 ease-in",
            showBorder ? "border-[#dbeafe]" : "border-transparent"
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
