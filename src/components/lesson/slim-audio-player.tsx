"use client";

import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

interface SlimAudioPlayerProps {
  src: string | null;
  isActive: boolean;
  onToggleActive: () => void;
  onEnded?: () => void;
  onReady?: () => void;
  onTimeUpdate?: (currentTime: number, isPlaying: boolean) => void;
  className?: string;
}

export interface SlimAudioPlayerRef {
  play: () => void;
  pause: () => void;
  reset: () => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || Number.isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export const SlimAudioPlayer = forwardRef<
  SlimAudioPlayerRef,
  SlimAudioPlayerProps
>(function SlimAudioPlayer(
  { src, isActive, onToggleActive, onEnded, onReady, onTimeUpdate, className },
  ref,
) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  useImperativeHandle(ref, () => ({
    play: () => {
      if (audioRef.current && isActive) {
        setHasEnded(false);
        audioRef.current.play().catch(() => {});
      }
    },
    pause: () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    },
    reset: () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        setHasEnded(false);
      }
    },
  }));

  // Handle mute/unmute - only affects volume, not playback
  useEffect(() => {
    if (!audioRef.current) return;

    if (isActive) {
      audioRef.current.muted = false;
    } else {
      audioRef.current.muted = true;
    }
  }, [isActive]);

  // Update audio source
  useEffect(() => {
    if (audioRef.current && src) {
      audioRef.current.src = src;
      setIsLoading(true);
      setCurrentTime(0);
      setDuration(0);
      setHasEnded(false);
    }
  }, [src]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
      onReady?.();
    }
  }, [onReady]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && !isDragging) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time, !audioRef.current.paused);
    }
  }, [isDragging, onTimeUpdate]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setHasEnded(true);
    // Don't reset - stay at the end
    onEnded?.();
  }, [onEnded]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setHasEnded(false);
  }, []);

  const handlePause = useCallback(() => setIsPlaying(false), []);

  // Play/Pause toggle
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !src) return;

    if (hasEnded) {
      // If ended, restart from beginning
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setHasEnded(false);
      audioRef.current.play().catch(() => {});
    } else if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }, [isPlaying, hasEnded, src]);

  // Restart from beginning
  const _handleRestart = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setHasEnded(false);
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const updateProgress = useCallback(
    (clientX: number) => {
      if (!progressRef.current || !audioRef.current) return;

      const rect = progressRef.current.getBoundingClientRect();
      const percent = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      const newTime = percent * duration;

      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);

      // If we seek away from the end, clear the ended state
      if (hasEnded && percent < 0.99) {
        setHasEnded(false);
      }
    },
    [duration, hasEnded],
  );

  const handleProgressClick = useCallback(
    (e: React.MouseEvent) => {
      updateProgress(e.clientX);
    },
    [updateProgress],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      updateProgress(e.clientX);
    },
    [updateProgress],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateProgress(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, updateProgress]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!src) {
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Play/Pause/Restart Button */}
        <button
          type="button"
          onClick={togglePlayPause}
          disabled={isLoading}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 shrink-0",
            hasEnded
              ? "bg-green-500 text-white hover:bg-green-600"
              : isPlaying
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-slate-200 text-slate-600 hover:bg-slate-300",
            isLoading && "opacity-50 cursor-not-allowed",
          )}
          title={hasEnded ? "Restart" : isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : hasEnded ? (
            <RotateCcw size={14} />
          ) : isPlaying ? (
            <Pause size={14} />
          ) : (
            <Play size={14} className="ml-0.5" />
          )}
        </button>

        {/* Time - Current */}
        <span className="text-xs text-slate-500 font-medium tabular-nums w-10 text-right shrink-0">
          {formatTime(currentTime)}
        </span>

        {/* Progress Bar - Slim */}
        <div
          ref={progressRef}
          className="flex-1 relative h-1.5 bg-slate-200 rounded-full cursor-pointer group"
          onClick={handleProgressClick}
          onMouseDown={handleMouseDown}
        >
          {/* Progress Fill */}
          <div
            className={cn(
              "absolute left-0 top-0 h-full rounded-full transition-all duration-75",
              hasEnded ? "bg-green-500" : "bg-blue-500",
            )}
            style={{ width: `${progress}%` }}
          />

          {/* Drag Handle - Only visible on hover */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow border transition-opacity duration-100",
              hasEnded ? "border-green-500" : "border-blue-500",
              "opacity-0 group-hover:opacity-100",
              isDragging && "opacity-100",
            )}
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Time - Duration */}
        <span className="text-xs text-slate-400 font-medium tabular-nums w-10 shrink-0">
          {formatTime(duration)}
        </span>

        {/* Mute/Unmute - Only controls volume, not playback */}
        <button
          type="button"
          onClick={onToggleActive}
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-full transition-colors shrink-0",
            isActive
              ? "text-blue-500 hover:bg-blue-50"
              : "text-slate-400 hover:bg-slate-100",
          )}
          title={isActive ? "Mute" : "Unmute"}
        >
          {isActive ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
        preload="metadata"
      />
    </div>
  );
});
