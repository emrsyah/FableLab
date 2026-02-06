"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Persona } from "@/components/ai-elements/persona";

interface GenerationOverlayProps {
  lessonId: string;
  targetAge: string;
  sceneCount: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

interface ProgressEvent {
  event: string;
  data: {
    message?: string;
    author?: string;
    agent?: string;
    sceneNumber?: number;
    type?: string;
    lessonId?: string;
    totalScenes?: number;
  };
}

// Fun encouraging messages to show while generating
const ENCOURAGING_MESSAGES = [
  "Crafting your adventure...",
  "Gathering knowledge from the universe...",
  "Building scenes with care...",
  "Adding a sprinkle of magic...",
  "Almost there...",
];

// Agent display names
const AGENT_LABELS: Record<string, { label: string; emoji: string }> = {
  Orchestrator: { label: "Orchestrator", emoji: "🎭" },
  Librarian: { label: "Researcher", emoji: "📚" },
  Plotter: { label: "Story Writer", emoji: "✍️" },
  GraphMasterResearcher: { label: "Math Expert", emoji: "🧮" },
  GraphMasterFormatter: { label: "Experiment Builder", emoji: "🔬" },
  GraphMasterValidator: { label: "Validator", emoji: "✅" },
  GraphMasterPipeline: { label: "Creator", emoji: "⚡" },
  ParallelContentCreators: { label: "Content Team", emoji: "🎨" },
  Finisher: { label: "Finalizer", emoji: "🏁" },
  System: { label: "System", emoji: "⚙️" },
};

export function GenerationOverlay({
  lessonId,
  targetAge,
  sceneCount,
  onComplete,
  onError,
}: GenerationOverlayProps) {
  const [_status, setStatus] = useState("Connecting...");
  const [currentAgent, setCurrentAgent] = useState<string>("System");
  const [scenesReady, setScenesReady] = useState<number[]>([]);
  const [logs, setLogs] = useState<Array<{ agent: string; message: string }>>(
    [],
  );
  const [messageIndex, setMessageIndex] = useState(0);

  // Cycle through encouraging messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % ENCOURAGING_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/adk/stream/${lessonId}?targetAge=${targetAge}&sceneCount=${sceneCount}`,
    );

    eventSource.onmessage = (event) => {
      try {
        const parsed: ProgressEvent = JSON.parse(event.data);

        switch (parsed.event) {
          case "status":
            setStatus(parsed.data.message || "Processing...");
            if (parsed.data.agent) {
              setCurrentAgent(parsed.data.agent);
              setLogs((prev) => [
                ...prev.slice(-10),
                { agent: parsed.data.agent!, message: parsed.data.message! },
              ]);
            }
            break;

          case "agent":
            if (parsed.data.author) {
              setCurrentAgent(parsed.data.author);
            }
            break;

          case "scene_ready":
            if (parsed.data.sceneNumber) {
              setScenesReady((prev) => [...prev, parsed.data.sceneNumber!]);
            }
            break;

          case "completed":
            setStatus("Lesson ready!");
            eventSource.close();
            setTimeout(() => onComplete(), 500);
            break;

          case "error":
            eventSource.close();
            onError(parsed.data.message || "Generation failed");
            break;
        }
      } catch (e) {
        console.error("Parse error:", e);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      onError("Connection lost. Please refresh the page.");
    };

    return () => {
      eventSource.close();
    };
  }, [lessonId, targetAge, sceneCount, onComplete, onError]);

  const agentInfo = AGENT_LABELS[currentAgent] || AGENT_LABELS.System;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden items-center justify-center">
      <div className="flex flex-col items-center w-full max-w-md mx-auto px-6 text-center">
        {/* Persona Animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative mb-6"
        >
          {/* Ambient glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-blue-400/20 rounded-full blur-2xl animate-pulse" />
          </div>

          {/* Outer rotating ring */}
          <motion.div
            className="absolute -inset-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <title>Rotating ring</title>
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="url(#gradient1)"
                strokeWidth="0.5"
                strokeDasharray="8 4"
                opacity="0.4"
              />
              <defs>
                <linearGradient
                  id="gradient1"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          {/* Persona */}
          <Persona
            state="thinking"
            variant="mana"
            className="size-28 relative z-10"
          />
        </motion.div>

        {/* Main Title */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-slate-800 mb-2"
        >
          Creating Your Adventure
        </motion.h2>

        {/* Animated Subtitle */}
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-slate-500 mb-6 h-6"
          >
            {ENCOURAGING_MESSAGES[messageIndex]}
          </motion.p>
        </AnimatePresence>

        {/* Current Agent Badge */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm">
            <span className="text-base">{agentInfo.emoji}</span>
            <span className="text-slate-700">{agentInfo.label}</span>
            <span className="flex gap-0.5">
              <motion.span
                className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.span
                className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.span
                className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </span>
          </span>
        </motion.div>

        {/* Scenes Progress Pills */}
        <AnimatePresence>
          {scenesReady.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-wrap justify-center gap-2 mb-6"
            >
              {scenesReady.map((num) => (
                <motion.div
                  key={num}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-emerald-500/30"
                >
                  {num}
                </motion.div>
              ))}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-8 h-8 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 text-slate-400 flex items-center justify-center text-xs"
              >
                ?
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Activity Log */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-100 p-4 shadow-sm"
        >
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Live Activity
          </div>
          <div className="space-y-1">
            {logs
              .slice(-4)
              .reverse()
              .map((log, i, arr) => {
                // Calculate opacity: most recent (top, i=0) = 1, oldest (bottom) = 0.3
                const opacity =
                  arr.length > 1 ? 1 - (0.6 * i) / (arr.length - 1) : 1;
                const logAgentInfo =
                  AGENT_LABELS[log.agent] || AGENT_LABELS.System;
                return (
                  <motion.div
                    key={`${log.agent}-${log.message}-${i}`}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity }}
                    className="flex items-start gap-2 text-sm py-1.5 border-b border-slate-50 last:border-0"
                  >
                    <span className="text-xs shrink-0">
                      {logAgentInfo.emoji}
                    </span>
                    <span className="flex-1 text-slate-600 line-clamp-1 text-left text-xs">
                      {log.message}
                    </span>
                  </motion.div>
                );
              })}
            {logs.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-3">
                Warming up the learning engine...
              </div>
            )}
          </div>
        </motion.div>

        {/* Bottom hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-slate-400 mt-6"
        >
          This usually takes 30-60 seconds
        </motion.p>
      </div>
    </div>
  );
}
