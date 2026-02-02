"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { ScenePlayer } from "@/components/lesson/scene-player/scene-player";
import { useSceneProgress } from "@/components/lesson/hooks/use-scene-progress";
import { Loader2, AlertTriangle, Share2, User, ChevronRight } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

type LessonClientPageProps = {
  lessonId: string;
};

export default function LessonClientPage({ lessonId }: LessonClientPageProps) {
  const { data: session } = authClient.useSession();
  const router = useRouter(); // For back navigation if needed

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
      gcTime: Infinity,
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
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-white/50 backdrop-blur-sm rounded-2xl">
        <Loader2 className="animate-spin size-12 mb-4 text-blue-500" />
        <p className="text-lg font-medium text-slate-700">Loading your lesson...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 bg-white/50 backdrop-blur-sm rounded-2xl">
        <AlertTriangle className="size-12 mb-4" />
        <p className="text-lg font-semibold">Error loading lesson</p>
        <p className="text-sm">{error?.message || "An unknown error occurred."}</p>
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
             Lesson: {currentScene.title || "Untitled Lesson"} 
           </h1>
           <p className="text-slate-500 text-sm mt-1 max-w-2xl truncate">
             {currentScene.storyText ? currentScene.storyText.substring(0, 100) + "..." : "Explore this interactive lesson."}
           </p>
        </div>

        <div className="flex items-center gap-4">
           {/* Share Button */}
           <button className="flex h-10 items-center gap-2 px-6 rounded-full bg-[radial-gradient(ellipse_at_center,#6FA0F6_0%,#3C7AE8_80%)] text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:shadow-[0_0_20px_rgba(111,160,246,0.8)] hover:scale-[1.02] hover:brightness-105 ring-4 ring-blue-200/80 transition-all duration-300 transform font-medium text-sm">
             <Share2 size={16} />
             <span>Share</span>
           </button>

           {/* User Profile */}
           {session?.user && (
             <div className="flex items-center gap-3 bg-white p-1 pl-1.5 pr-4 rounded-full border border-slate-100 shadow-sm">
                {session.user.image ? (
                  <img src={session.user.image} alt="User" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <User size={16} />
                  </div>
                )}
                <div className="text-left hidden sm:block">
                   <div className="text-xs font-bold text-slate-700 leading-tight">
                     {session.user.name || "Student"}
                   </div>
                   <div className="text-[10px] text-slate-400 font-medium truncate max-w-[100px]">
                     {session.user.email}
                   </div>
                </div>
                <div className="text-slate-400">
                  <ChevronRight size={14} className="rotate-90" />
                </div>
             </div>
           )}
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
