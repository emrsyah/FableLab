"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useSceneState } from "../hooks/use-scene-state";
import type { ScenePlayerProps } from "../types/scene.types";
import { SceneVisual } from "./scene-visual";
import { SceneAudio } from "./sub-components/scene-audio";
import { SceneNarrative } from "./sub-components/scene-narrative";
import { SceneNavigation } from "./sub-components/scene-navigation";
import { SceneQuiz } from "./sub-components/scene-quiz";

export function ScenePlayer({
  scene,
  quiz,
  currentSceneIndex,
  totalScenes,
  onNext,
  onPrev,
  autoAdvance,
  onAutoAdvanceChange,
  onQuizComplete,
  onSceneComplete,
}: ScenePlayerProps) {
  const { status, setReady, play, pause, handleAudioEnd, handleQuizCorrect } =
    useSceneState(scene, quiz);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Initialize audio when scene changes
  useEffect(() => {
    if (scene.narrationUrl && audioRef.current) {
      audioRef.current.load();
    }
    setAudioProgress(0);
    setCurrentTime(0);
  }, [scene.id, scene.narrationUrl]);

  // Audio event handlers
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
      setReady();
    }
  }, [setReady]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && audioDuration > 0) {
      const current = audioRef.current.currentTime;
      const progress = (current / audioDuration) * 100;
      setAudioProgress(progress);
      setCurrentTime(current);
    }
  }, [audioDuration]);

  const handleAudioEnded = useCallback(() => {
    handleAudioEnd();
    if (autoAdvance && status === "playing" && !scene.hasQuiz) {
      setTimeout(() => {
        onSceneComplete();
        if (currentSceneIndex < totalScenes - 1) {
          onNext();
        }
      }, 500);
    }
  }, [
    handleAudioEnd,
    autoAdvance,
    status,
    scene.hasQuiz,
    onSceneComplete,
    currentSceneIndex,
    totalScenes,
    onNext,
  ]);

  // Auto-set ready if no narration
  useEffect(() => {
    if (!scene.narrationUrl) {
      setReady();
    }
  }, [scene.narrationUrl, setReady]);

  // Play/Pause toggle
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (status === "playing") {
      audioRef.current.pause();
      pause();
    } else {
      audioRef.current.play();
      play();
    }
  };

  // Mute toggle
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Restart scene
  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      play();
    }
  };

  const handleQuizFinished = (correct: boolean) => {
    if (correct) {
      handleQuizCorrect();
      onQuizComplete(true);
    } else {
      onQuizComplete(false);
    }
  };

  const handleContinueAfterQuiz = () => {
    onSceneComplete();
    if (currentSceneIndex < totalScenes - 1) {
      onNext();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-6 gap-8 bg-slate-950 text-slate-50 min-h-[600px]">
      {/* Scene Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            Scene {currentSceneIndex + 1}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {scene.title}
          </h2>
        </div>
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
          <span className="text-sm font-medium text-slate-400">
            Auto-advance
          </span>
          <Switch
            checked={autoAdvance}
            onCheckedChange={onAutoAdvanceChange}
            className="data-[state=checked]:bg-indigo-600"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Visual Panel - Taking 7 columns */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="relative aspect-video rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl shadow-indigo-900/20">
            <SceneVisual scene={scene} currentSceneIndex={currentSceneIndex} />
          </div>

          <SceneAudio
            status={status}
            progress={audioProgress}
            duration={audioDuration}
            isMuted={isMuted}
            onTogglePlay={togglePlayPause}
            onToggleMute={toggleMute}
            onRestart={handleRestart}
            hasAudio={!!scene.narrationUrl}
          />
        </div>

        {/* Narrative/Quiz Panel - Taking 5 columns */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900/40 rounded-3xl p-8 border border-slate-800 shadow-inner overflow-hidden relative">
          <div className="overflow-auto flex-1 pr-2 custom-scrollbar">
            {status === "quiz_gate" && quiz ? (
              <SceneQuiz
                quiz={quiz}
                onComplete={handleQuizFinished}
                onContinue={handleContinueAfterQuiz}
              />
            ) : (
              <SceneNarrative
                storyText={scene.storyText}
                alignment={scene.narrationAlignment}
                currentTime={currentTime}
              />
            )}
          </div>
        </div>
      </div>

      {/* Scene Navigation */}
      <SceneNavigation
        currentSceneIndex={currentSceneIndex}
        totalScenes={totalScenes}
        onNext={() => {
          onSceneComplete();
          onNext();
        }}
        onPrev={onPrev}
        isNextDisabled={status === "quiz_gate"}
      />

      {/* Hidden Audio Element */}
      {scene.narrationUrl && (
        <audio
          ref={audioRef}
          src={scene.narrationUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
          preload="metadata"
        />
      )}
    </div>
  );
}
