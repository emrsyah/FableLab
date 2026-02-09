"use client";

import { Bot } from "lucide-react";
import { useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Msg } from "../hooks";
import { MessageItem } from "./MessageItem";

interface MessageListProps {
  messages: Msg[];
  isAgentSpeaking: boolean;
  status:
    | "disconnected"
    | "connecting"
    | "connected"
    | "error"
    | "reconnecting";
  onReconnect: () => void;
}

function AgentSpeakingIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <Bot className="size-3.5 text-blue-500" />
      <span className="flex gap-0.5">
        <span className="animate-bounce [animation-delay:0ms]">•</span>
        <span className="animate-bounce [animation-delay:150ms]">•</span>
        <span className="animate-bounce [animation-delay:300ms]">•</span>
      </span>
    </div>
  );
}

export function MessageList({
  messages,
  isAgentSpeaking,
  status,
  onReconnect,
}: MessageListProps) {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const showSpeakingIndicator =
    isAgentSpeaking &&
    !messages.some((m: Msg) => m.partial && m.role === "agent");

  return (
    <ScrollArea className="flex-1 p-3 overflow-y-auto">
      <div className="flex flex-col gap-2">
        {messages.map((message: Msg) => (
          <MessageItem
            key={message.id}
            message={message}
            status={status}
            onReconnect={onReconnect}
          />
        ))}

        {showSpeakingIndicator && <AgentSpeakingIndicator />}

        <div ref={scrollEndRef} />
      </div>
    </ScrollArea>
  );
}
