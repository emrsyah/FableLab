"use client";

interface SceneNarrativeProps {
  text: string;
}

export function SceneNarrative({ text }: SceneNarrativeProps) {
  return (
    <div className="bg-white/70 rounded-3xl p-1 shadow-sm mt-6 relative z-10">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-white/50">
        <div className="prose prose-lg prose-slate max-w-none">
          <p className="text-slate-600 leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}
