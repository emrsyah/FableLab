"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Quiz } from "../../types/scene.types";

interface SceneQuizProps {
  quiz: Quiz;
  onComplete: (correct: boolean) => void;
  onContinue: () => void;
}

export function SceneQuiz({ quiz, onComplete, onContinue }: SceneQuizProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    const correct = selectedAnswer === quiz.correctIndex;
    setIsCorrect(correct);
    setShowResult(true);
    onComplete(correct);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
          <span className="text-xl">📝</span>
        </div>
        <h3 className="text-xl font-bold text-slate-100">Knowledge Check</h3>
      </div>

      <p className="text-lg text-slate-200 mb-8 font-medium">{quiz.question}</p>

      <div className="space-y-3 mb-8">
        {quiz.options.map((option, index) => (
          <button
            key={option}
            type="button"
            onClick={() => handleAnswerSelect(index)}
            disabled={showResult}
            className={cn(
              "w-full p-4 rounded-xl text-left transition-all border-2 text-base font-medium",
              selectedAnswer === index
                ? showResult
                  ? isCorrect
                    ? "bg-green-500/10 border-green-500 text-green-400"
                    : "bg-red-500/10 border-red-500 text-red-400"
                  : "bg-indigo-500/10 border-indigo-500 text-indigo-100"
                : showResult && index === quiz.correctIndex
                  ? "bg-green-500/10 border-green-500 text-green-400"
                  : "bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800/60",
              showResult && "cursor-default",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="size-7 rounded-full bg-slate-700 flex items-center justify-center mr-3 text-xs text-slate-300">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </div>
              {showResult && index === quiz.correctIndex && (
                <Check className="size-5 text-green-500" />
              )}
              {showResult && selectedAnswer === index && !isCorrect && (
                <X className="size-5 text-red-500" />
              )}
            </div>
          </button>
        ))}
      </div>

      {showResult ? (
        <div className="mt-auto animate-in zoom-in-95 duration-300">
          <div
            className={cn(
              "p-5 rounded-xl mb-6 border-l-4",
              isCorrect
                ? "bg-green-500/5 border-green-500 text-green-100"
                : "bg-amber-500/5 border-amber-500 text-amber-100",
            )}
          >
            <p className="font-bold flex items-center gap-2 mb-2 uppercase tracking-wider text-xs">
              {isCorrect ? (
                <>
                  <Check className="size-4" /> That's correct!
                </>
              ) : (
                <>
                  <X className="size-4" /> Not quite, keep going!
                </>
              )}
            </p>
            <p className="text-sm text-slate-300 leading-relaxed italic">
              {quiz.explanation}
            </p>
          </div>
          {isCorrect ? (
            <Button
              onClick={onContinue}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-12 text-lg font-bold rounded-xl"
              size="lg"
            >
              Continue Adventure
            </Button>
          ) : (
            <Button
              onClick={() => {
                setSelectedAnswer(null);
                setShowResult(false);
              }}
              variant="outline"
              className="w-full border-slate-700 hover:bg-slate-800 text-slate-300 h-12 text-lg font-bold rounded-xl"
              size="lg"
            >
              Try Again
            </Button>
          )}
        </div>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={selectedAnswer === null}
          className="mt-auto w-full bg-indigo-600 hover:bg-indigo-500 text-white h-12 text-lg font-bold rounded-xl shadow-lg shadow-indigo-900/20"
          size="lg"
        >
          Check Answer
        </Button>
      )}
    </div>
  );
}
