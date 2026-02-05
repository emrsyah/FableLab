"use client";

import { AlertTriangle, Loader2, RefreshCw, Share2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { GenerationOverlay } from "@/components/lesson/generation-overlay";
import { useSceneProgress } from "@/components/lesson/hooks/use-scene-progress";
import { ScenePlayer } from "@/components/lesson/scene-player/scene-player";
import { UserProfilePill } from "@/components/user-profile-pill";
import { authClient } from "@/lib/auth/client";
import { trpc } from "@/lib/trpc/client";

type LessonClientPageProps = {
  lessonId: string;
};

export default function LessonClientPage({ lessonId }: LessonClientPageProps) {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { getProgress, saveProgress } = useSceneProgress(lessonId);

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [generationError, setGenerationError] = useState<string | null>(null);

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
  };

  const handleQuizComplete = (isCorrect: boolean) => {
    console.log(
      `Quiz in scene ${currentSceneIndex + 1} completed. Correct: ${isCorrect}`,
    );
  };

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
        <Loader2 className="animate-spin size-12 mb-4 text-blue-500" />
        <p className="text-lg font-medium text-slate-700">
          Loading your lesson...
        </p>
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

  const currentScene = scenes[currentSceneIndex];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Lesson Header */}
      <header className="flex items-center justify-between px-8 py-6 shrink-0 bg-transparent">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {currentScene.hasQuiz ? "Quiz" : "Lesson"}:{" "}
            {currentScene.title || "Untitled"}
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl truncate">
            {currentScene.storyText
              ? `${currentScene.storyText.substring(0, 100)}...`
              : "Explore this interactive lesson."}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Share Button */}
          <button
            type="button"
            className="flex h-10 items-center gap-2 px-6 rounded-full bg-[radial-gradient(ellipse_at_center,#6FA0F6_0%,#3C7AE8_80%)] text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:shadow-[0_0_20px_rgba(111,160,246,0.8)] hover:scale-[1.02] hover:brightness-105 ring-4 ring-blue-200/80 transition-all duration-300 transform font-medium text-sm"
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>

          {/* User Profile */}
          {session?.user && <UserProfilePill user={session.user} />}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative px-8 pb-8 custom-scrollbar">
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
    </div>
  );
}
