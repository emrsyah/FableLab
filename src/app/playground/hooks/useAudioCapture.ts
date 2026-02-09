"use client";

import { useCallback, useRef, useState } from "react";

// Audio constants
const CAPTURE_RATE = 16000; // mic → server (16 kHz mono PCM-16)

// AudioWorklet source code
const WORKLET_SRC = `
class C extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0]?.[0];
    if (ch?.length) this.port.postMessage(new Float32Array(ch));
    return true;
  }
}
registerProcessor('capture-processor', C);
`;

// Helper: Resample audio
function resample(src: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return src;
  const r = from / to;
  const len = Math.floor(src.length / r);
  const dst = new Float32Array(len);
  for (let i = 0; i < len; i++) dst[i] = src[Math.floor(i * r)];
  return dst;
}

// Helper: Convert Float32 to Int16
function f32ToI16(f: Float32Array): ArrayBuffer {
  const i = new Int16Array(f.length);
  for (let n = 0; n < f.length; n++) {
    const s = Math.max(-1, Math.min(1, f[n]));
    i[n] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return i.buffer;
}

interface UseAudioCaptureOptions {
  onAudioData: (pcm: ArrayBuffer) => void;
}

interface UseAudioCaptureReturn {
  isCapturing: boolean;
  start: () => Promise<void>;
  stop: () => void;
  error: string | null;
}

export function useAudioCapture({
  onAudioData,
}: UseAudioCaptureOptions): UseAudioCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: CAPTURE_RATE,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      const ctx = new AudioContext({ sampleRate: CAPTURE_RATE });
      const blob = new Blob([WORKLET_SRC], { type: "application/javascript" });
      const blobUrl = URL.createObjectURL(blob);
      await ctx.audioWorklet.addModule(blobUrl);
      URL.revokeObjectURL(blobUrl);

      const source = ctx.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(ctx, "capture-processor");
      const gain = ctx.createGain();
      gain.gain.value = 0;
      source.connect(worklet);
      worklet.connect(gain);
      gain.connect(ctx.destination);

      worklet.port.onmessage = (e) => {
        const f32: Float32Array = e.data;
        const down = resample(f32, ctx.sampleRate, CAPTURE_RATE);
        const pcm = f32ToI16(down);
        onAudioData(pcm);
      };

      ctxRef.current = ctx;
      streamRef.current = stream;
      workletRef.current = worklet;
      setIsCapturing(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Microphone permission denied";
      setError(message);
      throw err;
    }
  }, [onAudioData]);

  const stop = useCallback(() => {
    workletRef.current?.disconnect();
    workletRef.current = null;
    streamRef.current?.getTracks().forEach((t) => {
      t.stop();
    });
    streamRef.current = null;
    ctxRef.current?.close();
    ctxRef.current = null;
    setIsCapturing(false);
  }, []);

  return {
    isCapturing,
    start,
    stop,
    error,
  };
}
