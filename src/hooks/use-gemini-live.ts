"use client";

import { GoogleGenAI, Modality } from "@google/genai";
import { useCallback, useRef, useState } from "react";
import { AudioPlaybackManager } from "@/lib/audio/audio-playback";
import { base64ToArrayBuffer } from "@/lib/audio/pcm-utils";

const MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";

interface LessonContext {
  topic: string;
  sceneTitle: string;
  sceneContent: string;
  sceneNumber: number;
}

interface UseGeminiLiveOptions {
  lessonContext: LessonContext;
  onTranscript?: (text: string, isInput: boolean) => void;
  onStateChange?: (
    state: "idle" | "connecting" | "connected" | "speaking",
  ) => void;
  onError?: (error: Error) => void;
}

interface UseGeminiLiveReturn {
  isConnected: boolean;
  isSpeaking: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendAudio: (base64Audio: string) => void;
  error: string | null;
}

export function useGeminiLive({
  lessonContext,
  onTranscript,
  onStateChange,
  onError,
}: UseGeminiLiveOptions): UseGeminiLiveReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // biome-ignore lint/suspicious/noExplicitAny: Gemini SDK session type not exported
  const sessionRef = useRef<any>(null);
  const playbackManagerRef = useRef<AudioPlaybackManager | null>(null);

  const connect = useCallback(async () => {
    try {
      setError(null);
      onStateChange?.("connecting");

      // 1. Get ephemeral token from our server
      const tokenResponse = await fetch("/api/voice-tutor/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonContext }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to get session token");
      }

      const { token } = await tokenResponse.json();

      // 2. Initialize audio playback
      playbackManagerRef.current = new AudioPlaybackManager(24000, {
        onPlaybackStart: () => {
          setIsSpeaking(true);
          onStateChange?.("speaking");
        },
        onPlaybackEnd: () => {
          setIsSpeaking(false);
          onStateChange?.("connected");
        },
      });
      await playbackManagerRef.current.initialize();

      // 3. Connect to Gemini Live API with ephemeral token
      const ai = new GoogleGenAI({ apiKey: token });

      const session = await ai.live.connect({
        model: MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live connected");
            setIsConnected(true);
            onStateChange?.("connected");
          },
          // biome-ignore lint/suspicious/noExplicitAny: Gemini SDK message type not exported
          onmessage: (message: any) => {
            // Handle audio response
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  const audioData = base64ToArrayBuffer(part.inlineData.data);
                  playbackManagerRef.current?.enqueue(audioData);
                }
              }
            }

            // Handle output transcription
            if (message.serverContent?.outputTranscription?.text) {
              onTranscript?.(
                message.serverContent.outputTranscription.text,
                false,
              );
            }

            // Handle input transcription
            if (message.serverContent?.inputTranscription?.text) {
              onTranscript?.(
                message.serverContent.inputTranscription.text,
                true,
              );
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              playbackManagerRef.current?.interrupt();
            }
          },
          // biome-ignore lint/suspicious/noExplicitAny: Gemini SDK error type not exported
          onerror: (e: any) => {
            console.error("Gemini Live error:", e);
            setError(e.message || "Connection error");
            onError?.(new Error(e.message || "Connection error"));
          },
          // biome-ignore lint/suspicious/noExplicitAny: Gemini SDK close event type not exported
          onclose: (e: any) => {
            console.log("Gemini Live closed:", e?.reason);
            setIsConnected(false);
            onStateChange?.("idle");
          },
        },
      });

      sessionRef.current = session;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to connect");
      setError(error.message);
      onError?.(error);
      onStateChange?.("idle");
    }
  }, [lessonContext, onTranscript, onStateChange, onError]);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    playbackManagerRef.current?.dispose();
    playbackManagerRef.current = null;

    setIsConnected(false);
    setIsSpeaking(false);
    onStateChange?.("idle");
  }, [onStateChange]);

  const sendAudio = useCallback(
    (base64Audio: string) => {
      if (!sessionRef.current || !isConnected) return;

      sessionRef.current.sendRealtimeInput({
        audio: {
          data: base64Audio,
          mimeType: "audio/pcm;rate=16000",
        },
      });
    },
    [isConnected],
  );

  return {
    isConnected,
    isSpeaking,
    connect,
    disconnect,
    sendAudio,
    error,
  };
}
