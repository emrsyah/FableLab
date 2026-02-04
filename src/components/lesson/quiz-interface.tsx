"use client";

import { useState } from "react";
import { Check, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Quiz } from "./types/scene.types";
import { HangingBanner } from "@/components/ui/hanging-banner";

interface QuizInterfaceProps {
  quiz: Quiz;
  sceneTitle: string;
  lessonTopic: string;
  onComplete: (isCorrect: boolean) => void;
  onBack: () => void;
}

const CARD_COLORS = [
  { bg: "bg-[#FFC530]", border: "border-[#FFF1CC]", shadow: "shadow-[0px_0px_10px_#ffebb3]" },
  { bg: "bg-[#00CDB4]", border: "border-[#CCF5F0]", shadow: "shadow-[0px_0px_10px_#ccf5f0]" },
  { bg: "bg-[#FF8FAB]", border: "border-[#FFE8EF]", shadow: "shadow-[0px_0px_10px_#ffe8ef]" },
  { bg: "bg-[#A56EFF]", border: "border-[#ECE2FF]", shadow: "shadow-[0px_0px_10px_#ece2ff]" },
];

export function QuizInterface({ quiz, sceneTitle, lessonTopic, onComplete, onBack }: QuizInterfaceProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showBorder, setShowBorder] = useState(false);

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsSubmitted(true);
    const correct = selectedOption === quiz.correctIndex;
    if (correct) {
      setTimeout(() => onComplete(true), 2000); // Wait a bit before completing
    } else {
        // Allow retrying or showing explanation immediately?
        // For now, let's keep it simple: show result.
    }
  };

  const isCorrect = isSubmitted && selectedOption === quiz.correctIndex;
  const isWrong = isSubmitted && selectedOption !== quiz.correctIndex;

  return (
    <div className="w-full h-full min-h-[600px] flex flex-col relative">
      


      {/* Main Content Container - Centered */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-[1253px] mx-auto pt-[24px] h-full">
        
        {/* Header Section */}
        <HangingBanner 
            text="Let's Check Your Understanding!" 
            onAnimationComplete={() => setShowBorder(true)}
        />

        {/* Question Section - Blue Box Style */}
        <div 
            className={cn(
                "relative w-full max-w-[800px] bg-white rounded-[20px] shadow-[0px_4px_24px_rgba(0,0,0,0.04)] border-[14px] p-12 flex flex-col items-center justify-center text-center mb-12 z-40 transition-colors duration-700 ease-in",
                showBorder ? "border-[#dbeafe]" : "border-transparent"
            )}
        >
           {/* Decorative Elements could go here (e.g., characters from screenshot) */}
           
           <h3 className="text-[28px] font-bold text-[#1C1C1E] leading-[1.3] text-center max-w-[600px]">
             {quiz.question}
           </h3>
        </div>

        {/* Instruction Text */}
        <p className="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-[#929496] text-center mb-[20px]">
          Choose the best answer based on what you learned:
        </p>

        {/* Options - Horizontal/Grid Layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[20px] w-full max-w-[1240px] mb-12 px-4">
          {quiz.options.map((option: string, index: number) => {
             const isSelected = selectedOption === index;
             const showCorrect = isSubmitted && index === quiz.correctIndex;
             const showWrong = isSubmitted && isSelected && index !== quiz.correctIndex;
             
             // Define distinct colors for each option card based on index (visual variety like screenshot)
             const colorStyles = CARD_COLORS[index % CARD_COLORS.length];

             return (
               <button
                 key={index}
                 onClick={() => !isSubmitted && setSelectedOption(index)}
                 disabled={isSubmitted}
                 className={cn(
                   "relative flex flex-col items-center justify-center w-full min-h-[180px] h-full p-4 rounded-[20px] border-4 transition-all duration-300 transform",
                   // If not selected, show colorful state
                   !isSelected && !isSubmitted && `${colorStyles.bg} ${colorStyles.border} ${colorStyles.shadow} hover:scale-[1.02] text-white`,
                   
                   // Selected State (Highlight with ring/scale)
                   isSelected && !isSubmitted && `${colorStyles.bg} border-white ring-4 ring-offset-2 ring-blue-400 scale-[1.05] shadow-xl text-white`,

                   // Submitted States could dim or highlight
                   isSubmitted && !isSelected && "opacity-50 grayscale bg-gray-200 border-gray-300 text-gray-500",
                   isSubmitted && isSelected && `${colorStyles.bg} ${colorStyles.border} text-white ring-4 ring-offset-2`,
                   showCorrect && "ring-green-500",
                   showWrong && "ring-red-500"
                 )}
               >
                 <span className="text-[18px] font-bold text-center leading-tight drop-shadow-sm">
                   {option}
                 </span>
                 
                 {/* Status Icon Overlay */}
                 {showCorrect && (
                    <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                        <Check className="text-green-500" size={20} />
                    </div>
                 )}
               </button>
             );
          })}
        </div>
        
        {/* Footer / Submit Button */}
        <div className="w-full flex justify-center pb-12">
            <button
              onClick={handleSubmit}
              disabled={selectedOption === null || isSubmitted}
              className={cn(
                "flex items-center justify-center w-[260px] h-[56px] rounded-full font-bold text-white text-[18px] shadow-lg transition-all duration-300",
                selectedOption !== null && !isSubmitted
                  ? "bg-[radial-gradient(169.4%_84.49%_at_50%_50%,#6FA0F6_0%,#568DEF_48.96%,#3C7AE8_100%)] hover:shadow-blue-500/40 hover:scale-[1.02]" 
                  : "bg-[#E5E5EA] text-[#AEAEB2] cursor-not-allowed shadow-none"
              )}
            >
              Submit Answers
            </button>

            {isSubmitted && (
              <button
                onClick={onBack}
                className="ml-4 flex items-center justify-center w-[260px] h-[56px] rounded-full font-bold text-slate-600 bg-white border border-slate-200 text-[18px] shadow-sm hover:bg-slate-50 transition-all duration-300"
              >
                Back to Lesson
              </button>
            )}
        </div>

      </div>
    </div>
  );
}
