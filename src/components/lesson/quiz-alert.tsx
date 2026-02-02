"use client";

import { Sparkles, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizAlertProps {
  onContinue: () => void;
}

export function QuizAlert({ onContinue }: QuizAlertProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[20px] shadow-[0px_10px_30px_rgba(0,0,0,0.1)] p-6 max-w-sm w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center gap-2 self-start mb-6">
          <Sparkles className="text-blue-500 fill-blue-500/20" size={20} />
          <h3 className="text-lg font-semibold text-slate-900">Quiz Alert!</h3>
        </div>

        {/* Illustration */}
        <div className="bg-[#EDF3FD] p-6 rounded-full mb-4">
           <BookOpen className="text-[#3B82F6] size-8" strokeWidth={2.5} />
        </div>

        {/* Message */}
        <p className="text-center text-slate-500 mb-8 px-4 leading-relaxed">
          Before continue to the next scene,
          <br />
          Let's test your knowledge first!
        </p>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full bg-[radial-gradient(ellipse_at_center,#6FA0F6_0%,_#3C7AE8_100%)] hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] text-white font-semibold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
