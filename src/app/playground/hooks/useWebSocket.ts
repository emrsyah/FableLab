"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Status =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "reconnecting";

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
  reconnectAttempt: number;
}

// WebSocket close codes that should trigger reconnection
const RECONNECT_CODES = [1011, 1006, 1001];
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_BASE = 2000; // 2 seconds
const PING_INTERVAL = 30000; // 30 seconds

export function useWebSocket({
  baseUrl,
  onBinaryMessage,
  onTextMessage,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [status, setStatus] = useState<Status>("disconnected");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Persist userId and sessionId across reconnections
  const userId = useRef<string>("");
  const sessionId = useRef<string>("");

  // Initialize IDs on first mount (or retrieve from sessionStorage)
  useEffect(() => {
    // Try to restore from sessionStorage for session resumption
    const storedUserId = sessionStorage.getItem("adk_user_id");
    const storedSessionId = sessionStorage.getItem("adk_session_id");

    if (storedUserId) {
      userId.current = storedUserId;
    } else {
      userId.current = `u_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem("adk_user_id", userId.current);
    }

    if (storedSessionId) {
      sessionId.current = storedSessionId;
    } else {
      sessionId.current = `s_${Date.now().toString(36)}`;
      sessionStorage.setItem("adk_session_id", sessionId.current);
    }
  }, []);

  // WS handler ref to avoid closure issues
  const wsHandler = useRef<(e: MessageEvent) => void>(undefined);
  wsHandler.current = (e: MessageEvent) => {
    if (e.data instanceof ArrayBuffer) {
      onBinaryMessage?.(e.data);
    } else if (typeof e.data === "string") {
      onTextMessage?.(e.data);
    }
  };

  // Clear ping interval
  const clearPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // Setup ping interval to keep connection alive
  const setupPingInterval = useCallback(() => {
    clearPingInterval();
    pingIntervalRef.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        // Send a lightweight ping message
        try {
          ws.current.send(JSON.stringify({ type: "ping" }));
        } catch {
          // Ignore ping errors
        }
      }
    }, PING_INTERVAL);
  }, [clearPingInterval]);

  // Reconnection logic
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
      console.error("[WebSocket] Max reconnection attempts reached");
      setStatus("error");
      return;
    }

    const delay = RECONNECT_DELAY_BASE * 2 ** reconnectAttempt;
    console.log(
      `[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempt + 1}/${MAX_RECONNECT_ATTEMPTS})`,
    );

    setStatus("reconnecting");

    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempt((prev) => prev + 1);
      connectInternal();
    }, delay);
  }, [reconnectAttempt]);

  // Internal connect function
  const connectInternal = useCallback(() => {
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

    const url = `${baseUrl}/ws/${userId.current}/${sessionId.current}`;
    console.log(`[WebSocket] Connecting to ${url}`);

    const socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";

    socket.onopen = () => {
      console.log("[WebSocket] Connected successfully");
      setStatus("connected");
      setReconnectAttempt(0); // Reset reconnect counter
      setupPingInterval();
    };

    socket.onmessage = (e) => wsHandler.current?.(e);

    socket.onerror = (error) => {
      console.error("[WebSocket] Error:", error);
      setStatus("error");
    };

    socket.onclose = (e) => {
      console.log(
        `[WebSocket] Closed with code ${e.code}, reason: ${e.reason || "No reason provided"}`,
      );
      ws.current = null;
      clearPingInterval();

      // Normal closure (1000) or going away (1001) - don't reconnect
      if (e.code === 1000) {
        setStatus("disconnected");
        // Clear session storage on clean disconnect
        sessionStorage.removeItem("adk_session_id");
        return;
      }

      // Check if we should attempt reconnection
      if (RECONNECT_CODES.includes(e.code) || e.code === 1001) {
        console.log(
          `[WebSocket] Connection lost (code ${e.code}), attempting reconnect...`,
        );
        attemptReconnect();
      } else {
        setStatus("error");
      }
    };

    ws.current = socket;
  }, [baseUrl, setupPingInterval, clearPingInterval, attemptReconnect]);

  // Public connect function
  const connect = useCallback(() => {
    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Generate new session ID for fresh connection
    sessionId.current = `s_${Date.now().toString(36)}`;
    sessionStorage.setItem("adk_session_id", sessionId.current);
    setReconnectAttempt(0);

    connectInternal();
  }, [connectInternal]);

  // Public disconnect function
  const disconnect = useCallback(() => {
    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    clearPingInterval();

    if (!ws.current) return;
    try {
      ws.current.send(JSON.stringify({ type: "close" }));
    } catch {
      /* ignore */
    }
    ws.current.close();
    ws.current = null;
    setStatus("disconnected");

    // Clear session storage on manual disconnect
    sessionStorage.removeItem("adk_session_id");
  }, [clearPingInterval]);

  const send = useCallback((data: string | ArrayBuffer) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(data);
    } else {
      console.warn("[WebSocket] Cannot send: not connected");
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      clearPingInterval();
      ws.current?.close();
    };
  }, [clearPingInterval]);

  return {
    status,
    connect,
    disconnect,
    send,
    wsRef: ws,
    reconnectAttempt,
  };
}
