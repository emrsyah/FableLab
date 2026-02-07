"use client";

import { useMemo } from "react";

interface NarrationAlignment {
  characters: string[]; // Array of words
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

interface KaraokeTextProps {
  text: string;
  alignment: NarrationAlignment | null;
  currentTime: number;
  isPlaying: boolean;
}

/**
 * KaraokeText - Displays narration text with word-level highlighting
 * synchronized to audio playback times.
 */
export function KaraokeText({
  text,
  alignment,
  currentTime,
  isPlaying,
}: KaraokeTextProps) {
  // If no alignment data, render plain text
  if (!alignment || alignment.characters.length === 0) {
    return <p className="text-slate-600 leading-relaxed">{text}</p>;
  }

  // Find current word index based on playback time
  // Returns the index of currently speaking word, or -1 if in a gap
  // Also returns lastReadIndex to track words that have been read
  const { currentWordIndex, lastReadIndex } = useMemo(() => {
    if (!isPlaying && currentTime === 0) {
      return { currentWordIndex: -1, lastReadIndex: -1 };
    }

    // Find the current word being spoken
    for (let i = 0; i < alignment.character_start_times_seconds.length; i++) {
      const start = alignment.character_start_times_seconds[i];
      const end = alignment.character_end_times_seconds[i];

      if (currentTime >= start && currentTime < end) {
        return { currentWordIndex: i, lastReadIndex: i - 1 };
      }
    }

    // If past the last word, all words are read
    const lastEnd =
      alignment.character_end_times_seconds[
        alignment.character_end_times_seconds.length - 1
      ];
    if (currentTime >= lastEnd) {
      return {
        currentWordIndex: -1,
        lastReadIndex: alignment.characters.length - 1,
      };
    }

    // We're in a gap between words - find the last word that ended before currentTime
    let lastRead = -1;
    for (let i = 0; i < alignment.character_end_times_seconds.length; i++) {
      if (alignment.character_end_times_seconds[i] <= currentTime) {
        lastRead = i;
      }
    }

    return { currentWordIndex: -1, lastReadIndex: lastRead };
  }, [currentTime, isPlaying, alignment]);

  return (
    <p className="text-slate-600 leading-relaxed">
      {alignment.characters.map((word, index) => {
        const isRead = index <= lastReadIndex;
        const isCurrent = index === currentWordIndex;

        return (
          <span
            key={index}
            className={`inline transition-colors duration-150 ${
              isCurrent
                ? "text-blue-600 bg-blue-100/60 rounded px-0.5 -mx-0.5"
                : isRead
                  ? "text-black"
                  : "text-slate-400"
            }`}
          >
            {word}
            {index < alignment.characters.length - 1 && " "}
          </span>
        );
      })}
    </p>
  );
}
