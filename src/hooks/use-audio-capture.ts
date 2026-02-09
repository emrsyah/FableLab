"use client";

import { useCallback, useRef, useState } from "react";
import {
  arrayBufferToBase64,
  downsampleBuffer,
  floatTo16BitPCM,
} from "@/lib/audio/pcm-utils";

const TARGET_SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;

interface UseAudioCaptureOptions {
  onAudioData: (base64Audio: string) => void;
  onError?: (error: Error) => void;
}

interface UseAudioCaptureReturn {
  isCapturing: boolean;
  startCapture: () => Promise<void>;
  stopCapture: () => void;
  error: string | null;
}

export function useAudioCapture({
  onAudioData,
  onError,
}: UseAudioCaptureOptions): UseAudioCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const startCapture = useCallback(async () => {
    try {
      setError(null);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: { ideal: TARGET_SAMPLE_RATE },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Create audio context
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Create source from microphone
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Create script processor for audio processing
      // Note: ScriptProcessorNode is deprecated but AudioWorklet requires more setup
      const processor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);

        // Downsample to 16kHz if needed
        const downsampled = downsampleBuffer(
          inputData,
          audioContext.sampleRate,
          TARGET_SAMPLE_RATE,
        );

        // Convert to 16-bit PCM
        const pcmBuffer = floatTo16BitPCM(downsampled);

        // Convert to base64 and send
        const base64 = arrayBufferToBase64(pcmBuffer);
        onAudioData(base64);
      };

      // Connect the audio graph
      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsCapturing(true);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to start audio capture");
      setError(error.message);
      onError?.(error);
    }
  }, [onAudioData, onError]);

  const stopCapture = useCallback(() => {
    // Disconnect processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Disconnect source
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop all tracks
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    setIsCapturing(false);
  }, []);

  return {
    isCapturing,
    startCapture,
    stopCapture,
    error,
  };
}
