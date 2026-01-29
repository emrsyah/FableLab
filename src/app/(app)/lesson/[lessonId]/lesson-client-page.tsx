"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { ScenePlayer } from "@/components/lesson/scene-player/scene-player";
import { useSceneProgress } from "@/components/lesson/hooks/use-scene-progress";
import { Loader2, AlertTriangle } from "lucide-react";

type LessonClientPageProps = {
  lessonId: string;
};

export default function LessonClientPage({ lessonId }: LessonClientPageProps) {
  const { getProgress, saveProgress } = useSceneProgress(lessonId);

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);

  // Fetch scenes for the lesson
  const {
    data: scenes,
    isLoading,
    isError,
    error,
  } = trpc.scenes.getByLessonId.useQuery(
    { lessonId },
    {
      enabled: !!lessonId, // Only run query if lessonId is available
      staleTime: Infinity, // Scenes are static for a given lesson
      cacheTime: Infinity,
    }
  );

  // Load progress on initial render
  useEffect(() => {
    const savedIndex = getProgress();
    if (savedIndex) {
      setCurrentSceneIndex(savedIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save progress whenever the scene changes
  useEffect(() => {
    saveProgress(currentSceneIndex);
  }, [currentSceneIndex, saveProgress]);

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
    // This callback is for any logic to run when a scene is "completed"
    // For example, logging analytics.
    console.log(`Scene ${currentSceneIndex + 1} completed.`);
  };

  const handleQuizComplete = (isCorrect: boolean) => {
    // This callback is for any logic to run when a quiz is completed
    console.log(`Quiz in scene ${currentSceneIndex + 1} completed. Correct: ${isCorrect}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Loader2 className="animate-spin size-12 mb-4" />
        <p className="text-lg">Loading your lesson...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500">
        <AlertTriangle className="size-12 mb-4" />
        <p className="text-lg font-semibold">Error loading lesson</p>
        <p className="text-sm">{error?.message || "An unknown error occurred."}</p>
      </div>
    );
  }

  if (!scenes || scenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <AlertTriangle className="size-12 mb-4" />
        <p className="text-lg">This lesson has no scenes.</p>
      </div>
    );
  }

  const currentScene = scenes[currentSceneIndex];

  return (
    <div className="h-full bg-slate-900">
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
      />
    </div>
  );
}
