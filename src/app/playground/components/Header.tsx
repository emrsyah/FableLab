"use client";

import {
  ArrowLeft,
  Eye,
  FlaskConical,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface HeaderProps {
  experimentCount: number;
  isScreenSharing: boolean;
  status:
    | "disconnected"
    | "connecting"
    | "connected"
    | "error"
    | "reconnecting";
  reconnectAttempt?: number;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function Header({
  experimentCount,
  isScreenSharing,
  status,
  reconnectAttempt = 0,
  onConnect,
  onDisconnect,
}: HeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between px-8 py-4 shrink-0 bg-transparent border-b">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-700 font-medium transition-colors bg-white/50 hover:bg-white border border-slate-200 rounded-full"
        >
          <ArrowLeft className="size-4" />
          Back Home
        </button>
        <FlaskConical className="size-5 text-[#3B82F6]" />
        <span className="font-semibold text-sm text-slate-900">
          Playground Mode
        </span>
        {experimentCount > 0 && (
          <span className="ml-2 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {experimentCount} experiment
            {experimentCount !== 1 && "s"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isScreenSharing && (
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#F1F5F9] text-[#64748B] border border-blue-200 rounded-full transition-colors"
          >
            <Eye className="size-3.5" />
            AI watching
          </button>
        )}

        <button
          type="button"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
            status === "connected"
              ? "bg-[#3B82F6] text-white border-[#3B82F6] shadow-md shadow-blue-500/20"
              : status === "connecting" || status === "reconnecting"
                ? "bg-[#F1F5F9] text-[#64748B] border-transparent"
                : "bg-[#F1F5F9] text-[#64748B] border-transparent hover:bg-slate-200",
          )}
        >
          {status === "connected" ? (
            <Wifi className="size-3.5" />
          ) : status === "connecting" || status === "reconnecting" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <WifiOff className="size-3.5" />
          )}
          {status === "connected"
            ? "Connected"
            : status === "reconnecting"
              ? `Reconnecting (${reconnectAttempt}/5)...`
              : status === "connecting"
                ? "Connecting..."
                : status === "error"
                  ? "Error"
                  : "Disconnected"}
        </button>

        {(status === "disconnected" || status === "error") && (
          <button
            type="button"
            onClick={onConnect}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] text-white font-medium transition-all rounded-full hover:bg-blue-600 shadow-md shadow-blue-500/20"
          >
            Connect
          </button>
        )}
        {status === "connected" && (
          <button
            type="button"
            onClick={onDisconnect}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-700 font-medium transition-colors bg-white/50 hover:bg-white border border-slate-200 rounded-full"
          >
            Disconnect
          </button>
        )}
        {status === "reconnecting" && (
          <button
            type="button"
            onClick={onDisconnect}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-700 font-medium transition-colors bg-white/50 hover:bg-white border border-slate-200 rounded-full"
          >
            Cancel
          </button>
        )}
      </div>
    </header>
  );
}
