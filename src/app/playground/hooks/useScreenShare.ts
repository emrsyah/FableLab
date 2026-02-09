"use client";

import { useCallback, useRef, useState } from "react";

// Screen capture constants
const SCREEN_FPS = 1; // screen capture frame rate (1 FPS recommended)
const SCREEN_SIZE = 768; // target resolution for screen frames (768×768)
const SCREEN_QUALITY = 0.7; // JPEG quality (0–1)

interface UseScreenShareOptions {
  onFrame: (base64Image: string) => void;
}

interface UseScreenShareReturn {
  isSharing: boolean;
  start: () => Promise<void>;
  stop: () => void;
  error: string | null;
}

export function useScreenShare({
  onFrame,
}: UseScreenShareOptions): UseScreenShareReturn {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement("canvas");
    const aspect = video.videoWidth / video.videoHeight;
    let w = SCREEN_SIZE;
    let h = SCREEN_SIZE;
    if (aspect > 1) h = Math.round(SCREEN_SIZE / aspect);
    else w = Math.round(SCREEN_SIZE * aspect);
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    const dataUrl = canvas.toDataURL("image/jpeg", SCREEN_QUALITY);
    const b64 = dataUrl.split(",")[1];
    if (b64) {
      onFrame(b64);
    }
  }, [onFrame]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: SCREEN_SIZE },
          height: { ideal: SCREEN_SIZE },
        },
        audio: false,
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await video.play();

      streamRef.current = stream;
      videoRef.current = video;

      intervalRef.current = setInterval(() => {
        captureFrame();
      }, 1000 / SCREEN_FPS);

      stream.getVideoTracks()[0].addEventListener("ended", () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        streamRef.current = null;
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current = null;
        }
        setIsSharing(false);
      });

      setIsSharing(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Screen share denied";
      setError(message);
      throw err;
    }
  }, [captureFrame]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => {
      t.stop();
    });
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    setIsSharing(false);
  }, []);

  return {
    isSharing,
    start,
    stop,
    error,
  };
}
