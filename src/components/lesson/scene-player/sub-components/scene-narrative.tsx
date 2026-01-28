import { cn } from "@/lib/utils";

interface SceneNarrativeProps {
  storyText: string;
  alignment?: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  } | null;
  currentTime: number;
}

export function SceneNarrative({
  storyText,
  alignment,
  currentTime,
}: SceneNarrativeProps) {
  // If no alignment, just show the text
  if (
    !alignment ||
    !alignment.characters ||
    alignment.characters.length === 0
  ) {
    return (
      <div className="prose prose-invert max-w-none">
        <p className="text-lg leading-relaxed whitespace-pre-line text-slate-100">
          {storyText}
        </p>
      </div>
    );
  }

  return (
    <div className="prose prose-invert max-w-none">
      <div className="text-lg leading-relaxed">
        {alignment.characters.map((char, index) => {
          const startTime = alignment.character_start_times_seconds[index];
          const endTime = alignment.character_end_times_seconds[index];

          // Add a small buffer to make the highlight feel more responsive
          const isCharActive =
            currentTime >= (startTime ?? 0) && currentTime <= (endTime ?? 0);
          const isPast = currentTime > (endTime ?? 0);

          return (
            <span
              key={`${index}-${char}`}
              className={cn(
                "transition-all duration-150 inline",
                isCharActive
                  ? "text-indigo-400 font-bold drop-shadow-[0_0_8px_rgba(129,140,248,0.5)] scale-110"
                  : isPast
                    ? "text-white"
                    : "text-slate-500",
              )}
            >
              {char}
            </span>
          );
        })}
      </div>
    </div>
  );
}
