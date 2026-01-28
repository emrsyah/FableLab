"use client";

import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import type { ScenePlaybackState } from "../../hooks/use-scene-state";

interface SceneAudioProps {
  status: ScenePlaybackState;
  progress: number;
  duration: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onRestart: () => void;
  hasAudio: boolean;
}

export function SceneAudio({
  status,
  progress,
  duration,
  isMuted,
  onTogglePlay,
  onToggleMute,
  onRestart,
  hasAudio,
}: SceneAudioProps) {
  const formatTime = (seconds: number) => {
    if (!seconds || Number.isNaN(seconds)) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onRestart}
              disabled={!hasAudio}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <RotateCcw className="size-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={onTogglePlay}
              disabled={
                !hasAudio || status === "loading" || status === "quiz_gate"
              }
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full size-10 flex items-center justify-center p-0"
            >
              {status === "playing" ? (
                <Pause className="size-5 fill-current" />
              ) : (
                <Play className="size-5 ml-0.5 fill-current" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMute}
              disabled={!hasAudio}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {isMuted ? (
                <VolumeX className="size-4" />
              ) : (
                <Volume2 className="size-4" />
              )}
            </Button>
          </div>

          <div className="flex-1">
            <Progress
              value={progress}
              className="h-1.5 bg-slate-800"
              indicatorClassName="bg-indigo-500"
            />
          </div>

          <span className="text-xs font-medium text-slate-400 min-w-[70px] text-right tabular-nums">
            {formatTime((progress / 100) * duration)} / {formatTime(duration)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
