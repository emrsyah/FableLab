"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Audio constants
const PLAYBACK_RATE = 24000; // server → speaker (24 kHz mono PCM-16)

// Helper: Convert Int16 PCM to Float32
function i16ToF32(buf: ArrayBuffer): Float32Array {
  const i = new Int16Array(buf);
  const f = new Float32Array(i.length);
  for (let n = 0; n < i.length; n++) f[n] = i[n] / (i[n] < 0 ? 0x8000 : 0x7fff);
  return f;
}

interface UseAudioPlaybackOptions {
  muted?: boolean;
}

interface UseAudioPlaybackReturn {
  isPlaying: boolean;
  play: (pcm: ArrayBuffer) => void;
  resume: () => void;
}

export function useAudioPlayback({
  muted = false,
}: UseAudioPlaybackOptions = {}): UseAudioPlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nextPlayRef = useRef(0);
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const play = useCallback((pcm: ArrayBuffer) => {
    if (mutedRef.current) return;
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext({ sampleRate: PLAYBACK_RATE });
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    const f32 = i16ToF32(pcm);
    const buf = ctx.createBuffer(1, f32.length, PLAYBACK_RATE);
    buf.getChannelData(0).set(f32);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);

    const now = ctx.currentTime;
    const t = Math.max(nextPlayRef.current, now + 0.02);
    src.start(t);
    nextPlayRef.current = t + buf.duration;
    setIsPlaying(true);
    src.onended = () => {
      if (ctx.currentTime >= nextPlayRef.current - 0.05) {
        setIsPlaying(false);
      }
    };
  }, []);

  const resume = useCallback(() => {
    ctxRef.current?.resume();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ctxRef.current?.close();
    };
  }, []);

  return {
    isPlaying,
    play,
    resume,
  };
}
