"use client";

import { nanoid } from "nanoid";
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioPlaybackManager } from "@/lib/audio/audio-playback";
import { base64ToArrayBuffer } from "@/lib/audio/pcm-utils";
import type { P5ExperimentOutput } from "@/types/adk-types";

// Base response wrapper structure
interface BaseEventWrapper {
  type: EventType;
  timestamp: string;
  conversation_state?: {
    current_agent: string;
    turn_count: number;
    is_processing_tool: boolean;
  };
}

type EventType =
  | "tool_execution_start"
  | "tool_execution_complete"
  | "text_chunk"
  | "agent_active"
  | "agent_transition"
  | "interrupted"
  | "turn_complete"
  | "user_transcription"
  | "model_transcription"
  | "error"
  | "audio_metadata"
  // Legacy event types for backward compatibility
  | "audio"
  | "text";

// Tool execution start event
interface ToolExecutionStartData {
  tool_name: string;
  arguments: Record<string, unknown>;
  calling_agent: string;
  message: string;
}

// Tool execution complete event
interface ToolExecutionCompleteData {
  tool_name: string;
  success: boolean;
  has_experiment_data: boolean;
  node_id?: string;
  message: string;
  full_response?: {
    experiment?: P5ExperimentOutput;
    node_id?: string;
    prompt?: string;
    success?: boolean;
  };
}

// Text chunk event (streaming)
interface TextChunkData {
  text: string;
  is_partial: boolean;
  accumulated_text: string;
  agent: string;
  turn_interrupted?: boolean;
}

// Agent tracking events
interface AgentActiveData {
  agent: string;
  status: "started" | "idle";
}

interface AgentTransitionData {
  from_agent: string | null;
  to_agent: string;
  transition_type: "handoff" | "interrupt";
}

// Conversation flow events
interface InterruptedData {
  current_agent: string;
  message: string;
}

interface TurnCompleteData {
  turn_number: number;
  interrupted: boolean;
  final_agent: string;
  next_action: "ready_for_input" | "processing";
}

// Transcription events
interface UserTranscriptionData {
  text: string;
  speaker: "user";
  is_final: boolean;
}

interface ModelTranscriptionData {
  text: string;
  speaker: string;
  agent: string;
}

// Error event
interface ErrorData {
  error_code: string;
  error_message: string;
  is_terminal: boolean;
  event_id?: string;
}

// Audio metadata event
interface AudioMetadataData {
  codec?: string;
  sample_rate?: number;
  channels?: number;
  duration_ms?: number;
}

// Google ADK format messages
interface GoogleADKContentPart {
  text?: string;
  thought?: boolean;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
  inlineData?: {
    mimeType: string;
    data: string; // base64 encoded
  };
}

interface GoogleADKMessage {
  content?: {
    parts: GoogleADKContentPart[];
    role?: string;
  };
  partial?: boolean;
  invocationId?: string;
  author?: string;
  actions?: {
    stateDelta?: Record<string, unknown>;
    [key: string]: unknown;
  };
  outputTranscription?: {
    text?: string;
    isFinal?: boolean;
  };
}

// Complete event structure
interface BidiEvent extends BaseEventWrapper {
  data:
    | ToolExecutionStartData
    | ToolExecutionCompleteData
    | TextChunkData
    | AgentActiveData
    | AgentTransitionData
    | InterruptedData
    | TurnCompleteData
    | UserTranscriptionData
    | ModelTranscriptionData
    | ErrorData
    | AudioMetadataData
    // Legacy support
    | { audio?: string; mime_type?: string }
    | { content?: string };
}

export type BIDIState =
  | "idle"
  | "connecting"
  | "connected"
  | "speaking"
  | "error";

export type TranscriptEntryType =
  | "message"
  | "tool_start"
  | "tool_complete"
  | "thinking";

export interface TranscriptEntry {
  text: string;
  isUser: boolean;
  timestamp: Date;
  isPartial?: boolean;
  type?: TranscriptEntryType;
  toolName?: string;
  toolSuccess?: boolean;
}

