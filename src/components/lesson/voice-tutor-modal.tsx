"use client";

import {
  Loader2,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Persona, type PersonaState } from "@/components/ai-elements/persona";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAudioCapture } from "@/hooks/use-audio-capture";
import { useGeminiLive } from "@/hooks/use-gemini-live";
import { cn } from "@/lib/utils";

interface VoiceTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonTopic: string;
  sceneTitle: string;
  sceneContent: string;
  sceneNumber: number;
}

type ConnectionState = "idle" | "connecting" | "connected" | "speaking";

interface TranscriptEntry {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export function VoiceTutorModal({
  isOpen,
  onClose,
  lessonTopic,
  sceneTitle,
  sceneContent,
  sceneNumber,
}: VoiceTutorModalProps) {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const lessonContext = {
    topic: lessonTopic,
    sceneTitle,
    sceneContent,
    sceneNumber,
  };

  const handleTranscript = useCallback((text: string, isInput: boolean) => {
    setTranscript((prev) => [
      ...prev,
      { text, isUser: isInput, timestamp: new Date() },
    ]);
  }, []);

  const {
    isConnected,
    isSpeaking,
    connect,
    disconnect,
    sendAudio,
    error: liveError,
  } = useGeminiLive({
    lessonContext,
    onTranscript: handleTranscript,
    onStateChange: setConnectionState,
  });

  const {
    isCapturing,
    startCapture,
    stopCapture,
    error: captureError,
  } = useAudioCapture({
    onAudioData: (base64Audio) => {
      if (!isMuted) {
        sendAudio(base64Audio);
      }
    },
  });

  // Auto-scroll transcript when new messages arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally scroll on transcript change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Start/stop audio capture based on connection
  useEffect(() => {
    if (isConnected && !isCapturing) {
      startCapture();
    } else if (!isConnected && isCapturing) {
      stopCapture();
    }
  }, [isConnected, isCapturing, startCapture, stopCapture]);

  // Clean up on close
  useEffect(() => {
    if (!isOpen) {
      disconnect();
      stopCapture();
      setTranscript([]);
      setConnectionState("idle");
    }
  }, [isOpen, disconnect, stopCapture]);

  const handleStartCall = async () => {
    setTranscript([]);
    await connect();
  };

  const handleEndCall = () => {
    disconnect();
    stopCapture();
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const getPersonaState = (): PersonaState => {
    if (connectionState === "connecting") return "thinking";
    if (isSpeaking) return "speaking";
    if (isConnected && isCapturing && !isMuted) return "listening";
    return "idle";
  };

  const getStatusMessage = () => {
    if (liveError || captureError) return liveError || captureError;
    switch (connectionState) {
      case "connecting":
        return "Connecting to Mana...";
      case "connected":
        return isMuted
          ? "Muted - Mana can't hear you"
          : "Listening... just start talking!";
      case "speaking":
        return "Mana is speaking...";
      default:
        return "Click the phone button to start talking with Mana!";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-32 right-8 z-50 w-96 bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600">
              <div className="flex items-center gap-2 text-white">
                <Volume2 className="w-5 h-5" />
                <span className="font-semibold">Talk to Mana</span>
                {isConnected && (
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col items-center">
              {/* Persona */}
              <div className="relative mb-4">
                <Persona
                  state={getPersonaState()}
                  variant="mana"
                  className="size-24"
                />

                {/* Speaking/Listening indicator */}
                {(isSpeaking || (isConnected && !isMuted)) && (
                  <motion.div
                    className={cn(
                      "absolute inset-0 rounded-full border-4",
                      isSpeaking ? "border-purple-400" : "border-green-400",
                    )}
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </div>

              {/* Status message */}
              <p className="text-center text-slate-600 mb-4 text-sm">
                {getStatusMessage()}
              </p>

              {/* Transcript */}
              {transcript.length > 0 && (
                <ScrollArea className="w-full h-32 mb-4 rounded-lg bg-slate-50 p-3">
                  <div ref={scrollRef} className="space-y-2">
                    {transcript.map((entry, i) => (
                      <div
                        key={`${entry.timestamp.getTime()}-${i}`}
                        className={cn(
                          "text-sm p-2 rounded-lg",
                          entry.isUser
                            ? "bg-blue-100 text-blue-800 ml-4"
                            : "bg-purple-100 text-purple-800 mr-4",
                        )}
                      >
                        <span className="font-medium">
                          {entry.isUser ? "You" : "Mana"}:
                        </span>{" "}
                        {entry.text}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Controls */}
              <div className="flex items-center gap-4">
                {/* Mute button (only when connected) */}
                {isConnected && (
                  <Button
                    onClick={toggleMute}
                    variant="outline"
                    size="icon"
                    className={cn(
                      "w-12 h-12 rounded-full",
                      isMuted && "bg-red-100 border-red-300",
                    )}
                  >
                    {isMuted ? (
                      <MicOff className="w-5 h-5 text-red-500" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </Button>
                )}

                {/* Call button */}
                <Button
                  onClick={isConnected ? handleEndCall : handleStartCall}
                  disabled={connectionState === "connecting"}
                  className={cn(
                    "w-16 h-16 rounded-full transition-all",
                    isConnected
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600",
                  )}
                >
                  {connectionState === "connecting" ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : isConnected ? (
                    <PhoneOff className="w-6 h-6" />
                  ) : (
                    <Phone className="w-6 h-6" />
                  )}
                </Button>
              </div>

              <p className="text-xs text-slate-400 mt-3">
                {isConnected
                  ? "You can interrupt Mana anytime by speaking"
                  : "Start a real-time voice conversation"}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
