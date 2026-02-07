"use client";

import { KaraokeText } from "./karaoke-text";

interface NarrationAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

interface SceneNarrativeProps {
  text: string;
  alignment?: NarrationAlignment | null;
  currentTime?: number;
  isPlaying?: boolean;
}

export function SceneNarrative({
  text,
  alignment,
  currentTime = 0,
  isPlaying = false,
}: SceneNarrativeProps) {
  return (
    <div className="bg-white/70 rounded-3xl p-1 shadow-sm mt-6 relative z-10">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-white/50">
        <div className="prose prose-lg prose-slate max-w-none">
          {alignment ? (
            <KaraokeText
              text={text}
              alignment={alignment}
              currentTime={currentTime}
              isPlaying={isPlaying}
            />
          ) : (
            <p className="text-slate-600 leading-relaxed">{text}</p>
          )}
        </div>
      </div>
    </div>
  );
}
