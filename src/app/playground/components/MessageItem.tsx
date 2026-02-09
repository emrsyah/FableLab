"use client";

import {
  AlertTriangle,
  Bot,
  Brain,
  ChevronRight,
  RefreshCw,
  User,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Msg } from "../hooks";

interface MessageItemProps {
  message: Msg;
  status:
    | "disconnected"
    | "connecting"
    | "connected"
    | "error"
    | "reconnecting";
  onReconnect: () => void;
}

export function MessageItem({
  message,
  status,
  onReconnect,
}: MessageItemProps) {
  const { role, isThought, partial, text, errorCode, errorSeverity } = message;

  const showReconnectButton =
    role === "error" &&
    (errorSeverity === "terminal" || errorSeverity === "transient") &&
    (status === "disconnected" || status === "error");

  return (
    <div
      className={cn(
        "flex gap-2 text-sm",
        role === "user" && "justify-end",
        (role === "system" || role === "error") && "justify-center",
      )}
    >
      {/* Avatar for non-user messages */}
      {role === "agent" && !isThought && (
        <div className="mt-0.5 shrink-0 rounded-full bg-blue-100 p-1">
          <Bot className="size-3.5 text-blue-600" />
        </div>
      )}
      {role === "agent" && isThought && (
        <div className="mt-0.5 shrink-0 rounded-full bg-violet-100 p-1">
          <Brain className="size-3.5 text-violet-600" />
        </div>
      )}
      {role === "tool" && (
        <div className="mt-0.5 shrink-0 rounded-full bg-amber-100 p-1">
          <Wrench className="size-3.5 text-amber-600" />
        </div>
      )}
      {role === "error" && (
        <div className="mt-0.5 shrink-0 rounded-full bg-red-100 p-1">
          <AlertTriangle className="size-3.5 text-red-600" />
        </div>
      )}

      {/* Message content */}
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2",
          role === "user" && "bg-[#3B82F6] text-white",
          role === "agent" && !isThought && "bg-slate-100 text-slate-800",
          role === "agent" &&
            isThought &&
            "border border-violet-200 bg-violet-50/80",
          role === "tool" &&
            "border border-amber-200 bg-amber-50 text-amber-900",
          role === "system" && "bg-slate-50 text-xs text-slate-500",
          role === "error" && "border border-red-200 bg-red-50 text-red-700",
          partial && "opacity-70",
        )}
      >
        {isThought ? (
          <details open={partial} className="group">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-violet-700 select-none [&::-webkit-details-marker]:hidden">
              <ChevronRight className="size-3 transition-transform group-open:rotate-90" />
              <span className="font-medium">
                {partial ? "Thinking…" : "Thought"}
              </span>
            </summary>
            <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-slate-600 wrap-break-word">
              {text}
            </p>
          </details>
        ) : (
          <p className="whitespace-pre-wrap wrap-break-word">{text}</p>
        )}

        {role === "error" && errorCode && (
          <p className="mt-0.5 text-xs opacity-70">Code: {errorCode}</p>
        )}

        {showReconnectButton && (
          <button
            type="button"
            className="mt-2 gap-1 flex items-center border-red-300 text-red-700 hover:bg-red-100 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            onClick={onReconnect}
          >
            <RefreshCw className="size-3" />
            Reconnect
          </button>
        )}
      </div>

      {/* Avatar for user messages */}
      {role === "user" && (
        <div className="mt-0.5 shrink-0 rounded-full bg-slate-200 p-1">
          <User className="size-3.5 text-slate-600" />
        </div>
      )}
    </div>
  );
}
