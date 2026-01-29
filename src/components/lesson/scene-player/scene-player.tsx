"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useSceneState } from "../hooks/use-scene-state";
import { type ScenePlayerProps } from "../types/scene.types";

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
  const {
    status,
    setReady,
    play,
    pause,
    handleAudioEnd,
    handleQuizCorrect,
  } = useSceneState(scene, quiz);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  /* New State for Dynamic Audio */
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [musicSrc, setMusicSrc] = useState<string | null>(null);

  const musicRef = useRef<HTMLAudioElement>(null);

  // Initialize audio when scene changes
  useEffect(() => {
    // Reset states
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (musicRef.current) {
       musicRef.current.pause();
       musicRef.current.currentTime = 0;
    }

    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    setAudioProgress(0);
    setAudioSrc(null);
    setMusicSrc(null);

    // cleanup previous blob url
    return () => {
      if (audioSrc && audioSrc.startsWith("blob:")) {
        URL.revokeObjectURL(audioSrc);
      }
      if (musicSrc && musicSrc.startsWith("blob:")) {
        URL.revokeObjectURL(musicSrc);
      }
    };
  }, [scene.id]); // trigger on scene change

  // Fetch Audio Effect
  useEffect(() => {
    const fetchAudio = async () => {
      // Priority 1: Use existing URL from DB
      if (scene.narrationUrl) {
        setAudioSrc(scene.narrationUrl);
        return;
      }

      // Priority 2: Streaming from API if text exists
      if (scene.storyText) {
        try {
          // don't auto-fetch if we already have it (handled by effect dependency)
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: scene.storyText }),
          });
          
          if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setAudioSrc(url);
          } else {
             console.error("Failed to fetch audio stream");
          }
        } catch (err) {
          console.error("Error fetching audio stream", err);
        }
      }
    };

    fetchAudio();
  }, [scene.id, scene.narrationUrl, scene.storyText]);

  // Fetch Music (Ambient) Effect
  useEffect(() => {
    const fetchMusic = async () => {
      // Avoid re-fetching if we already have a music source for this scene (unless it was cleared)
      // But since we clear on [scene.id], we should be good.
      
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
            const url = URL.createObjectURL(blob);
            setMusicSrc(url);
        }
      } catch (err) {
        console.error("Error fetching music stream", err);
      }
    };

    fetchMusic();
  }, [scene.id, scene.backgroundMusicUrl, scene.title]);

  // Load audio when src changes
  useEffect(() => {
    if (audioSrc && audioRef.current) {
        audioRef.current.src = audioSrc;
        audioRef.current.load();
    }
  }, [audioSrc]);

  // Load/Play Music when src changes
  useEffect(() => {
    if (musicSrc && musicRef.current) {
        musicRef.current.src = musicSrc;
        musicRef.current.load();
        musicRef.current.volume = 0.2; // Low background volume
        if (status === "playing") {
             musicRef.current.play().catch(() => {});
        }
    }
  }, [musicSrc]);

  // Sync Music Playback with Narration Status
  useEffect(() => {
    if (!musicRef.current || !musicSrc) return;
    
    if (status === "playing") {
        musicRef.current.play().catch(() => {});
    } else {
        musicRef.current.pause();
    }
  }, [status, musicSrc]);


  // Audio event handlers
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
      setReady();
    }
  }, [setReady]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && audioDuration > 0) {
      const progress = (audioRef.current.currentTime / audioDuration) * 100;
      setAudioProgress(progress);
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
    // If no audio source is determined after a short delay, set ready
    // This handles cases where fetch fails or no text exists
    const timer = setTimeout(() => {
        if (!audioSrc && !scene.narrationUrl && !scene.storyText) {
            setReady();
        }
    }, 1000);
    return () => clearTimeout(timer);
  }, [audioSrc, scene.narrationUrl, scene.storyText, setReady]);

  // Play/Pause toggle
  const togglePlayPause = () => {
    if (status === "playing") {
      if (audioRef.current) audioRef.current.pause();
      if (musicRef.current) musicRef.current.pause();
      pause();
    } else {
      if (audioRef.current) audioRef.current.play();
      if (musicRef.current) musicRef.current.play();
      play();
    }
  };

  // Mute toggle
  const toggleMute = () => {
    if (audioRef.current) audioRef.current.muted = !isMuted;
    if (musicRef.current) musicRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Restart scene
  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
    if (musicRef.current) {
        musicRef.current.currentTime = 0;
        musicRef.current.play();
    }
    play();
  };

  // Quiz answer submission
  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || !quiz) return;

    const correct = selectedAnswer === quiz.correctIndex;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      handleQuizCorrect();
      onQuizComplete(true);
    }
  };

  const handleContinueAfterQuiz = () => {
    onSceneComplete();
    if (currentSceneIndex < totalScenes - 1) {
      onNext();
    }
  };

  // Navigation dots
  const navigationDots = Array.from({ length: totalScenes }, (_, i) => i);

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 gap-6">
      {/* Scene Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Scene {currentSceneIndex + 1} of {totalScenes}
          </span>
          <h2 className="text-xl font-semibold">{scene.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Auto-advance</span>
          <Switch
            checked={autoAdvance}
            onCheckedChange={onAutoAdvanceChange}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Visual Panel */}
        <Card className="overflow-hidden">
          <CardContent className="p-0 aspect-video relative bg-gradient-to-br from-slate-900 to-slate-800">
            {scene.visualType === "image" && scene.imageUrl ? (
              <Image
                src={scene.imageUrl}
                alt={scene.title}
                fill
                className="object-cover"
                priority
              />
            ) : scene.visualType === "geogebra" && scene.geogebraConfig ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <span>GeoGebra Visualization</span>
                {/* GeoGebra component will be added later */}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                <div className="text-center">
                  <div className="text-6xl mb-2">🔬</div>
                  <span className="text-muted-foreground text-sm">
                    Scene Illustration
                  </span>
                </div>
              </div>
            )}

            {/* Learning Objective Badge */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-xs text-white/70 uppercase tracking-wider mb-1">
                  Learning Objective
                </p>
                <p className="text-sm text-white">{scene.learningObjective}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Narrative Panel */}
        <Card className="flex flex-col">
          <CardContent className="flex-1 overflow-auto">
            {/* Quiz Gate - Show Quiz Modal */}
            {status === "quiz_gate" && quiz ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📝</span>
                  <h3 className="text-lg font-semibold">Knowledge Check</h3>
                </div>

                <p className="text-base mb-6">{quiz.question}</p>

                <div className="space-y-3 mb-6">
                  {quiz.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showResult}
                      className={cn(
                        "w-full p-4 rounded-lg text-left transition-all border",
                        selectedAnswer === index
                          ? showResult
                            ? isCorrect && index === quiz.correctIndex
                              ? "bg-green-500/20 border-green-500 text-green-400"
                              : !isCorrect && index === selectedAnswer
                              ? "bg-red-500/20 border-red-500 text-red-400"
                              : "bg-accent border-border"
                            : "bg-primary/10 border-primary"
                          : showResult && index === quiz.correctIndex
                          ? "bg-green-500/20 border-green-500 text-green-400"
                          : "bg-card hover:bg-accent border-border",
                        showResult && "cursor-default"
                      )}
                    >
                      <span className="font-medium mr-2">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {option}
                    </button>
                  ))}
                </div>

                {showResult ? (
                  <div className="mt-auto">
                    <div
                      className={cn(
                        "p-4 rounded-lg mb-4",
                        isCorrect ? "bg-green-500/10" : "bg-amber-500/10"
                      )}
                    >
                      <p className="font-medium mb-2">
                        {isCorrect ? "✅ Correct!" : "❌ Not quite right"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {quiz.explanation}
                      </p>
                    </div>
                    {isCorrect && (
                      <Button
                        onClick={handleContinueAfterQuiz}
                        className="w-full"
                        size="lg"
                      >
                        Continue to Next Scene
                      </Button>
                    )}
                    {!isCorrect && (
                      <Button
                        onClick={() => {
                          setSelectedAnswer(null);
                          setShowResult(false);
                        }}
                        variant="outline"
                        className="w-full"
                        size="lg"
                      >
                        Try Again
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswer === null}
                    className="mt-auto w-full"
                    size="lg"
                  >
                    Submit Answer
                  </Button>
                )}
              </div>
            ) : (
              /* Story Text */
              <div className="prose prose-invert max-w-none">
                <p className="text-base leading-relaxed whitespace-pre-line">
                  {scene.storyText}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audio Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRestart}
                disabled={!audioSrc && !musicSrc}
              >
                <RotateCcw className="size-4" />
              </Button>
              <Button
                variant="default"
                size="icon-lg"
                onClick={togglePlayPause}
                disabled={(!audioSrc && !musicSrc) || status === "loading"}
              >
                {status === "playing" ? (
                  <Pause className="size-5" />
                ) : (
                  <Play className="size-5 ml-0.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                disabled={!audioSrc && !musicSrc}
              >
                {isMuted ? (
                  <VolumeX className="size-4" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="flex-1">
              <Progress value={audioProgress} className="h-2" />
            </div>

            {/* Duration */}
            <span className="text-sm text-muted-foreground min-w-[80px] text-right">
              {scene.narrationDuration
                ? `${Math.floor(scene.narrationDuration / 60)}:${String(
                    scene.narrationDuration % 60
                  ).padStart(2, "0")}`
                : "--:--"}
            </span>
          </div>

          {/* Hidden Audio Elements */}
          {audioSrc && (
            <audio
              ref={audioRef}
              src={audioSrc}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleAudioEnded}
              preload="metadata"
            />
          )}

          {/* Background Music Loop */}
          {musicSrc && (
            <audio
              ref={musicRef}
              src={musicSrc}
              loop
              preload="metadata"
            />
          )}
        </CardContent>
      </Card>

      {/* Scene Navigation */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            {/* Previous Button */}
            <Button
              variant="outline"
              onClick={onPrev}
              disabled={currentSceneIndex === 0}
            >
              <SkipBack className="size-4 mr-2" />
              Previous
            </Button>

            {/* Navigation Dots */}
            <div className="flex items-center gap-2">
              {navigationDots.map((dotIndex) => (
                <button
                  key={dotIndex}
                  className={cn(
                    "size-2.5 rounded-full transition-all",
                    dotIndex === currentSceneIndex
                      ? "bg-primary scale-125"
                      : dotIndex < currentSceneIndex
                      ? "bg-primary/50"
                      : "bg-muted-foreground/30"
                  )}
                  aria-label={`Go to scene ${dotIndex + 1}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <Button
              variant="outline"
              onClick={() => {
                onSceneComplete();
                onNext();
              }}
              disabled={
                currentSceneIndex === totalScenes - 1 ||
                status === "quiz_gate"
              }
            >
              Next
              <SkipForward className="size-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
