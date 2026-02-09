"use client";

import { useCallback, useRef, useState } from "react";

// Webcam capture constants
const WEBCAM_FPS = 1; // webcam capture frame rate (1 FPS recommended)
const WEBCAM_SIZE = 768; // target resolution for webcam frames (768×768)
const WEBCAM_QUALITY = 0.7; // JPEG quality (0–1)

interface UseWebcamOptions {
  onFrame: (base64Image: string) => void;
}

interface UseWebcamReturn {
  isActive: boolean;
  start: () => Promise<void>;
  stop: () => void;
  error: string | null;
}

export function useWebcam({ onFrame }: UseWebcamOptions): UseWebcamReturn {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement("canvas");
    const aspect = video.videoWidth / video.videoHeight;
    let w = WEBCAM_SIZE;
    let h = WEBCAM_SIZE;
    if (aspect > 1) h = Math.round(WEBCAM_SIZE / aspect);
    else w = Math.round(WEBCAM_SIZE * aspect);
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    const dataUrl = canvas.toDataURL("image/jpeg", WEBCAM_QUALITY);
    const b64 = dataUrl.split(",")[1];
    if (b64) {
      onFrame(b64);
    }
  }, [onFrame]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: WEBCAM_SIZE },
          height: { ideal: WEBCAM_SIZE },
          facingMode: "user",
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
      }, 1000 / WEBCAM_FPS);

      setIsActive(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Camera permission denied";
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
    setIsActive(false);
  }, []);

  return {
    isActive,
    start,
    stop,
    error,
  };
}
