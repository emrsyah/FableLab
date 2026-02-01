"use client";

import { useCallback } from "react";

const getStorageKey = (lessonId: string) => `lesson-progress:${lessonId}`;

export function useSceneProgress(lessonId: string) {
  const saveProgress = useCallback(
    (currentSceneIndex: number) => {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            getStorageKey(lessonId),
            JSON.stringify({ currentSceneIndex, timestamp: Date.now() })
          );
        } catch (error) {
          console.error("Failed to save progress to localStorage:", error);
        }
      }
    },
    [lessonId]
  );

  const getProgress = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(getStorageKey(lessonId));
        if (saved) {
          const { currentSceneIndex } = JSON.parse(saved);
          return typeof currentSceneIndex === "number" ? currentSceneIndex : 0;
        }
      } catch (error) {
        console.error("Failed to get progress from localStorage:", error);
      }
    }
    return 0;
  }, [lessonId]);

  const clearProgress = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(getStorageKey(lessonId));
      } catch (error) {
        console.error("Failed to clear progress from localStorage:", error);
      }
    }
  }, [lessonId]);

  return { saveProgress, getProgress, clearProgress };
}
