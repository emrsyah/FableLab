"use client";

import { useCallback, useRef, useState } from "react";

type Role = "user" | "agent" | "system" | "tool" | "error";
type ErrorSeverity = "terminal" | "transient" | "unknown";

export interface Msg {
  id: string;
  role: Role;
  text: string;
  ts: number;
  partial?: boolean;
  toolName?: string;
  errorCode?: string;
  errorSeverity?: ErrorSeverity;
  isThought?: boolean;
}

// Error messages mapping
const ERROR_MESSAGES: Record<string, string> = {
  SAFETY: "I can't help with that request. Please try rephrasing.",
  PROHIBITED_CONTENT: "Your message was blocked by content policy.",
  BLOCKLIST: "Your message matched a restricted content filter.",
  MAX_TOKENS:
    "The response was too long and got cut off. Try a simpler request.",
  RESOURCE_EXHAUSTED: "Rate limit hit. Please wait a moment…",
  CANCELLED: "The request was cancelled.",
  MODEL_NOT_SUPPORTED:
    "The AI model does not support real-time streaming. Check server config.",
  MODEL_NOT_FOUND: "The AI model was not found. Check server configuration.",
  AUTH_ERROR: "API key error on the server. Contact an administrator.",
  PERMISSION_DENIED: "Permission denied. The API key may lack access.",
  CONNECTION_ERROR: "Lost connection to the AI service.",
  CONNECTION_CLOSED: "The AI connection was closed unexpectedly.",
  LIVE_API_TRANSIENT:
    "Connection interrupted. This sometimes happens with the preview model — just reconnect.",
  SESSION_TIMEOUT: "Session timed out. Please reconnect to continue.",
};

interface UseMessagesOptions {
  onFunctionCall?: (name: string, args: Record<string, unknown>) => void;
  onFunctionResponse?: (
    name: string,
    response: Record<string, unknown>,
  ) => void;
  onError?: (code: string, severity: ErrorSeverity) => void;
}

interface UseMessagesReturn {
  messages: Msg[];
  pushSystem: (text: string) => void;
  pushUser: (text: string) => void;
  pushError: (code: string, severity: ErrorSeverity) => void;
  handleEvent: (raw: string) => void;
  clearPartial: () => void;
}

export function useMessages({
  onFunctionCall,
  onFunctionResponse,
  onError,
}: UseMessagesOptions = {}): UseMessagesReturn {
  const [messages, setMessages] = useState<Msg[]>([]);
  const midRef = useRef(0);
  const partialRef = useRef("");
  const thoughtPartialRef = useRef("");

  const pushMsg = useCallback(
    (role: Role, text: string, extra?: Partial<Msg>) => {
      setMessages((prev) => {
        const msg: Msg = {
          id: `m${++midRef.current}`,
          role,
          text,
          ts: Date.now(),
          ...extra,
        };
        const last = prev[prev.length - 1];
        if (
          last?.partial &&
          last.role === role &&
          !!last.isThought === !!extra?.isThought
        ) {
          return [...prev.slice(0, -1), msg];
        }
        return [...prev, msg];
      });
    },
    [],
  );

  const pushSystem = useCallback(
    (text: string) => {
      pushMsg("system", text);
    },
    [pushMsg],
  );

  const pushUser = useCallback(
    (text: string) => {
      pushMsg("user", text);
    },
    [pushMsg],
  );

  const pushError = useCallback(
    (code: string, severity: ErrorSeverity) => {
      const friendlyMsg = ERROR_MESSAGES[code] || "An unknown error occurred.";
      pushMsg("error", friendlyMsg, {
        errorCode: code,
        errorSeverity: severity,
      });
      onError?.(code, severity);
    },
    [pushMsg, onError],
  );

  const handleEvent = useCallback(
    (raw: string) => {
      // biome-ignore lint/suspicious/noExplicitAny: dynamic ADK event
      let ev: any;
      try {
        ev = JSON.parse(raw);
      } catch {
        return;
      }

      // Server-side error envelope
      if (ev.type === "error") {
        const code: string = ev.code || "UNKNOWN";
        const severity: ErrorSeverity = ev.severity || "unknown";
        pushError(code, severity);
        return;
      }

      // biome-ignore lint/suspicious/noExplicitAny: dynamic parts
      const parts: any[] = ev.content?.parts || [];
      const isPartial = ev.partial === true;

      for (const part of parts) {
        // ---- Function call ----
        const fnCall = part.functionCall || part.function_call;
        if (fnCall) {
          const name: string = fnCall.name;
          const args = fnCall.args || {};
          pushMsg("tool", `Calling ${name}...`, { toolName: name });
          onFunctionCall?.(name, args);
          continue;
        }

        // ---- Function response ----
        const fnResp = part.functionResponse || part.function_response;
        if (fnResp) {
          const resp = fnResp.response || {};
          if (resp.message) {
            pushMsg("tool", `${resp.message}`, { toolName: fnResp.name });
          }
          onFunctionResponse?.(fnResp.name, resp);
          continue;
        }

        // ---- Text ----
        if (part.text) {
          const role = ev.content?.role;
          const isThought = part.thought === true;

          if (role === "user") {
            pushMsg("user", part.text);
          } else if (isThought) {
            if (isPartial) {
              thoughtPartialRef.current += part.text;
              pushMsg("agent", thoughtPartialRef.current, {
                partial: true,
                isThought: true,
              });
            } else {
              const full = thoughtPartialRef.current + part.text;
              thoughtPartialRef.current = "";
              if (full) pushMsg("agent", full, { isThought: true });
            }
          } else {
            if (isPartial) {
              partialRef.current += part.text;
              pushMsg("agent", partialRef.current, { partial: true });
            } else {
              const full = partialRef.current + part.text;
              partialRef.current = "";
              if (full) pushMsg("agent", full);
            }
          }
        }
      }

      // Turn signals
      if (ev.turn_complete || ev.turnComplete) {
        if (partialRef.current) {
          pushMsg("agent", partialRef.current);
          partialRef.current = "";
        }
        if (thoughtPartialRef.current) {
          pushMsg("agent", thoughtPartialRef.current, { isThought: true });
          thoughtPartialRef.current = "";
        }
      }
      if (ev.interrupted) {
        partialRef.current = "";
        thoughtPartialRef.current = "";
      }
    },
    [pushMsg, pushError, onFunctionCall, onFunctionResponse],
  );

  const clearPartial = useCallback(() => {
    partialRef.current = "";
    thoughtPartialRef.current = "";
  }, []);

  return {
    messages,
    pushSystem,
    pushUser,
    pushError,
    handleEvent,
    clearPartial,
  };
}
