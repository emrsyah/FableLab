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

interface AudioPlayerBarProps {
  src: string | null;
  isActive: boolean;
  onToggleActive: () => void;
  onEnded?: () => void;
  onReady?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  className?: string;
}

export interface AudioPlayerBarRef {
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

export const AudioPlayerBar = forwardRef<
  AudioPlayerBarRef,
  AudioPlayerBarProps
>(function AudioPlayerBar(
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

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    play: () => {
      if (audioRef.current && isActive) {
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
      }
    },
  }));

  // Handle play state based on isActive toggle
  useEffect(() => {
    if (!audioRef.current || !src) return;

    if (isActive && !isPlaying && !isLoading) {
      audioRef.current.play().catch(() => {});
    } else if (!isActive && isPlaying) {
      audioRef.current.pause();
    }
  }, [isActive, isPlaying, isLoading, src]);

  // Update audio source
  useEffect(() => {
    if (audioRef.current && src) {
      audioRef.current.src = src;
      setIsLoading(true);
      setCurrentTime(0);
      setDuration(0);
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
      onTimeUpdate?.(time);
    }
  }, [isDragging, onTimeUpdate]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    onEnded?.();
  }, [onEnded]);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !src) return;

    if (!isActive) {
      onToggleActive();
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }, [isActive, isPlaying, onToggleActive, src]);

  const handleRestart = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (isActive) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [isActive]);

  // Progress bar click/drag handling
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
    },
    [duration],
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
    <div
      className={cn(
        "bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-slate-100",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlayPause}
          disabled={isLoading}
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200",
            isActive && isPlaying
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            isLoading && "opacity-50 cursor-not-allowed",
          )}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isActive && isPlaying ? (
            <Pause size={20} />
          ) : (
            <Play size={20} className="ml-0.5" />
          )}
        </button>

        {/* Progress Section */}
        <div className="flex-1 flex flex-col gap-1.5">
          {/* Progress Bar */}
          <div
            ref={progressRef}
            className="relative h-2 bg-slate-200 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
            onMouseDown={handleMouseDown}
          >
            {/* Progress Fill */}
            <div
              className="absolute left-0 top-0 h-full bg-linear-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />

            {/* Drag Handle */}
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-blue-500 transition-all duration-100",
                "opacity-0 group-hover:opacity-100",
                isDragging && "opacity-100 scale-110",
              )}
              style={{ left: `calc(${progress}% - 8px)` }}
            />
          </div>

          {/* Time Display */}
          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Restart Button */}
        <button
          type="button"
          onClick={handleRestart}
          className="flex items-center justify-center w-10 h-10 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Restart"
        >
          <RotateCcw size={18} />
        </button>

        {/* Mute/Unmute Toggle */}
        <button
          type="button"
          onClick={onToggleActive}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
            isActive
              ? "text-blue-500 hover:bg-blue-50"
              : "text-slate-400 hover:bg-slate-100",
          )}
          title={isActive ? "Mute Narrator" : "Unmute Narrator"}
        >
          {isActive ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      {/* Hidden Audio Element */}
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
