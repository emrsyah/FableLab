"use client";

import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { IosLoader } from "@/components/ui/ios-loader";

export type GenerationPhase = "idle" | "initializing" | "outline" | "complete";

export interface SceneGenerationStatus {
  id: number;
  status: "pending" | "loading" | "complete";
  name: string;
  title?: string;
}

interface LessonLoadingOverlayProps {
  phase: GenerationPhase;
  progress: SceneGenerationStatus[];
  onContinue: () => void;
}

import { createPortal } from "react-dom";

export function LessonLoadingOverlay({ 
  phase, 
  progress, 
  onContinue 
}: LessonLoadingOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (phase === "idle" || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <AnimatePresence mode="wait">
        {phase === "initializing" && (
          <motion.div
            key="initializing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center gap-6 min-h-[200px]"
          >
            <div className="self-start flex items-center gap-2 text-xl font-semibold text-slate-900">
               <Sparkles className="text-blue-500 fill-blue-500/20" />
               Creating Your Lesson...
            </div>

            <div className="relative">
               {/* Central spinner illustration */}
               <IosLoader className="w-24 h-24" />
               <motion.div 
                 animate={{ scale: [1, 1.1, 1] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="absolute inset-0 m-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center opacity-0" 
               >
                 {/* Keep sparkles if needed, but for now just the loader as per request */}
                 <Sparkles className="text-blue-400 w-8 h-8" />
               </motion.div>
            </div>

            <p className="text-slate-400 text-sm">This may takes less than a minute</p>
          </motion.div>
        )}

        {(phase === "outline" || phase === "complete") && (
          <motion.div
            key="outline"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl max-h-[80vh] flex flex-col"
          >
             <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-6 px-2">
               <Sparkles className="text-blue-500 fill-blue-500/20 w-5 h-5" />
               Generating the Outline...
            </div>

            <div className="space-y-3 overflow-y-auto custom-scrollbar px-2 pb-4 -mr-2 pr-2 flex-1">
              {progress.map((scene, index) => (
                <SceneItem key={scene.id} scene={scene} index={index} />
              ))}
            </div>
            
            <AnimatePresence>
              {phase === "complete" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-4 mt-2 border-t border-slate-100"
                >
                  <Button onClick={onContinue} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-base shadow-lg shadow-blue-500/20">
                    Continue
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}

function SceneItem({ scene, index }: { scene: SceneGenerationStatus; index: number }) {
  const isComplete = scene.status === "complete";
  const isLoading = scene.status === "loading";
  const isPending = scene.status === "pending";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: isPending ? 0.5 : 1, x: 0 }}
      className={`
        relative overflow-hidden rounded-2xl p-4 flex items-center gap-4 transition-all duration-300
        ${isComplete ? "bg-blue-50/50" : "bg-white"}
        ${isLoading ? "shadow-sm ring-1 ring-blue-100" : ""}
      `}
    >
      {/* Number Badge */}
      <div 
        className={`
          w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-300 shadow-sm
          ${isComplete || isLoading 
            ? "bg-[radial-gradient(circle_at_center,_#6FA0F6_1%,_#3C7AE8_100%)] text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] ring-4 ring-blue-200/80" 
            : "bg-slate-100 text-slate-400"}
        `}
      >
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-900 truncate">
          {scene.name}
        </div>
        
        {isComplete && scene.title ? (
           <motion.div 
             initial={{ opacity: 0, y: 5 }}
             animate={{ opacity: 1, y: 0 }}
             className="text-xs text-slate-500 mt-1 truncate"
           >
             {scene.title}
           </motion.div>
        ) : (
           <div className="w-full h-[1px] mt-2 bg-gradient-to-r from-slate-200 to-transparent bg-[length:8px_1px] bg-repeat-x opacity-50" />
        )}
      </div>

      {/* Status Indicator */}
      <div className="shrink-0 w-6 flex justify-center items-center">
         {isLoading && (
           <IosLoader className="w-5 h-5" />
         )}
         {isComplete && (
           <motion.div 
             initial={{ scale: 0.5, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-sm"
           >
             <Check size={14} className="text-white ring-0" strokeWidth={3} />
           </motion.div>
         )}
      </div>

      {isLoading && (
         <motion.div 
           layoutId="active-glow"
           className="absolute inset-0 bg-blue-400/5 z-[-1]" 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
         />
      )}
    </motion.div>
  );
}
