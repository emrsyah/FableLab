"use client";

import {
  BookOpen,
  Bot,
  Calculator,
  CheckCircle,
  Library,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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

const AGENT_INFO: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  Orchestrator: {
    icon: <Bot className="w-5 h-5" />,
    label: "Orchestrator",
    color: "text-blue-600 bg-blue-100",
  },
  Librarian: {
    icon: <Library className="w-5 h-5" />,
    label: "Librarian",
    color: "text-amber-600 bg-amber-100",
  },
  Plotter: {
    icon: <BookOpen className="w-5 h-5" />,
    label: "Story Writer",
    color: "text-purple-600 bg-purple-100",
  },
  GraphMasterResearcher: {
    icon: <Calculator className="w-5 h-5" />,
    label: "Math Expert",
    color: "text-green-600 bg-green-100",
  },
  GraphMasterFormatter: {
    icon: <Calculator className="w-5 h-5" />,
    label: "GeoGebra Builder",
    color: "text-green-600 bg-green-100",
  },
  GraphMasterValidator: {
    icon: <Calculator className="w-5 h-5" />,
    label: "Validator",
    color: "text-green-600 bg-green-100",
  },
  GraphMasterPipeline: {
    icon: <Calculator className="w-5 h-5" />,
    label: "Experiment Creator",
    color: "text-green-600 bg-green-100",
  },
  ParallelContentCreators: {
    icon: <Sparkles className="w-5 h-5" />,
    label: "Content Creators",
    color: "text-orange-600 bg-orange-100",
  },
  Finisher: {
    icon: <CheckCircle className="w-5 h-5" />,
    label: "Finalizer",
    color: "text-emerald-600 bg-emerald-100",
  },
  System: {
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
    label: "System",
    color: "text-slate-600 bg-slate-100",
  },
};

export function GenerationOverlay({
  lessonId,
  targetAge,
  sceneCount,
  onComplete,
  onError,
}: GenerationOverlayProps) {
  const [status, setStatus] = useState("Connecting...");
  const [currentAgent, setCurrentAgent] = useState<string>("System");
  const [scenesReady, setScenesReady] = useState<number[]>([]);
  const [logs, setLogs] = useState<Array<{ agent: string; message: string }>>(
    [],
  );

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

  const agentInfo = AGENT_INFO[currentAgent] || AGENT_INFO.System;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex flex-col items-center max-w-lg mx-auto px-6 text-center">
        {/* Main Animation */}
        <div className="relative mb-8">
          {/* Outer ring */}
          <div className="absolute inset-0 w-32 h-32 rounded-full border-4 border-blue-200 animate-ping opacity-20" />

          {/* Inner circle with agent icon */}
          <div
            className={cn(
              "relative w-32 h-32 rounded-full flex items-center justify-center transition-colors duration-300",
              agentInfo.color,
            )}
          >
            <div className="scale-[2]">{agentInfo.icon}</div>
          </div>
        </div>

        {/* Current Agent */}
        <div className="mb-4">
          <span
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
              agentInfo.color,
            )}
          >
            {agentInfo.icon}
            {agentInfo.label}
          </span>
        </div>

        {/* Status Text */}
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Creating Your Lesson
        </h2>
        <p className="text-slate-600 mb-6">{status}</p>

        {/* Scenes Progress */}
        {scenesReady.length > 0 && (
          <div className="flex gap-2 mb-6">
            {scenesReady.map((num) => (
              <div
                key={num}
                className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium animate-bounce-in"
              >
                {num}
              </div>
            ))}
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}

        {/* Activity Log */}
        <div className="w-full max-h-32 overflow-y-auto text-left bg-white/50 rounded-lg p-3 border border-slate-100">
          {logs.slice(-5).map((log, i) => (
            <div
              key={i}
              className="text-xs text-slate-500 py-1 border-b border-slate-100 last:border-0"
            >
              <span className="font-medium text-slate-700">{log.agent}:</span>{" "}
              {log.message}
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-xs text-slate-400 text-center py-2">
              Initializing AI agents...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
