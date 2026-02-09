import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import type { BIDIEvent } from "@/types/bidi-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ADK BIDI WebSocket Bridge API Route
 *
 * This route creates a bridge between:
 * - Frontend: EventSource (SSE) connection
 * - Backend: WebSocket connection to ADK service
 *
 * The user is responsible for running the ADK backend WebSocket server.
 * This route expects the backend to be available at ws://localhost:8000/playground/bidi
 */

interface BIDIConnection {
  controller: ReadableStreamController<Uint8Array>;
  backendWs: WebSocket | null;
  userId: string;
  sessionId: string;
  isConnected: boolean;
}

const connections = new Map<string, BIDIConnection>();

// Backend WebSocket URL - user should configure this
const BACKEND_WS_URL =
  process.env.ADK_BACKEND_WS_URL || "ws://localhost:8000/playground/bidi";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || `user_${nanoid(8)}`;
  const sessionId = searchParams.get("sessionId") || `session_${nanoid(8)}`;
  const connectionId = `${userId}:${sessionId}`;

  // Create SSE stream for frontend
  const stream = new ReadableStream({
    start(controller) {
      // Initialize connection
      const connection: BIDIConnection = {
        controller,
        backendWs: null,
        userId,
        sessionId,
        isConnected: false,
      };

      connections.set(connectionId, connection);

      // Send initial connection event
      sendSSEEvent(controller, {
        type: "connection",
        event: "connected",
        userId,
        sessionId,
        timestamp: new Date().toISOString(),
      });

      // Connect to backend WebSocket
      connectToBackend(connectionId, userId, sessionId);
    },
    cancel() {
      // Cleanup on disconnect
      cleanupConnection(connectionId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// POST endpoint for upstream messages (audio, text, etc.)
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const sessionId = searchParams.get("sessionId");

  if (!userId || !sessionId) {
    return Response.json(
      { error: "Missing userId or sessionId" },
      { status: 400 },
    );
  }

  const connectionId = `${userId}:${sessionId}`;
  const connection = connections.get(connectionId);

  if (!connection || !connection.backendWs) {
    return Response.json(
      { error: "Connection not found or backend not connected" },
      { status: 404 },
    );
  }

  try {
    const data = await request.json();

    // Forward message to backend WebSocket
    if (connection.backendWs.readyState === WebSocket.OPEN) {
      connection.backendWs.send(JSON.stringify(data));
      return Response.json({ success: true });
    }

    return Response.json(
      { error: "Backend WebSocket not open" },
      { status: 503 },
    );
  } catch (error) {
    console.error("Error forwarding message to backend:", error);
    return Response.json(
      { error: "Failed to forward message" },
      { status: 500 },
    );
  }
}

function connectToBackend(
  connectionId: string,
  userId: string,
  sessionId: string,
) {
  const connection = connections.get(connectionId);
  if (!connection) return;

  try {
    // Connect to user's ADK backend WebSocket
    const wsUrl = `${BACKEND_WS_URL}/${userId}/${sessionId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`[BIDI Bridge] Connected to backend for ${connectionId}`);
      connection.isConnected = true;
      connection.backendWs = ws;

      sendSSEEvent(connection.controller, {
        type: "connection",
        event: "backend_connected",
        timestamp: new Date().toISOString(),
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as BIDIEvent;

        // Forward backend events to frontend via SSE
        sendSSEEvent(connection.controller, {
          type: "bidi_event",
          event: data,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("[BIDI Bridge] Error parsing backend message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error(
        `[BIDI Bridge] WebSocket error for ${connectionId}:`,
        error,
      );
      sendSSEEvent(connection.controller, {
        type: "error",
        error: "Backend connection error",
        timestamp: new Date().toISOString(),
      });
    };

    ws.onclose = () => {
      console.log(`[BIDI Bridge] Backend disconnected for ${connectionId}`);
      connection.isConnected = false;
      connection.backendWs = null;

      sendSSEEvent(connection.controller, {
        type: "connection",
        event: "backend_disconnected",
        timestamp: new Date().toISOString(),
      });

      // Attempt reconnection after 5 seconds
      setTimeout(() => {
        if (connections.has(connectionId)) {
          connectToBackend(connectionId, userId, sessionId);
        }
      }, 5000);
    };
  } catch (error) {
    console.error("[BIDI Bridge] Failed to connect to backend:", error);
    sendSSEEvent(connection.controller, {
      type: "error",
      error: "Failed to connect to backend",
      timestamp: new Date().toISOString(),
    });
  }
}

function cleanupConnection(connectionId: string) {
  const connection = connections.get(connectionId);
  if (connection) {
    if (connection.backendWs) {
      connection.backendWs.close();
    }
    connections.delete(connectionId);
    console.log(`[BIDI Bridge] Cleaned up connection ${connectionId}`);
  }
}

function sendSSEEvent(
  controller: ReadableStreamController<Uint8Array>,
  data: unknown,
) {
  try {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(new TextEncoder().encode(message));
  } catch (error) {
    console.error("[BIDI Bridge] Error sending SSE event:", error);
  }
}
