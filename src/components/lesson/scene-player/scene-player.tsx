"use client";

import { useEffect, useRef, useState } from "react";
import { useSceneState } from "../hooks/use-scene-state";
import { QuizAlert } from "../quiz-alert";
import { QuizInterface } from "../quiz-interface";
import type { ScenePlayerProps } from "../types/scene.types";
import { SceneStandardView } from "./scene-standard-view";

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
  isNarratorActive,
  isMusicActive,
  onToggleNarrator,
  onToggleMusic,
  currentNarrationTime = 0,
  isNarratorPlaying = false,
}: ScenePlayerProps) {
  const { status, setReady, play, pause, handleAudioEnd, handleQuizCorrect } =
    useSceneState(scene, quiz);

  const musicRef = useRef<HTMLAudioElement>(null);

  /* Music Source State */
  const [musicSrc, setMusicSrc] = useState<string | null>(null);

  /* Quiz Alert State */
  const [showQuizAlert, setShowQuizAlert] = useState(false);
  const [isQuizMode, setIsQuizMode] = useState(false);

  // Show Alert when entering a quiz scene
  useEffect(() => {
    // Reset Quiz Mode on scene change
    setIsQuizMode(false);

    if (scene.hasQuiz) {
      setShowQuizAlert(true);
    } else {
      setShowQuizAlert(false);
    }
  }, [scene.hasQuiz]);

  // Reset music when scene changes
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
    }
    setMusicSrc(null);
  }, []);

  // Fetch Music
  useEffect(() => {
    const fetchMusic = async () => {
      if (scene.backgroundMusicUrl) {
        setMusicSrc(scene.backgroundMusicUrl);
        return;
      }
      // Skip on-demand music generation for now to reduce API calls
    };
    fetchMusic();

    return () => {
      if (musicSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(musicSrc);
      }
    };
  }, [scene.backgroundMusicUrl, musicSrc]);

  // Handle Music Playback
  useEffect(() => {
    if (!musicRef.current || !musicSrc) return;

    musicRef.current.src = musicSrc;
    musicRef.current.loop = true;
    musicRef.current.volume = 0.15;

    if (isMusicActive && status === "playing") {
      musicRef.current.play().catch(() => {});
    } else {
      musicRef.current.pause();
    }
  }, [musicSrc, isMusicActive, status]);

  // Initial Play Trigger
  useEffect(() => {
    if (status === "initial") {
      play();
    }
  }, [status, play]);

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-6">
      {/* Quiz Alert Overlay */}
      {showQuizAlert && (
        <QuizAlert
          onContinue={() => {
            setShowQuizAlert(false);
            setIsQuizMode(true);
          }}
        />
      )}

      {/* Main Content Area: Toggle between Standard Scene and Quiz Interface */}
      {isQuizMode && quiz ? (
        <div className="w-full max-w-5xl mx-auto h-full">
          <QuizInterface
            quiz={quiz}
            sceneTitle={scene.title}
            lessonTopic={scene.title}
            onComplete={(correct) => {
              if (correct) {
                handleQuizCorrect();
                if (currentSceneIndex < totalScenes - 1) {
                  setTimeout(() => onNext(), 1500);
                } else {
                  onSceneComplete();
                }
              }
            }}
            onBack={() => setIsQuizMode(false)}
          />
        </div>
      ) : (
        <SceneStandardView
          scene={scene}
          currentSceneIndex={currentSceneIndex}
          totalScenes={totalScenes}
          currentNarrationTime={currentNarrationTime}
          isNarratorPlaying={isNarratorPlaying}
        />
      )}

      {/* Hidden Music Audio Element */}
      <audio ref={musicRef} className="hidden" />
    </div>
  );
}
