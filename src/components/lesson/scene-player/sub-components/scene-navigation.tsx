"use client";

import { SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SceneNavigationProps {
  currentSceneIndex: number;
  totalScenes: number;
  onNext: () => void;
  onPrev: () => void;
  isNextDisabled: boolean;
}

export function SceneNavigation({
  currentSceneIndex,
  totalScenes,
  onNext,
  onPrev,
  isNextDisabled,
}: SceneNavigationProps) {
  const dots = Array.from({ length: totalScenes }, (_, i) => i);

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm mt-auto">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onPrev}
            disabled={currentSceneIndex === 0}
            className="text-slate-400 hover:text-white hover:bg-slate-800 font-medium"
          >
            <SkipBack className="size-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2.5">
            {dots.map((dotIndex) => (
              <button
                key={`dot-${dotIndex}`}
                type="button"
                className={cn(
                  "size-2.5 rounded-full transition-all duration-300",
                  dotIndex === currentSceneIndex
                    ? "bg-indigo-500 scale-125 ring-4 ring-indigo-500/20"
                    : dotIndex < currentSceneIndex
                      ? "bg-indigo-500/50"
                      : "bg-slate-700 hover:bg-slate-600 cursor-pointer",
                )}
                aria-label={`Go to scene ${dotIndex + 1}`}
              />
            ))}
          </div>

          <Button
            variant="secondary"
            onClick={onNext}
            disabled={isNextDisabled || currentSceneIndex === totalScenes - 1}
            className={cn(
              "font-bold px-6",
              !isNextDisabled &&
                "bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg shadow-indigo-900/40",
            )}
          >
            {currentSceneIndex === totalScenes - 1 ? "Finish" : "Next"}
            <SkipForward className="size-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
