"use client";

import Image from "next/image";
import { SceneGenerationStatus } from "../loading-overlay";
import { Scene } from "../types/scene.types";

interface SceneVisualsProps {
  scene: Scene; 
  currentSceneIndex: number;
  totalScenes: number;
}

export function SceneVisuals({ scene, currentSceneIndex, totalScenes }: SceneVisualsProps) {
  return (
    <div className="relative w-full">
      {/* Top Floating Badge: Question/Title */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-6 z-30">
         <div className="bg-[#4E88EC] text-white px-8 py-3 rounded-2xl shadow-[0px_4px_12px_rgba(37,99,235,0.3)] font-semibold text-lg text-center min-w-[300px] border-2 border-white/20">
            {scene.title || "Scene Title"}
         </div>
         {/* Connector Lines (Decorative) */}
         <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-6 bg-blue-300"></div>
      </div>

      {/* Top Right Floating Badge: Scene Counter */}
      <div className="absolute top-0 right-0 -mt-6 z-30 transform translate-y-[-50%]">
        <div className="bg-white text-[#3e7dea] pl-4 pr-3 py-3 rounded-full font-medium text-sm">
           Scene {currentSceneIndex + 1} of {totalScenes}
        </div>
      </div>

      {/* Main Image Container */}
      <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden shadow-sm border border-white/50 bg-blue-50/50 mt-12">
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
