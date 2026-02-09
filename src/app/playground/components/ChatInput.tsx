"use client";

import { Paperclip, Send } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  isConnected: boolean;
  hasAttachments: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onAttachImage: () => void;
}

export function ChatInput({
  input,
  isConnected,
  hasAttachments,
  onInputChange,
  onSend,
  onAttachImage,
}: ChatInputProps) {
  return (
    <form
      className="flex gap-2 items-center"
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
    >
      <button
        type="button"
        onClick={onAttachImage}
        disabled={!isConnected}
        title="Attach image"
        className="shrink-0 size-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all disabled:opacity-50"
      >
        <Paperclip className="size-4" />
      </button>

      <input
        type="text"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder={
          isConnected ? "Type a message…" : "Connect to start chatting"
        }
        disabled={!isConnected}
        className="flex-1 rounded-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:opacity-50 transition-all"
      />
      <button
        type="submit"
        disabled={!isConnected || (!input.trim() && !hasAttachments)}
        className={cn(
          "shrink-0 size-10 rounded-full flex items-center justify-center transition-all",
          isConnected && (input.trim() || hasAttachments)
            ? "bg-[#3B82F6] text-white hover:bg-blue-600 shadow-md shadow-blue-500/20"
            : "bg-slate-100 text-slate-400 disabled:cursor-not-allowed",
        )}
      >
        <Send className="size-4" />
      </button>
    </form>
  );
}
