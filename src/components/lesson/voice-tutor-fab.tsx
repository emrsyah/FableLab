"use client";

import { Mic } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { VoiceTutorModal } from "./voice-tutor-modal";

interface VoiceTutorFABProps {
  lessonTopic: string;
  sceneTitle: string;
  sceneContent: string;
  sceneNumber: number;
}

export function VoiceTutorFAB({
  lessonTopic,
  sceneTitle,
  sceneContent,
  sceneNumber,
}: VoiceTutorFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 right-8 z-40",
          "w-14 h-14 rounded-full",
          "bg-gradient-to-br from-purple-500 to-purple-700",
          "text-white shadow-lg shadow-purple-500/30",
          "flex items-center justify-center",
          "hover:shadow-xl hover:shadow-purple-500/40",
          "transition-shadow duration-200",
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <Mic className="w-6 h-6" />
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-20" />
      </motion.button>

      {/* Voice Tutor Modal */}
      <VoiceTutorModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        lessonTopic={lessonTopic}
        sceneTitle={sceneTitle}
        sceneContent={sceneContent}
        sceneNumber={sceneNumber}
      />
    </>
  );
}
