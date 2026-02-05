"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
}: ScenePlayerProps) {
  const { status, setReady, play, pause, handleAudioEnd, handleQuizCorrect } =
    useSceneState(scene, quiz);

  const audioRef = useRef<HTMLAudioElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);

  /* Audio Source State */
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
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

  // Initialize audio when scene changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
    }

    setAudioSrc(null);
    setMusicSrc(null);

    return () => {
      if (audioSrc?.startsWith("blob:")) URL.revokeObjectURL(audioSrc);
      if (musicSrc?.startsWith("blob:")) URL.revokeObjectURL(musicSrc);
    };
  }, [audioSrc, musicSrc]);

  // Fetch Audio (Narrator)
  useEffect(() => {
    const fetchAudio = async () => {
      if (scene.narrationUrl) {
        setAudioSrc(scene.narrationUrl);
        return;
      }
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
  }, [scene.narrationUrl, scene.storyText]);

  // Fetch Music
  useEffect(() => {
    const fetchMusic = async () => {
      if (scene.backgroundMusicUrl) {
        setMusicSrc(scene.backgroundMusicUrl);
        return;
      }
      const prompt = `Ambient sound for: ${scene.title}. Peaceful, subtle background.`;
      try {
        const res = await fetch("/api/music", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        if (res.ok) {
          const blob = await res.blob();
          setMusicSrc(URL.createObjectURL(blob));
        }
      } catch (err) {
        console.error("Error fetching music stream", err);
      }
    };
    fetchMusic();
  }, [scene.backgroundMusicUrl, scene.title]);

  // Handle Playback based on toggles and status
  useEffect(() => {
    if (!audioRef.current) return;

    // Narrator Logic
    if (audioSrc) {
      audioRef.current.src = audioSrc;
      if (isNarratorActive && status === "playing") {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [audioSrc, isNarratorActive, status]);

  useEffect(() => {
    if (!musicRef.current) return;

    // Music Logic
    if (musicSrc) {
      musicRef.current.src = musicSrc;
      musicRef.current.loop = true;
      musicRef.current.volume = 0.2;

      if (isMusicActive && status === "playing") {
        musicRef.current.play().catch(() => {});
      } else {
        musicRef.current.pause();
      }
    }
  }, [musicSrc, isMusicActive, status]);

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
    const timer = setTimeout(() => {
      if (!audioSrc && !scene.narrationUrl && !scene.storyText) {
        setReady();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [audioSrc, scene.narrationUrl, scene.storyText, setReady]);

  // Initial Play Trigger (Autoplay per scene logic handled by useSceneState usually, but we safeguard here)
  useEffect(() => {
    // If scene changes, we defaults to 'playing' usually if autoAdvance is on?
    // useSceneState defaults status to 'initial'. Need to trigger play.
    if (status === "initial") {
      play();
    }
  }, [status, play]);

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-20">
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
            lessonTopic={scene.title} // Or fetch lesson topic from props if available, using title for now
            onComplete={(correct) => {
              if (correct) {
                handleQuizCorrect();
                // Optional: Celebration or delay before next
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
        />
      )}

      {/* Hidden Audio Elements */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onLoadedMetadata={setReady}
        className="hidden"
      />
      <audio ref={musicRef} className="hidden" />
    </div>
  );
}
