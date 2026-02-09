"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Music,
  RefreshCw,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { GenerationOverlay } from "@/components/lesson/generation-overlay";
import { useSceneProgress } from "@/components/lesson/hooks/use-scene-progress";
import { LessonComplete } from "@/components/lesson/lesson-complete";
import { ScenePlayer } from "@/components/lesson/scene-player/scene-player";
import {
  SlimAudioPlayer,
  type SlimAudioPlayerRef,
} from "@/components/lesson/slim-audio-player";
import { VoiceTutorFAB } from "@/components/lesson/voice-tutor-fab";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

type LessonClientPageProps = {
  lessonId: string;
};

export default function LessonClientPage({ lessonId }: LessonClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { getProgress, saveProgress } = useSceneProgress(lessonId);

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isLessonComplete, setIsLessonComplete] = useState(false);

  // Audio control state (lifted from ScenePlayer for header access)
  const [isNarratorActive, setIsNarratorActive] = useState(true);
  const [isMusicActive, setIsMusicActive] = useState(true);

  // Audio source state (lifted from ScenePlayer for footer player)
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const audioPlayerRef = useRef<SlimAudioPlayerRef>(null);

  // Karaoke sync state
  const [currentNarrationTime, setCurrentNarrationTime] = useState(0);
  const [isNarratorPlaying, setIsNarratorPlaying] = useState(false);

  // Get generation params from URL (passed when redirecting from create page)
  const targetAge = searchParams.get("targetAge") || "middle";
  const sceneCount = searchParams.get("sceneCount") || "medium";

  // Fetch lesson to check status
  const {
    data: lesson,
    isLoading: isLessonLoading,
    refetch: refetchLesson,
  } = trpc.lessons.getById.useQuery({ lessonId }, { enabled: !!lessonId });

  // Fetch scenes for the lesson
  const {
    data: scenes,
    isLoading: isScenesLoading,
    isError,
    error,
    refetch: refetchScenes,
  } = trpc.scenes.getByLessonId.useQuery(
    { lessonId },
    {
      enabled: !!lessonId && lesson?.status === "completed",
      staleTime: Infinity,
      gcTime: Infinity,
    },
  );

  // Load progress on initial render
  useEffect(() => {
    const savedIndex = getProgress();
    if (savedIndex) {
      setCurrentSceneIndex(savedIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getProgress]);

  // Save progress whenever the scene changes
  useEffect(() => {
    saveProgress(currentSceneIndex);
  }, [currentSceneIndex, saveProgress]);

  // Fetch audio when scene changes
  useEffect(() => {
    if (!scenes || !scenes[currentSceneIndex]) return;

    const scene = scenes[currentSceneIndex];

    // Reset audio player
    audioPlayerRef.current?.reset();
    setAudioSrc(null);

    const fetchAudio = async () => {
      // Use pre-generated narration URL if available
      if (scene.narrationUrl) {
        setAudioSrc(scene.narrationUrl);
        return;
      }

      // Fallback: Generate audio on-demand via TTS API
      if (scene.storyText) {
        try {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: scene.storyText }),
          });
          if (res.ok) {
            const blob = await res.blob();
            setAudioSrc(URL.createObjectURL(blob));
          }
        } catch (err) {
          console.error("Error fetching audio stream", err);
        }
      }
    };

    fetchAudio();

    return () => {
      // Cleanup blob URLs
      if (audioSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, [scenes, currentSceneIndex, audioSrc]);

  const handleGenerationComplete = useCallback(() => {
    // Refetch lesson and scenes when generation completes
    void refetchLesson();
    void refetchScenes();
  }, [refetchLesson, refetchScenes]);

  const handleGenerationError = useCallback((error: string) => {
    setGenerationError(error);
  }, []);

  const handleNextScene = () => {
    if (scenes && currentSceneIndex < scenes.length - 1) {
      setCurrentSceneIndex(currentSceneIndex + 1);
    }
  };

  const handlePrevScene = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(currentSceneIndex - 1);
    }
  };

  const handleSceneComplete = () => {
    console.log(`Scene ${currentSceneIndex + 1} completed.`);
    // Check if this was the last scene
    if (scenes && currentSceneIndex === scenes.length - 1) {
      setIsLessonComplete(true);
    }
  };

  const handleRestartLesson = () => {
    setCurrentSceneIndex(0);
    setIsLessonComplete(false);
  };

  const handleQuizComplete = (isCorrect: boolean) => {
    console.log(
      `Quiz in scene ${currentSceneIndex + 1} completed. Correct: ${isCorrect}`,
    );
  };

  const handleAudioEnded = useCallback(() => {
    if (autoAdvance && scenes && currentSceneIndex < scenes.length - 1) {
      setTimeout(() => {
        handleNextScene();
      }, 500);
    }
  }, [autoAdvance, scenes, currentSceneIndex, handleNextScene]);

  const handleAudioReady = useCallback(() => {
    // Auto-play when ready and narrator is active
    if (isNarratorActive) {
      audioPlayerRef.current?.play();
    }
  }, [isNarratorActive]);

  // Handle time updates for karaoke sync
  const handleAudioTimeUpdate = useCallback(
    (time: number, isPlaying: boolean) => {
      setCurrentNarrationTime(time);
      setIsNarratorPlaying(isPlaying);
    },
    [],
  );

  // Show generation overlay if lesson is in generating state
  if (lesson?.status === "generating") {
    return (
      <GenerationOverlay
        lessonId={lessonId}
        targetAge={targetAge}
        sceneCount={sceneCount}
        onComplete={handleGenerationComplete}
        onError={handleGenerationError}
      />
    );
  }

  // Show error state
  if (lesson?.status === "error" || generationError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 bg-white/50 backdrop-blur-sm rounded-2xl">
        <AlertTriangle className="size-12 mb-4" />
        <p className="text-lg font-semibold">Generation Failed</p>
        <p className="text-sm text-slate-600 mb-4">
          {generationError || "Something went wrong during lesson generation."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  if (isLessonLoading || isScenesLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-white/50 backdrop-blur-sm rounded-2xl">
        <Loader2 className="animate-spin size-16 mb-4 text-blue-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 bg-white/50 backdrop-blur-sm rounded-2xl">
        <AlertTriangle className="size-12 mb-4" />
        <p className="text-lg font-semibold">Error loading lesson</p>
        <p className="text-sm">
          {error?.message || "An unknown error occurred."}
        </p>
      </div>
    );
  }

  if (!scenes || scenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-white/50 backdrop-blur-sm rounded-2xl">
        <AlertTriangle className="size-12 mb-4" />
        <p className="text-lg">This lesson has no scenes.</p>
      </div>
    );
  }

  // Show lesson complete screen
  if (isLessonComplete) {
    return (
      <LessonComplete
        lessonTitle={lesson?.title}
        totalScenes={scenes.length}
        onRestart={handleRestartLesson}
      />
    );
  }

  const currentScene = scenes[currentSceneIndex];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Lesson Header */}
      <header className="flex items-center justify-between px-8 py-4 shrink-0 bg-transparent">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {currentScene.hasQuiz ? "Quiz" : "Lesson"}:{" "}
            {currentScene.title || "Untitled"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Narrator Toggle */}
          <button
            type="button"
            onClick={() => setIsNarratorActive(!isNarratorActive)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
              isNarratorActive
                ? "bg-[#3B82F6] text-white border-[#3B82F6] shadow-md shadow-blue-500/20"
                : "bg-[#F1F5F9] text-[#64748B] border-transparent hover:bg-slate-200",
            )}
          >
            {isNarratorActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
            Narrator
          </button>

          {/* Music Toggle */}
          <button
            type="button"
            onClick={() => setIsMusicActive(!isMusicActive)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
              isMusicActive
                ? "bg-[#3B82F6] text-white border-[#3B82F6] shadow-md shadow-blue-500/20"
                : "bg-[#F1F5F9] text-[#64748B] border-transparent hover:bg-slate-200",
            )}
          >
            <Music size={16} />
            Music
          </button>

          {/* Share Button */}
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/50 text-slate-600 hover:bg-white transition-colors border border-slate-200"
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative px-8 pb-0 custom-scrollbar">
        <ScenePlayer
          scene={currentScene}
          quiz={currentScene.quiz}
          currentSceneIndex={currentSceneIndex}
          totalScenes={scenes.length}
          onNext={handleNextScene}
          onPrev={handlePrevScene}
          autoAdvance={autoAdvance}
          onAutoAdvanceChange={setAutoAdvance}
          onQuizComplete={handleQuizComplete}
          onSceneComplete={handleSceneComplete}
          isNarratorActive={isNarratorActive}
          isMusicActive={isMusicActive}
          onToggleNarrator={() => setIsNarratorActive(!isNarratorActive)}
          onToggleMusic={() => setIsMusicActive(!isMusicActive)}
          currentNarrationTime={currentNarrationTime}
          isNarratorPlaying={isNarratorPlaying}
        />
      </div>

      {/* Voice Tutor FAB */}
      <VoiceTutorFAB
        lessonTopic={lesson?.topic || ""}
        sceneTitle={currentScene.title || ""}
        sceneContent={currentScene.storyText || ""}
        sceneNumber={currentSceneIndex + 1}
      />

      {/* Sticky Footer with Audio Player */}
      <footer className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 z-50">
        {/* Audio Player Bar - Top of Footer */}
        {audioSrc && (
          <div className="border-b border-slate-100 bg-slate-50/50">
            <div className="max-w-7xl mx-auto">
              <SlimAudioPlayer
                ref={audioPlayerRef}
                src={audioSrc}
                isActive={isNarratorActive}
                onToggleActive={() => setIsNarratorActive(!isNarratorActive)}
                onEnded={handleAudioEnded}
                onReady={handleAudioReady}
                onTimeUpdate={handleAudioTimeUpdate}
              />
            </div>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="px-8 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <button
              type="button"
              onClick={handlePrevScene}
              disabled={currentSceneIndex === 0}
              className="flex items-center gap-2 px-5 py-2.5 text-slate-500 hover:text-slate-700 font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-full hover:bg-slate-50"
            >
              <ChevronLeft size={20} />
              Previous
            </button>

            {/* Scene Counter */}
            <span className="text-sm text-slate-400 font-medium">
              Scene {currentSceneIndex + 1} of {scenes.length}
            </span>

            <button
              type="button"
              onClick={handleNextScene}
              disabled={currentSceneIndex === scenes.length - 1}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] text-white font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-full hover:bg-blue-600 shadow-md shadow-blue-500/20"
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
