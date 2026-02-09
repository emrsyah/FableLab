"use client";

import {
  Atom,
  Bot,
  Calculator,
  Loader2,
  Palette,
  Waves,
  Wifi,
  Wind,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StarterOption {
  icon: ReactNode;
  label: string;
  prompt: string;
}

const STARTER_OPTIONS: StarterOption[] = [
  {
    icon: <Atom className="size-4 text-blue-500" />,
    label: "Physics Demo",
    prompt: "Create a simple physics experiment with bouncing balls.",
  },
  {
    icon: <Palette className="size-4 text-purple-500" />,
    label: "Generative Art",
    prompt: "Make a colorful noise-based landscape in p5.js.",
  },
  {
    icon: <Calculator className="size-4 text-green-500" />,
    label: "Math Pendulum",
    prompt: "Build a pendulum demo and explain the math.",
  },
  {
    icon: <Wind className="size-4 text-orange-500" />,
    label: "Swarm Sim",
    prompt: "Design a swarm simulation with adjustable parameters.",
  },
  {
    icon: <Waves className="size-4 text-cyan-500" />,
    label: "Wave Interference",
    prompt: "Show an experiment about waves and interference.",
  },
];

interface WelcomeScreenProps {
  status: "disconnected" | "connecting" | "connected" | "error";
  onConnect: () => void;
  onSendMessage: (text: string) => void;
}

export function WelcomeScreen({
  status,
  onConnect,
  onSendMessage,
}: WelcomeScreenProps) {
  const isConnecting = status === "connecting";
  const isDisconnected = status === "disconnected";
  const isError = status === "error";
  const showConnectButton = status !== "connected";

  return (
    <div className="flex h-full flex-col justify-center p-4">
      <div className="rounded-xl">
        <div className="mb-6 flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-blue-100 p-3">
            <Bot className="size-6 text-blue-600" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900">
              Welcome to Playground
            </h3>
            <p className="mx-auto max-w-[280px] text-xs text-slate-600">
              I can help you build interactive experiments, simulations, and
              visualizations.
            </p>
          </div>

          {showConnectButton && (
            <div className="w-full max-w-[280px]">
              {isConnecting ? (
                <button
                  type="button"
                  disabled
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#3B82F6] text-white font-semibold transition-all rounded-full opacity-70 cursor-not-allowed"
                >
                  <Loader2 className="size-4 animate-spin" />
                  Connecting...
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onConnect}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold transition-all rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
                    isError
                      ? "bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/30"
                      : "bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 shadow-blue-500/30",
                  )}
                >
                  <div
                    className={cn(
                      "p-1.5 rounded-full bg-white/20",
                      !isError && "animate-pulse",
                    )}
                  >
                    <Wifi className="size-4" />
                  </div>
                  {isError ? "Reconnect" : "Enter Playground Mode"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2">
          {STARTER_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              disabled={status !== "connected"}
              onClick={() => onSendMessage(opt.prompt)}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-white/50 backdrop-blur-sm p-3 text-left text-sm transition-all",
                status === "connected"
                  ? "hover:bg-white hover:shadow-md cursor-pointer shadow-sm border-slate-200"
                  : "opacity-50 cursor-not-allowed bg-slate-50",
              )}
            >
              <div className="shrink-0 rounded-lg bg-slate-100 p-2">
                {opt.icon}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-slate-900">{opt.label}</span>
                <span className="line-clamp-1 text-xs text-slate-500">
                  {opt.prompt}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
