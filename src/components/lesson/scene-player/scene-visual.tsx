"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Scene } from "../types/scene.types";

interface SceneVisualProps {
  scene: Scene;
  className?: string;
}

/**
 * SceneVisual - Renders the visual component of a scene
 * Supports image, GeoGebra, and video visual types with fallback
 */
export function SceneVisual({ scene, className }: SceneVisualProps) {
  const {
    visualType,
    imageUrl,
    geogebraConfig,
    title,
    learningObjective,
    sceneNumber,
  } = scene;

  const renderVisual = () => {
    switch (visualType) {
      case "image":
        if (imageUrl) {
          return (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          );
        }
        return <DefaultVisual title={title} />;

      case "geogebra":
        if (geogebraConfig) {
          return <GeoGebraPlaceholder title={title} config={geogebraConfig} />;
        }
        return <DefaultVisual title={title} />;

      case "video":
        // Video support placeholder - to be implemented
        return (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <div className="text-center text-slate-400">
              <span className="text-5xl block mb-3">🎬</span>
              <p className="text-sm font-medium">Video content</p>
            </div>
          </div>
        );

      default:
        return <DefaultVisual title={title} />;
    }
  };

  return (
    <motion.div
      className={cn(
        "group relative aspect-video w-full overflow-hidden rounded-xl",
        "bg-gradient-to-br from-slate-900 to-slate-800",
        "shadow-xl ring-1 ring-white/10",
        className,
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Visual Content */}
      {renderVisual()}

      {/* Learning Objective Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
        <p className="text-xs text-white/60 uppercase tracking-wider mb-1 font-medium">
          Learning Objective
        </p>
        <p className="text-sm text-white/90 line-clamp-2">
          {learningObjective}
        </p>
      </div>

      {/* Scene Number Badge */}
      <div className="absolute left-3 top-3">
        <div className="flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-white">
            Scene {sceneNumber}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Default visual fallback component
function DefaultVisual({ title }: { title: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-fuchsia-500/20">
      <div className="text-center">
        <motion.div
          className="text-6xl mb-3"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          🔬
        </motion.div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
      </div>
    </div>
  );
}

// GeoGebra placeholder component
function GeoGebraPlaceholder({
  title,
  config,
}: {
  title: string;
  config: string;
}) {
  // TODO: Integrate actual GeoGebra applet
  // The config string contains XML or commands for GeoGebra

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-violet-500/10 p-6">
      <div className="text-center">
        <motion.div
          className="mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center backdrop-blur-sm ring-1 ring-white/20">
            <span className="text-4xl">📐</span>
          </div>
        </motion.div>
        <h4 className="text-base font-semibold text-foreground/80 mb-1">
          Interactive Visualization
        </h4>
        <p className="text-sm text-muted-foreground max-w-xs">
          GeoGebra applet for &ldquo;{title}&rdquo;
        </p>
        <motion.div
          className="mt-4 text-xs text-muted-foreground/60 font-mono bg-black/20 rounded-lg px-3 py-2 max-w-xs overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {config.length > 50 ? `${config.slice(0, 50)}...` : config}
        </motion.div>
      </div>
    </div>
  );
}

export default SceneVisual;