export interface UseADKBIDIOptions {
  userId?: string;
  sessionId?: string;
  wsUrl?: string;
  onTranscript?: (entry: TranscriptEntry) => void;
  onStateChange?: (state: BIDIState) => void;
  onError?: (error: Error) => void;
  onExperimentGenerated?: (
    experiment: P5ExperimentOutput,
    nodeId: string,
    message: string,
  ) => void;
  onExperimentModified?: (
    nodeId: string,
    updates: { parameter: string; value: number },
    message: string,
  ) => void;
  onComparisonCreated?: (
    comparisonId: string,
    nodeIds: string[],
    message: string,
  ) => void;
  onConceptExplained?: (
    explanation: string,
    relatedExperiments: string[],
    message: string,
  ) => void;
  onCanvasReset?: (message: string) => void;
  // New callbacks for enhanced backend events
  onToolStart?: (
    toolName: string,
    args: Record<string, unknown>,
    message: string,
  ) => void;
  onToolComplete?: (
    toolName: string,
    success: boolean,
    message: string,
  ) => void;
  onAgentTransition?: (fromAgent: string | null, toAgent: string) => void;
  onTurnComplete?: (turnNumber: number, interrupted: boolean) => void;
}

export interface UseADKBIDIReturn {
  isConnected: boolean;
  isSpeaking: boolean;
  state: BIDIState;
  transcript: TranscriptEntry[];
  currentAgent: string | null;
  isProcessingTool: boolean;
  turnCount: number;
  connect: () => void;
  disconnect: () => void;
  sendAudio: (base64Audio: string) => void;
  sendText: (text: string) => void;
  clearTranscript: () => void;
  initializeAudio: () => Promise<void>;
}

const DEFAULT_WS_URL =
  process.env.NEXT_PUBLIC_ADK_WS_URL || "ws://localhost:8000/playground/bidi";

