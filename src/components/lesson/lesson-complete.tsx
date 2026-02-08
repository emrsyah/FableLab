"use client";

import { Home, RefreshCw, Share2, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Persona } from "@/components/ai-elements/persona";
import { Button } from "@/components/ui/button";

interface LessonCompleteProps {
  lessonTitle?: string;
  totalScenes: number;
  onRestart: () => void;
  onShare?: () => void;
}

export function LessonComplete({
  lessonTitle,
  totalScenes,
  onRestart,
  onShare,
}: LessonCompleteProps) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-6 py-12">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: [
                  "#FFD700",
                  "#FF6B6B",
                  "#4ECDC4",
                  "#A855F7",
                  "#3B82F6",
                ][Math.floor(Math.random() * 5)],
              }}
              initial={{ top: -20, opacity: 1, scale: 1 }}
              animate={{
                top: "100%",
                opacity: 0,
                scale: 0,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 0.5,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center max-w-lg text-center"
      >
        {/* Trophy Icon with Glow */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-yellow-400/30 rounded-full blur-2xl animate-pulse" />
          </div>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Trophy className="w-24 h-24 text-yellow-500 relative z-10" />
          </motion.div>
        </div>

        {/* Celebration Text */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-slate-900 mb-2"
        >
          Amazing Job!
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-slate-600 mb-2"
        >
          You completed the lesson!
        </motion.p>

        {lessonTitle && (
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-sm text-slate-500 mb-6"
          >
            &quot;{lessonTitle}&quot;
          </motion.p>
        )}

        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-6 mb-8 bg-slate-50 px-6 py-4 rounded-2xl"
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{totalScenes}</p>
            <p className="text-xs text-slate-500">Scenes</p>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">100%</p>
            <p className="text-xs text-slate-500">Complete</p>
          </div>
        </motion.div>

        {/* Persona */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="mb-8"
        >
          <Persona state="idle" variant="mana" className="size-16" />
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 w-full max-w-sm"
        >
          <Button
            onClick={() => router.push("/")}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Home className="w-4 h-4 mr-2" />
            New Lesson
          </Button>

          <Button onClick={onRestart} variant="outline" className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            Replay
          </Button>

          {onShare && (
            <Button onClick={onShare} variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
