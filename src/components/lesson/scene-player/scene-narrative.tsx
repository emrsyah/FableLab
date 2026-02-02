"use client";

import { cn } from "@/lib/utils";
import { Mic, Music, Volume2, VolumeX } from "lucide-react";

interface SceneNarrativeProps {
  text: string;
  isNarratorActive: boolean;
  isMusicActive: boolean;
  onToggleNarrator: () => void;
  onToggleMusic: () => void;
}

export function SceneNarrative({
  text,
  isNarratorActive,
  isMusicActive,
  onToggleNarrator,
  onToggleMusic,
}: SceneNarrativeProps) {
  return (
    <div className="bg-white/70 rounded-3xl p-1 shadow-sm mt-6 relative z-10">
      <div className="bg-white rounded-2xl p-8 border border-white/50">
        <div className="prose prose-lg prose-slate max-w-none mb-8">
          <p className="text-slate-600 leading-relaxed">{text}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-6">
          {/* Narrator Toggle */}
          <button
            onClick={onToggleNarrator}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border",
              isNarratorActive
                ? "bg-[#3B82F6] text-white border-[#3B82F6] shadow-md shadow-blue-500/20"
                : "bg-[#F1F5F9] text-[#64748B] border-transparent hover:bg-slate-200"
            )}
          >
            {isNarratorActive ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span>{isNarratorActive ? "Narrator On" : "Narrator Off"}</span>
          </button>

          {/* Music Toggle */}
          <button
            onClick={onToggleMusic}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border",
              isMusicActive
                ? "bg-[#3B82F6] text-white border-[#3B82F6] shadow-md shadow-blue-500/20"
                : "bg-[#F1F5F9] text-[#64748B] border-transparent hover:bg-slate-200"
            )}
          >
            <Music size={18} />
            <span>{isMusicActive ? "Music On" : "Music Off"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