export function useADKBIDI(options: UseADKBIDIOptions): UseADKBIDIReturn {
  const {
    userId: propUserId,
    sessionId: propSessionId,
    wsUrl = DEFAULT_WS_URL,
    onTranscript,
    onStateChange,
    onError,
    onExperimentGenerated,
    onExperimentModified,
    onComparisonCreated,
    onConceptExplained,
    onCanvasReset,
    onToolStart,
    onToolComplete,
    onAgentTransition,
    onTurnComplete,
  } = options;

  const [state, setState] = useState<BIDIState>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  // REACTIVE STATE (not refs!) - These trigger re-renders when changed
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // New state for backend event tracking
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [isProcessingTool, setIsProcessingTool] = useState(false);
  const [turnCount, setTurnCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const userIdRef = useRef(propUserId || nanoid(8));
  const sessionIdRef = useRef(propSessionId || nanoid(8));
  const playbackManagerRef = useRef<AudioPlaybackManager | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track whether the model is currently outputting "thinking" (internal reasoning)
  const isThinkingRef = useRef(false);

  // Sync props
  useEffect(() => {
    if (propUserId) userIdRef.current = propUserId;
    if (propSessionId) sessionIdRef.current = propSessionId;
  }, [propUserId, propSessionId]);

  // Update state helper that also notifies callback
  const updateState = useCallback(
    (newState: BIDIState) => {
      setState((prev) => {
        if (prev !== newState) {
          console.log("[BIDI] State:", prev, "->", newState);
          onStateChange?.(newState);
        }
        return newState;
      });
    },
    [onStateChange],
  );

  // Add transcript entry with dedup and partial-replacement logic
  const addTranscriptEntry = useCallback(
    (entry: TranscriptEntry) => {
      setTranscript((prev) => {
        const entryType = entry.type || "message";

        if (prev.length > 0) {
          const lastEntry = prev[prev.length - 1];
          const lastType = lastEntry.type || "message";

          // Replace last partial entry from same speaker
          // Allow type upgrades: a partial "message" can be replaced by "thinking"
          // when the backend sends the thought flag after the initial text chunk
          if (
            lastEntry.isUser === entry.isUser &&
            lastEntry.isPartial &&
            (lastType === entryType ||
              (lastType === "message" && entryType === "thinking"))
          ) {
            return [...prev.slice(0, -1), entry];
          }

          // Skip exact duplicate text from same speaker and type
          if (
            lastEntry.text === entry.text &&
            lastEntry.isUser === entry.isUser &&
            lastType === entryType
          ) {
            return prev;
          }
        }

        return [...prev, entry];
      });
      onTranscript?.(entry);
    },
    [onTranscript],
  );

  // Enhanced event handler for new backend event structure
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        console.log("[BIDI] Raw message:", event.data);

        // Handle Blob messages (raw audio data)
        if (event.data instanceof Blob) {
          console.log(
            "[BIDI] Received Blob audio data, size:",
            event.data.size,
          );
          // Blobs are raw audio data - convert to ArrayBuffer and queue for playback
          event.data
            .arrayBuffer()
            .then((buffer) => {
              playbackManagerRef.current?.enqueue(buffer);
            })
            .catch((err) => {
              console.error("[BIDI] Error reading Blob:", err);
            });
          return;
        }

        const payload: BidiEvent = JSON.parse(event.data);
        console.log("[BIDI] Event:", payload);

        // Check if this is a Google ADK format message (has content/partial/author fields)
        // NOTE: Backend sends BOTH structured UI updates AND raw ADK events for the same content
        // We skip ADK text processing to avoid duplication - use structured events instead
        if (
          "content" in payload ||
          "author" in payload ||
          "partial" in payload
        ) {
          const adkMsg = payload as unknown as GoogleADKMessage;

          // Only process ADK messages for:
          // 1. Function calls/responses (tool execution metadata)
          // 2. Inline audio data
          // 3. Output transcriptions (user speech)
          // SKIP regular text content - it's handled by structured events (text_chunk, model_transcription)

          if (adkMsg.content?.parts) {
            for (const part of adkMsg.content.parts) {
              // Detect "thought" / reasoning content from ADK messages
              // Set flag so corresponding text_chunk events are marked as thinking
              if (part.thought) {
                isThinkingRef.current = true;
              }

              // Handle function calls - log only, structured events handle the UI
              if (part.functionCall) {
                console.log(
                  "[BIDI] ADK function call:",
                  part.functionCall.name,
                );
                // Function call means thinking/reasoning is done
                isThinkingRef.current = false;
              }

              // Handle function responses - log only, structured events handle the UI
              if (part.functionResponse) {
                console.log(
                  "[BIDI] ADK function response:",
                  part.functionResponse.name,
                );
              }

              // Handle inline audio data (base64 encoded) - STILL NEEDED
              if (part.inlineData?.mimeType?.startsWith("audio")) {
                try {
                  const audioBytes = base64ToArrayBuffer(part.inlineData.data);
                  playbackManagerRef.current?.enqueue(audioBytes);
                  console.log(
                    "[BIDI] ADK audio queued, size:",
                    audioBytes.byteLength,
                  );
                } catch (err) {
                  console.error("[BIDI] Error processing ADK audio:", err);
                }
              }

              // NOTE: We intentionally SKIP part.text here to avoid duplication
              // Text content is already sent via structured events (text_chunk, model_transcription)
            }
          }

          // SKIP outputTranscription — this is the model's audio output transcribed to text,
          // NOT user speech. The actual text is already handled by text_chunk / model_transcription
          // structured events. Adding it here would create duplicate "user" entries.
          if (adkMsg.outputTranscription?.text) {
            console.log(
              "[BIDI] Skipping ADK outputTranscription (handled by text_chunk):",
              adkMsg.outputTranscription.text.substring(0, 50),
            );
          }

          return; // Early return for ADK format messages
        }

        // Extract common state from all events
        const { type, conversation_state, data } = payload;
        const { current_agent, is_processing_tool, turn_count } =
          conversation_state || {
            current_agent: null,
            is_processing_tool: false,
            turn_count: 0,
          };

        // Update global state (only if conversation_state is present)
        if (conversation_state) {
          setCurrentAgent(current_agent);
          setIsProcessingTool(is_processing_tool);
          setTurnCount(turn_count);
        }

        // Handle different event types
        switch (type) {
          // === TOOL EXECUTION ===
          case "tool_execution_start": {
            const toolData = data as ToolExecutionStartData;
            console.log("[BIDI] Tool started:", toolData.tool_name);
            // Thinking is done once tool execution starts
            isThinkingRef.current = false;
            // Add a tool_start transcript entry for UI status
            addTranscriptEntry({
              text: toolData.message,
              isUser: false,
              timestamp: new Date(),
              type: "tool_start",
              toolName: toolData.tool_name,
            });
            onToolStart?.(
              toolData.tool_name,
              toolData.arguments,
              toolData.message,
            );
            break;
          }

          case "tool_execution_complete": {
            const toolData = data as ToolExecutionCompleteData;
            console.log("[BIDI] Tool completed:", toolData.tool_name);

            // Update the matching tool_start entry to tool_complete
            // Also finalize any trailing partial entries so the next response starts fresh
            setTranscript((prev) => {
              const updated = [...prev];

              // Find and update the matching tool_start → tool_complete
              const idx = updated.findLastIndex(
                (e) =>
                  e.type === "tool_start" && e.toolName === toolData.tool_name,
              );
              if (idx >= 0) {
                updated[idx] = {
                  ...updated[idx],
                  type: "tool_complete",
                  toolSuccess: toolData.success,
                };
              } else {
                // No matching tool_start found — add as standalone tool_complete
                updated.push({
                  text: toolData.message,
                  isUser: false,
                  timestamp: new Date(),
                  type: "tool_complete" as const,
                  toolName: toolData.tool_name,
                  toolSuccess: toolData.success,
                });
              }

              // Finalize any trailing partial entries (thinking/message) so the
              // next model response doesn't accidentally replace them
              if (updated.length > 0) {
                const lastIdx = updated.length - 1;
                for (let i = lastIdx; i >= 0; i--) {
                  if (updated[i].isPartial && !updated[i].isUser) {
                    updated[i] = { ...updated[i], isPartial: false };
                  } else {
                    break;
                  }
                }
              }

              return updated;
            });

            onToolComplete?.(
              toolData.tool_name,
              toolData.success,
              toolData.message,
            );

            // Handle experiment generation specifically
            if (
              toolData.tool_name === "generate_experiment" &&
              toolData.has_experiment_data &&
              toolData.full_response?.experiment
            ) {
              // Use the original prompt for the title, not the raw tool message
              const experimentPrompt =
                (toolData.full_response as { prompt?: string }).prompt ||
                toolData.message;
              onExperimentGenerated?.(
                toolData.full_response.experiment,
                toolData.full_response.node_id || toolData.node_id || "",
                experimentPrompt,
              );
            }

            // Handle other tool completions based on tool_name
            if (
              toolData.tool_name === "modify_experiment" &&
              toolData.full_response
            ) {
              // Extract modify_experiment specific data from full_response
              const resp = toolData.full_response as {
                node_id?: string;
                updates?: { parameter: string; value: number };
                message?: string;
              };
              if (resp.node_id && resp.updates && resp.message) {
                onExperimentModified?.(
                  resp.node_id,
                  resp.updates,
                  resp.message,
                );
              }
            }

            if (
              toolData.tool_name === "compare_experiments" &&
              toolData.full_response
            ) {
              const resp = toolData.full_response as {
                comparison_id?: string;
                node_ids?: string[];
                message?: string;
              };
              if (resp.comparison_id && resp.node_ids && resp.message) {
                onComparisonCreated?.(
                  resp.comparison_id,
                  resp.node_ids,
                  resp.message,
                );
              }
            }

            if (
              toolData.tool_name === "explain_concept" &&
              toolData.full_response
            ) {
              const resp = toolData.full_response as {
                explanation?: string;
                related_experiments?: string[];
                message?: string;
              };
              if (resp.explanation && resp.message) {
                onConceptExplained?.(
                  resp.explanation,
                  resp.related_experiments || [],
                  resp.message,
                );
              }
            }

            if (
              toolData.tool_name === "reset_canvas" &&
              toolData.full_response
            ) {
              const resp = toolData.full_response as { message?: string };
              if (resp.message) {
                onCanvasReset?.(resp.message);
              }
            }
            break;
          }

          // === TEXT STREAMING ===
          case "text_chunk": {
            const textData = data as TextChunkData;
            // Coerce is_partial: backend may send null for complete chunks
            const isPartial = !!textData.is_partial;
            const entryType = isThinkingRef.current ? "thinking" : "message";

            console.log(
              "[BIDI] Text chunk:",
              isPartial ? "(partial)" : "(complete)",
              `[${entryType}]`,
              textData.text.substring(0, 50),
            );

            addTranscriptEntry({
              text: textData.accumulated_text || textData.text,
              isUser: false,
              timestamp: new Date(),
              isPartial,
              type: entryType,
            });
            break;
          }

          // === AGENT TRACKING ===
          case "agent_active": {
            const agentData = data as AgentActiveData;
            console.log("[BIDI] Agent active:", agentData.agent);
            break;
          }

          case "agent_transition": {
            const transitionData = data as AgentTransitionData;
            console.log(
              "[BIDI] Agent transition:",
              transitionData.from_agent,
              "->",
              transitionData.to_agent,
            );
            onAgentTransition?.(
              transitionData.from_agent,
              transitionData.to_agent,
            );
            break;
          }

          // === CONVERSATION FLOW ===
          case "interrupted": {
            const interruptedData = data as InterruptedData;
            console.log("[BIDI] Interrupted:", interruptedData.message);
            playbackManagerRef.current?.interrupt();
            setIsSpeaking(false);
            updateState("connected");
            break;
          }

          case "turn_complete": {
            const turnData = data as TurnCompleteData;
            console.log("[BIDI] Turn complete:", turnData.turn_number);
            isThinkingRef.current = false;
            setIsSpeaking(false);
            updateState("connected");
            onTurnComplete?.(turnData.turn_number, turnData.interrupted);
            break;
          }

          // === TRANSCRIPTIONS ===
          case "user_transcription": {
            const transData = data as UserTranscriptionData;
            console.log("[BIDI] User transcription:", transData.text);
            addTranscriptEntry({
              text: transData.text,
              isUser: true,
              timestamp: new Date(),
              isPartial: !transData.is_final,
            });
            break;
          }

          case "model_transcription": {
            const transData = data as ModelTranscriptionData;
            console.log("[BIDI] Model transcription:", transData.text);
            addTranscriptEntry({
              text: transData.text,
              isUser: false,
              timestamp: new Date(),
              isPartial: false, // Model transcription is typically final
            });
            break;
          }

          // === ERRORS ===
          case "audio_metadata": {
            const metadataData = data as AudioMetadataData;
            console.log("[BIDI] Audio metadata:", metadataData);
            // Log metadata for debugging; could be used for audio configuration
            break;
          }

          case "error": {
            const errorData = data as ErrorData;
            console.error(
              "[BIDI] Error:",
              errorData.error_code,
              errorData.error_message,
            );
            onError?.(
              new Error(`${errorData.error_code}: ${errorData.error_message}`),
            );
            updateState("error");
            break;
          }

          // === LEGACY SUPPORT (for backward compatibility) ===
          case "audio": {
            // Handle legacy audio events
            const audioData = data as { audio?: string; mime_type?: string };
            if (audioData.audio && audioData.mime_type?.includes("audio")) {
              try {
                const audioBytes = base64ToArrayBuffer(audioData.audio);
                playbackManagerRef.current?.enqueue(audioBytes);
              } catch (error) {
                console.error("[BIDI] Error processing audio:", error);
              }
            }
            break;
          }

          case "text": {
            // Handle legacy text events
            const textData = data as { content?: string };
            if (textData.content) {
              addTranscriptEntry({
                text: textData.content,
                isUser: false,
                timestamp: new Date(),
                isPartial: false,
              });
            }
            break;
          }

          default:
            console.warn("[BIDI] Unknown event type:", type);
        }
      } catch (err) {
        console.error("[BIDI] Parse error:", err);
        console.log("[BIDI] Raw message:", event.data);
      }
    },
    [
      addTranscriptEntry,
      updateState,
      onError,
      onExperimentGenerated,
      onExperimentModified,
      onComparisonCreated,
      onConceptExplained,
      onCanvasReset,
      onToolStart,
      onToolComplete,
      onAgentTransition,
      onTurnComplete,
    ],
  );

  // Connect WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("[BIDI] Already connected");
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    console.log("[BIDI] Connecting...");
    updateState("connecting");

    const fullWsUrl = `${wsUrl}/${userIdRef.current}/${sessionIdRef.current}`;
    console.log(`[BIDI] URL: ${fullWsUrl}`);

    const ws = new WebSocket(fullWsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[BIDI] Connected");
      setIsConnected(true);
      updateState("connected");
    };

    ws.onmessage = handleMessage;

    ws.onerror = (error) => {
      console.error("[BIDI] WebSocket error:", error);
      onError?.(new Error("WebSocket connection error"));
      updateState("error");
    };

    ws.onclose = (event) => {
      console.log("[BIDI] Disconnected:", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
      setIsConnected(false);
      setIsSpeaking(false);
      wsRef.current = null;
      updateState("idle");

      // Auto-reconnect
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("[BIDI] Reconnecting...");
        connect();
      }, 5000);
    };
  }, [wsUrl, handleMessage, onError, updateState]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    console.log("[BIDI] Disconnecting...");

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    playbackManagerRef.current?.dispose();
    playbackManagerRef.current = null;

    setIsConnected(false);
    setIsSpeaking(false);
    updateState("idle");
  }, [updateState]);

  // Send audio data
  const sendAudio = useCallback((base64Audio: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn("[BIDI] Cannot send audio: not connected");
      return;
    }

    console.log("[BIDI] Sending audio:", base64Audio.length, "chars");

    wsRef.current.send(
      JSON.stringify({
        type: "audio",
        data: base64Audio,
        mime_type: "audio/pcm;rate=16000",
      }),
    );
  }, []);

  // Send text message
  const sendText = useCallback(
    (text: string) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        console.warn("[BIDI] Cannot send text: not connected");
        return;
      }

      console.log("[BIDI] Sending text:", text);

      // Add to transcript immediately as user message
      addTranscriptEntry({
        text,
        isUser: true,
        timestamp: new Date(),
        isPartial: false,
      });

      // Send to server
      wsRef.current.send(JSON.stringify({ type: "text", content: text }));
    },
    [addTranscriptEntry],
  );

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript([]);
  }, []);

  // Initialize audio playback manager (called on user gesture)
  const initializeAudio = useCallback(async () => {
    if (!playbackManagerRef.current) {
      console.log("[BIDI] Creating AudioPlaybackManager...");
      playbackManagerRef.current = new AudioPlaybackManager(24000, {
        onPlaybackStart: () => {
          console.log("[BIDI] Playback started");
          setIsSpeaking(true);
          updateState("speaking");
        },
        onPlaybackEnd: () => {
          console.log("[BIDI] Playback ended");
          setIsSpeaking(false);
          if (isConnected) {
            updateState("connected");
          }
        },
      });
    }

    // Initialize AudioContext (must be called after user gesture)
    await playbackManagerRef.current.initialize();
    console.log("[BIDI] Audio initialized");
  }, [isConnected, updateState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("[BIDI] Cleanup");
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      playbackManagerRef.current?.dispose();
    };
  }, []);

  return {
    isConnected,
    isSpeaking,
    state,
    transcript,
    currentAgent,
    isProcessingTool,
    turnCount,
    connect,
    disconnect,
    sendAudio,
    sendText,
    clearTranscript,
    initializeAudio,
  };
}
