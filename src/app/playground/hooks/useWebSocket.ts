"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Status = "disconnected" | "connecting" | "connected" | "error";

interface UseWebSocketOptions {
  baseUrl: string;
  onBinaryMessage?: (data: ArrayBuffer) => void;
  onTextMessage?: (data: string) => void;
}

interface UseWebSocketReturn {
  status: Status;
  connect: () => void;
  disconnect: () => void;
  send: (data: string | ArrayBuffer) => void;
  wsRef: React.RefObject<WebSocket | null>;
}

export function useWebSocket({
  baseUrl,
  onBinaryMessage,
  onTextMessage,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [status, setStatus] = useState<Status>("disconnected");
  const ws = useRef<WebSocket | null>(null);
  const userId = useRef(`u_${Math.random().toString(36).slice(2, 8)}`);
  const sessionId = useRef(`s_${Date.now().toString(36)}`);

  // WS handler ref to avoid closure issues
  const wsHandler = useRef<(e: MessageEvent) => void>(undefined);
  wsHandler.current = (e: MessageEvent) => {
    if (e.data instanceof ArrayBuffer) {
      onBinaryMessage?.(e.data);
    } else if (typeof e.data === "string") {
      onTextMessage?.(e.data);
    }
  };

  const connect = useCallback(() => {
    // Force-close any leftover WS
    if (ws.current) {
      try {
        ws.current.close();
      } catch {
        /* ignore */
      }
      ws.current = null;
    }
    setStatus("connecting");

    // Always generate a fresh session ID on connect
    sessionId.current = `s_${Date.now().toString(36)}`;

    const url = `${baseUrl}/ws/${userId.current}/${sessionId.current}`;
    const socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";

    socket.onopen = () => {
      setStatus("connected");
    };
    socket.onmessage = (e) => wsHandler.current?.(e);
    socket.onerror = () => {
      setStatus("error");
    };
    socket.onclose = (e) => {
      ws.current = null;
      if (e.code === 1000 || e.code === 1001) {
        setStatus("disconnected");
      } else {
        setStatus("error");
      }
    };
    ws.current = socket;
  }, [baseUrl]);

  const disconnect = useCallback(() => {
    if (!ws.current) return;
    try {
      ws.current.send(JSON.stringify({ type: "close" }));
    } catch {
      /* ignore */
    }
    ws.current.close();
    ws.current = null;
    setStatus("disconnected");
  }, []);

  const send = useCallback((data: string | ArrayBuffer) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(data);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ws.current?.close();
    };
  }, []);

  return {
    status,
    connect,
    disconnect,
    send,
    wsRef: ws,
  };
}
