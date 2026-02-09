"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Atom,
  Beaker,
  Bot,
  Brain,
  Calculator,
  Camera,
  CameraOff,
  ChevronRight,
  Eye,
  FlaskConical,
  Loader2,
  Mic,
  MicOff,
  MonitorOff,
  MonitorUp,
  Palette,
  Paperclip,
  RefreshCw,
  Send,
  User,
  Volume2,
  VolumeX,
  Waves,
  Wifi,
  WifiOff,
  Wind,
  Wrench,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { type Experiment, Workspace } from "./workspace";

// ============================================================================
// Configuration
// ============================================================================

const WS_BASE =
  process.env.NEXT_PUBLIC_PLAYGROUND_WS_URL || "ws://localhost:8000";
const CAPTURE_RATE = 16000; // mic → server (16 kHz mono PCM-16)
const PLAYBACK_RATE = 24000; // server → speaker (24 kHz mono PCM-16)
const SCREEN_FPS = 1; // screen capture frame rate (1 FPS recommended)
const SCREEN_SIZE = 768; // target resolution for screen frames (768×768)
const SCREEN_QUALITY = 0.7; // JPEG quality (0–1)

const STARTER_OPTIONS = [
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

// ============================================================================
// Types
// ============================================================================

type Status = "disconnected" | "connecting" | "connected" | "error";

type ErrorSeverity = "terminal" | "transient" | "unknown";

interface Msg {
  id: string;
  role: "user" | "agent" | "system" | "tool" | "error";
  text: string;
  ts: number;
  partial?: boolean;
  toolName?: string;
  errorCode?: string;
  errorSeverity?: ErrorSeverity;
  isThought?: boolean;
}

// ============================================================================
// Error mapping
// ============================================================================

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

// ============================================================================
// Audio helpers
// ============================================================================

const WORKLET_SRC = `
class C extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0]?.[0];
    if (ch?.length) this.port.postMessage(new Float32Array(ch));
    return true;
  }
}
registerProcessor('capture-processor', C);
`;

function f32ToI16(f: Float32Array): ArrayBuffer {
  const i = new Int16Array(f.length);
  for (let n = 0; n < f.length; n++) {
    const s = Math.max(-1, Math.min(1, f[n]));
    i[n] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return i.buffer;
}

function i16ToF32(buf: ArrayBuffer): Float32Array {
  const i = new Int16Array(buf);
  const f = new Float32Array(i.length);
  for (let n = 0; n < i.length; n++) f[n] = i[n] / (i[n] < 0 ? 0x8000 : 0x7fff);
  return f;
}

function resample(src: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return src;
  const r = from / to;
  const len = Math.floor(src.length / r);
  const dst = new Float32Array(len);
  for (let i = 0; i < len; i++) dst[i] = src[Math.floor(i * r)];
  return dst;
}

// ============================================================================
// Page component
// ============================================================================

export default function PlaygroundPage() {
  // ---- Connection state ------------------------------------------------------
  const [status, setStatus] = useState<Status>("disconnected");
  const [micOn, setMicOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [webcamOn, setWebcamOn] = useState(false);

  // ---- Experiment workspace state -------------------------------------------
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [activeExpId, setActiveExpId] = useState<string | null>(null);

  // ---- Chat input attachments -----------------------------------------------
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [attachedImage, setAttachedImage] = useState<{
    dataUrl: string;
    name: string;
  } | null>(null);

  // ---- Refs ------------------------------------------------------------------
  const ws = useRef<WebSocket | null>(null);
  const capCtx = useRef<AudioContext | null>(null);
  const capStream = useRef<MediaStream | null>(null);
  const capWorklet = useRef<AudioWorkletNode | null>(null);
  const playCtx = useRef<AudioContext | null>(null);
  const nextPlay = useRef(0);
  const partial = useRef("");
  const thoughtPartial = useRef("");
  const scrollEnd = useRef<HTMLDivElement>(null);
  const mid = useRef(0);
  const userId = useRef(`u_${Math.random().toString(36).slice(2, 8)}`);
  const sessionId = useRef(`s_${Date.now().toString(36)}`);
  const mutedRef = useRef(muted);
  const pendingExpRef = useRef<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  // Screen / webcam capture refs
  const screenStream = useRef<MediaStream | null>(null);
  const screenVideo = useRef<HTMLVideoElement | null>(null);
  const screenInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const webcamStream = useRef<MediaStream | null>(null);
  const webcamVideo = useRef<HTMLVideoElement | null>(null);
  const webcamInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const router = useRouter();

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // ---- push message ----------------------------------------------------------
  const pushMsg = useCallback(
    (role: Msg["role"], text: string, extra?: Partial<Msg>) => {
      setMessages((prev) => {
        const msg: Msg = {
          id: `m${++mid.current}`,
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

  // ---- Audio playback --------------------------------------------------------
  const playAudio = useCallback((pcm: ArrayBuffer) => {
    if (mutedRef.current) return;
    if (!playCtx.current) {
      playCtx.current = new AudioContext({ sampleRate: PLAYBACK_RATE });
    }
    const ctx = playCtx.current;
    if (ctx.state === "suspended") ctx.resume();

    const f32 = i16ToF32(pcm);
    const buf = ctx.createBuffer(1, f32.length, PLAYBACK_RATE);
    buf.getChannelData(0).set(f32);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);

    const now = ctx.currentTime;
    const t = Math.max(nextPlay.current, now + 0.02);
    src.start(t);
    nextPlay.current = t + buf.duration;
    setAgentSpeaking(true);
    src.onended = () => {
      if (ctx.currentTime >= nextPlay.current - 0.05) setAgentSpeaking(false);
    };
  }, []);

  // ---- Handle incoming ADK Event ---------------------------------------------
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
        const friendlyMsg =
          ERROR_MESSAGES[code] || ev.message || "An unknown error occurred.";
        pushMsg("error", friendlyMsg, {
          errorCode: code,
          errorSeverity: severity,
        });
        if (severity === "terminal" || severity === "transient") {
          setAgentSpeaking(false);
          setGenerating(false);
          // Force-close the WS so the user can reconnect.
          // The server may close it too, but this ensures the client
          // transitions to 'error' status immediately.
          if (ws.current) {
            try {
              ws.current.close();
            } catch {
              /* ignore */
            }
            ws.current = null;
          }
          setStatus("error");
        }
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
          setGenerating(true);
          pushMsg("tool", `Calling ${name}...`, { toolName: name });

          if (name === "create_experiment" && args.p5_code) {
            const tempId = `pending_${Date.now().toString(36)}`;
            pendingExpRef.current = tempId;
            setExperiments((prev) => [
              ...prev,
              {
                id: tempId,
                title: args.title || "Experiment",
                description: args.description || "",
                p5Code: args.p5_code,
                parentId: args.parent_id || undefined,
                version: 1,
              },
            ]);
            setActiveExpId(tempId);
            setGenerating(false);
          }

          if (name === "evolve_experiment" && args.p5_code) {
            const tempId = `pending_${Date.now().toString(36)}`;
            pendingExpRef.current = tempId;
            setExperiments((prev) => [
              ...prev,
              {
                id: tempId,
                title: args.title || "Evolved Experiment",
                description: args.changes_description || args.description || "",
                p5Code: args.p5_code,
                parentId: args.parent_id || undefined,
                version: 1,
              },
            ]);
            setActiveExpId(tempId);
            setGenerating(false);
          }

          if (name === "edit_experiment" && args.p5_code) {
            const expId = args.experiment_id;
            setExperiments((prev) =>
              prev.map((exp) =>
                exp.id === expId
                  ? { ...exp, p5Code: args.p5_code, version: exp.version + 1 }
                  : exp,
              ),
            );
            if (expId) {
              setActiveExpId(expId);
            }
            setGenerating(false);
          }
          continue;
        }

        // ---- Function response ----
        const fnResp = part.functionResponse || part.function_response;
        if (fnResp) {
          setGenerating(false);
          const resp = fnResp.response || {};

          if (
            (fnResp.name === "create_experiment" ||
              fnResp.name === "evolve_experiment") &&
            resp.experiment_id &&
            pendingExpRef.current
          ) {
            const tempId = pendingExpRef.current;
            const realId = resp.experiment_id;
            pendingExpRef.current = null;
            setExperiments((prev) =>
              prev.map((exp) =>
                exp.id === tempId ? { ...exp, id: realId } : exp,
              ),
            );
            setActiveExpId((prev) => (prev === tempId ? realId : prev));
          }

          if (resp.message) {
            pushMsg("tool", `${resp.message}`, { toolName: fnResp.name });
          }
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
              thoughtPartial.current += part.text;
              pushMsg("agent", thoughtPartial.current, {
                partial: true,
                isThought: true,
              });
            } else {
              const full = thoughtPartial.current + part.text;
              thoughtPartial.current = "";
              if (full) pushMsg("agent", full, { isThought: true });
            }
          } else {
            if (isPartial) {
              partial.current += part.text;
              pushMsg("agent", partial.current, { partial: true });
            } else {
              const full = partial.current + part.text;
              partial.current = "";
              if (full) pushMsg("agent", full);
            }
          }
        }
      }

      // Turn signals
      if (ev.turn_complete || ev.turnComplete) {
        setAgentSpeaking(false);
        if (partial.current) {
          pushMsg("agent", partial.current);
          partial.current = "";
        }
        if (thoughtPartial.current) {
          pushMsg("agent", thoughtPartial.current, { isThought: true });
          thoughtPartial.current = "";
        }
      }
      if (ev.interrupted) {
        setAgentSpeaking(false);
        partial.current = "";
        thoughtPartial.current = "";
      }
    },
    [pushMsg],
  );

  // ---- WS handler ref -------------------------------------------------------
  const wsHandler = useRef<(e: MessageEvent) => void>(undefined);
  wsHandler.current = (e: MessageEvent) => {
    if (e.data instanceof ArrayBuffer) {
      playAudio(e.data);
    } else if (typeof e.data === "string") {
      handleEvent(e.data);
    }
  };

  // ---- Connect ---------------------------------------------------------------
  const connect = useCallback(() => {
    // Force-close any leftover WS (e.g. after downstream crash where
    // the server closed but the client hasn't cleaned up yet)
    if (ws.current) {
      try {
        ws.current.close();
      } catch {
        /* ignore */
      }
      ws.current = null;
    }
    setStatus("connecting");
    playCtx.current?.resume();

    // Always generate a fresh session ID on connect to avoid
    // poisoned session resumption handles after a crash
    sessionId.current = `s_${Date.now().toString(36)}`;

    const url = `${WS_BASE}/ws/${userId.current}/${sessionId.current}`;
    const socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";

    socket.onopen = () => {
      setStatus("connected");
      pushMsg("system", "Connected to Playground Agent");
    };
    socket.onmessage = (e) => wsHandler.current?.(e);
    socket.onerror = () => {
      setStatus("error");
      pushMsg("error", "Could not connect to the server. Is it running?", {
        errorCode: "WS_ERROR",
        errorSeverity: "terminal",
      });
    };
    socket.onclose = (e) => {
      ws.current = null;
      if (e.code === 1000 || e.code === 1001) {
        setStatus("disconnected");
        pushMsg("system", "Disconnected");
      } else {
        setStatus("error");
        pushMsg("error", `Connection closed unexpectedly (code ${e.code}).`, {
          errorCode: "WS_CLOSE",
          errorSeverity: "terminal",
        });
      }
    };
    ws.current = socket;
  }, [pushMsg]);

  // ---- Send text (with optional image + experiment context) ------------------
  const sendMessage = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
      if (!t && !attachedImage && selectedNodeIds.length === 0) return;

      // 1) Send attached image if present
      if (attachedImage) {
        const b64 = attachedImage.dataUrl.split(",")[1];
        if (b64) {
          ws.current.send(
            JSON.stringify({
              type: "image",
              data: b64,
              mime_type: "image/jpeg",
            }),
          );
        }
      }

      // 2) Build context text from selected experiment nodes
      let contextPrefix = "";
      if (selectedNodeIds.length > 0) {
        const refs = selectedNodeIds
          .map((id) => {
            const exp = experiments.find((e) => e.id === id);
            if (!exp) return null;
            return `[Experiment "${exp.title}" (id=${exp.id}, v${exp.version})]`;
          })
          .filter(Boolean);
        if (refs.length > 0) {
          contextPrefix = `Referring to: ${refs.join(", ")}. `;
        }
      }

      // 3) Send combined text message
      const fullText = contextPrefix + t;
      if (fullText) {
        ws.current.send(JSON.stringify({ type: "text", content: fullText }));
      }

      // 4) Show in chat
      const displayParts: string[] = [];
      if (selectedNodeIds.length > 0) {
        const names = selectedNodeIds
          .map((id) => experiments.find((e) => e.id === id)?.title)
          .filter(Boolean);
        displayParts.push(`📎 ${names.join(", ")}`);
      }
      if (attachedImage) {
        displayParts.push(`🖼️ ${attachedImage.name}`);
      }
      if (t) {
        displayParts.push(t);
      }
      if (displayParts.length > 0) {
        pushMsg("user", displayParts.join("\n"));
      }

      // 5) Clear attachments
      setInput("");
      setAttachedImage(null);
      setSelectedNodeIds([]);
    },
    [pushMsg, attachedImage, selectedNodeIds, experiments],
  );

  // ---- Mic -------------------------------------------------------------------
  const startMic = useCallback(async () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: CAPTURE_RATE,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      const ctx = new AudioContext({ sampleRate: CAPTURE_RATE });
      const blob = new Blob([WORKLET_SRC], { type: "application/javascript" });
      const blobUrl = URL.createObjectURL(blob);
      await ctx.audioWorklet.addModule(blobUrl);
      URL.revokeObjectURL(blobUrl);

      const source = ctx.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(ctx, "capture-processor");
      const gain = ctx.createGain();
      gain.gain.value = 0;
      source.connect(worklet);
      worklet.connect(gain);
      gain.connect(ctx.destination);

      worklet.port.onmessage = (e) => {
        const f32: Float32Array = e.data;
        const down = resample(f32, ctx.sampleRate, CAPTURE_RATE);
        const pcm = f32ToI16(down);
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(pcm);
        }
      };

      capCtx.current = ctx;
      capStream.current = stream;
      capWorklet.current = worklet;
      setMicOn(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Microphone permission denied";
      pushMsg("system", `Mic error: ${message}`);
    }
  }, [pushMsg]);

  const stopMic = useCallback(() => {
    capWorklet.current?.disconnect();
    capWorklet.current = null;
    capStream.current?.getTracks().forEach((t) => {
      t.stop();
    });
    capStream.current = null;
    capCtx.current?.close();
    capCtx.current = null;
    setMicOn(false);
  }, []);

  // ---- Frame sender ----------------------------------------------------------
  const sendFrame = useCallback((video: HTMLVideoElement) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    if (!video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement("canvas");
    const aspect = video.videoWidth / video.videoHeight;
    let w = SCREEN_SIZE;
    let h = SCREEN_SIZE;
    if (aspect > 1) h = Math.round(SCREEN_SIZE / aspect);
    else w = Math.round(SCREEN_SIZE * aspect);
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    const dataUrl = canvas.toDataURL("image/jpeg", SCREEN_QUALITY);
    const b64 = dataUrl.split(",")[1];
    if (b64) {
      ws.current.send(
        JSON.stringify({ type: "image", data: b64, mime_type: "image/jpeg" }),
      );
    }
  }, []);

  // ---- Screen share ----------------------------------------------------------
  const startScreenShare = useCallback(async () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: SCREEN_SIZE },
          height: { ideal: SCREEN_SIZE },
        },
        audio: false,
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await video.play();

      screenStream.current = stream;
      screenVideo.current = video;

      screenInterval.current = setInterval(() => {
        if (screenVideo.current) sendFrame(screenVideo.current);
      }, 1000 / SCREEN_FPS);

      stream.getVideoTracks()[0].addEventListener("ended", () => {
        if (screenInterval.current) {
          clearInterval(screenInterval.current);
          screenInterval.current = null;
        }
        screenStream.current = null;
        if (screenVideo.current) {
          screenVideo.current.srcObject = null;
          screenVideo.current = null;
        }
        setScreenSharing(false);
      });

      setScreenSharing(true);
      pushMsg(
        "system",
        "Screen sharing started — the agent can now see your screen",
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Screen share denied";
      pushMsg("system", `Screen share error: ${msg}`);
    }
  }, [pushMsg, sendFrame]);

  const stopScreenShare = useCallback(() => {
    if (screenInterval.current) {
      clearInterval(screenInterval.current);
      screenInterval.current = null;
    }
    screenStream.current?.getTracks().forEach((t) => {
      t.stop();
    });
    screenStream.current = null;
    if (screenVideo.current) {
      screenVideo.current.srcObject = null;
      screenVideo.current = null;
    }
    setScreenSharing(false);
  }, []);

  // ---- Webcam ----------------------------------------------------------------
  const startWebcam = useCallback(async () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: SCREEN_SIZE },
          height: { ideal: SCREEN_SIZE },
          facingMode: "user",
        },
        audio: false,
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await video.play();

      webcamStream.current = stream;
      webcamVideo.current = video;

      webcamInterval.current = setInterval(() => {
        if (webcamVideo.current) sendFrame(webcamVideo.current);
      }, 1000 / SCREEN_FPS);

      setWebcamOn(true);
      pushMsg("system", "Webcam started — the agent can now see you");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Camera permission denied";
      pushMsg("system", `Webcam error: ${msg}`);
    }
  }, [pushMsg, sendFrame]);

  const stopWebcam = useCallback(() => {
    if (webcamInterval.current) {
      clearInterval(webcamInterval.current);
      webcamInterval.current = null;
    }
    webcamStream.current?.getTracks().forEach((t) => {
      t.stop();
    });
    webcamStream.current = null;
    if (webcamVideo.current) {
      webcamVideo.current.srcObject = null;
      webcamVideo.current = null;
    }
    setWebcamOn(false);
  }, []);

  // ---- Disconnect ------------------------------------------------------------
  const disconnect = useCallback(() => {
    if (!ws.current) return;
    try {
      ws.current.send(JSON.stringify({ type: "close" }));
    } catch {
      /* ignore */
    }
    ws.current.close();
    ws.current = null;
    stopScreenShare();
    stopWebcam();
    setStatus("disconnected");
  }, [stopScreenShare, stopWebcam]);

  // ---- Image attachment via file picker --------------------------------------
  const handleImageAttach = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        setAttachedImage({
          dataUrl: reader.result as string,
          name: file.name,
        });
      };
      reader.readAsDataURL(file);

      // Reset input so the same file can be selected again
      e.target.value = "";
    },
    [],
  );

  // ---- Node selection toggle (click / shift+click on canvas) -----------------
  const handleToggleNodeSelection = useCallback(
    (nodeId: string, shiftKey: boolean) => {
      setSelectedNodeIds((prev) => {
        if (shiftKey) {
          // Shift+click → toggle this node in the selection
          return prev.includes(nodeId)
            ? prev.filter((id) => id !== nodeId)
            : [...prev, nodeId];
        }
        // Plain click → toggle single selection
        return prev.includes(nodeId) ? [] : [nodeId];
      });
    },
    [],
  );

  // Remove a single node from selection (chip dismiss)
  const removeNodeFromSelection = useCallback((nodeId: string) => {
    setSelectedNodeIds((prev) => prev.filter((id) => id !== nodeId));
  }, []);

  // ---- Cleanup ---------------------------------------------------------------
  useEffect(() => {
    return () => {
      stopMic();
      stopScreenShare();
      stopWebcam();
      ws.current?.close();
      playCtx.current?.close();
    };
  }, [stopMic, stopScreenShare, stopWebcam]);

  // Auto-scroll transcript
  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ---- Render ----------------------------------------------------------------
  const _statusColor = {
    disconnected: "bg-muted text-muted-foreground",
    connecting: "bg-yellow-100 text-yellow-700",
    connected: "bg-emerald-600 text-white hover:bg-emerald-700",
    error: "border-destructive text-destructive",
  }[status];

  const hasAttachments = selectedNodeIds.length > 0 || attachedImage !== null;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Hidden file input for image attachment */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageAttach}
      />

      {/* ===== Header ===== */}
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
          {experiments.length > 0 && (
            <span className="ml-2 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {experiments.length} experiment
              {experiments.length !== 1 && "s"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {screenSharing && (
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
                : status === "connecting"
                  ? "bg-[#F1F5F9] text-[#64748B] border-transparent"
                  : "bg-[#F1F5F9] text-[#64748B] border-transparent hover:bg-slate-200",
            )}
          >
            {status === "connected" ? (
              <Wifi className="size-3.5" />
            ) : status === "connecting" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <WifiOff className="size-3.5" />
            )}
            {status === "connected"
              ? "Connected"
              : status === "connecting"
                ? "Connecting..."
                : status === "error"
                  ? "Error"
                  : "Disconnected"}
          </button>

          {status === "disconnected" || status === "error" ? (
            <button
              type="button"
              onClick={connect}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] text-white font-medium transition-all rounded-full hover:bg-blue-600 shadow-md shadow-blue-500/20"
            >
              Connect
            </button>
          ) : status === "connected" ? (
            <button
              type="button"
              onClick={disconnect}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-700 font-medium transition-colors bg-white/50 hover:bg-white border border-slate-200 rounded-full"
            >
              Disconnect
            </button>
          ) : null}
        </div>
      </header>

      {/* ===== Main ===== */}
      <div className="flex flex-1 overflow-hidden ">
        {/* ---------- Workspace ---------- */}
        <div className="flex flex-1 flex-col border-r">
          <Workspace
            experiments={experiments}
            activeExpId={activeExpId}
            generating={generating}
            selectedNodeIds={selectedNodeIds}
            onActiveExpChange={setActiveExpId}
            onToggleNodeSelection={handleToggleNodeSelection}
          />
        </div>

        {/* ---------- Chat panel ---------- */}
        <div className="flex w-[380px] h-full shrink-0 flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-3 overflow-y-auto">
            <div className="flex flex-col gap-2">
              {messages.length <= 1 && (
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
                          I can help you build interactive experiments,
                          simulations, and visualizations.
                        </p>
                      </div>

                      {status !== "connected" && (
                        <div className="w-full max-w-[280px]">
                          {status === "connecting" ? (
                            <button
                              type="button"
                              disabled
                              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-[#3B82F6] text-white font-medium transition-all rounded-full opacity-70 cursor-not-allowed"
                            >
                              <Loader2 className="size-4 animate-spin" />
                              Connecting...
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={connect}
                              className={cn(
                                "w-full flex items-center justify-center gap-2 px-5 py-2.5 text-white font-medium transition-all rounded-full shadow-md",
                                status === "error"
                                  ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                                  : "bg-[#3B82F6] hover:bg-blue-600 shadow-blue-500/20",
                              )}
                            >
                              <Wifi className="size-4" />
                              {status === "error"
                                ? "Reconnect"
                                : "Connect to Start"}
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
                          onClick={() => sendMessage(opt.prompt)}
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
                            <span className="font-medium text-slate-900">
                              {opt.label}
                            </span>
                            <span className="line-clamp-1 text-xs text-slate-500">
                              {opt.prompt}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex gap-2 text-sm",
                    m.role === "user" && "justify-end",
                    (m.role === "system" || m.role === "error") &&
                      "justify-center",
                  )}
                >
                  {m.role === "agent" && !m.isThought && (
                    <div className="mt-0.5 shrink-0 rounded-full bg-blue-100 p-1">
                      <Bot className="size-3.5 text-blue-600" />
                    </div>
                  )}
                  {m.role === "agent" && m.isThought && (
                    <div className="mt-0.5 shrink-0 rounded-full bg-violet-100 p-1">
                      <Brain className="size-3.5 text-violet-600" />
                    </div>
                  )}
                  {m.role === "tool" && (
                    <div className="mt-0.5 shrink-0 rounded-full bg-amber-100 p-1">
                      <Wrench className="size-3.5 text-amber-600" />
                    </div>
                  )}
                  {m.role === "error" && (
                    <div className="mt-0.5 shrink-0 rounded-full bg-red-100 p-1">
                      <AlertTriangle className="size-3.5 text-red-600" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2",
                      m.role === "user" && "bg-[#3B82F6] text-white",
                      m.role === "agent" &&
                        !m.isThought &&
                        "bg-slate-100 text-slate-800",
                      m.role === "agent" &&
                        m.isThought &&
                        "border border-violet-200 bg-violet-50/80",
                      m.role === "tool" &&
                        "border border-amber-200 bg-amber-50 text-amber-900",
                      m.role === "system" &&
                        "bg-slate-50 text-xs text-slate-500",
                      m.role === "error" &&
                        "border border-red-200 bg-red-50 text-red-700",
                      m.partial && "opacity-70",
                    )}
                  >
                    {m.isThought ? (
                      <details open={m.partial} className="group">
                        <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-violet-700 select-none [&::-webkit-details-marker]:hidden">
                          <ChevronRight className="size-3 transition-transform group-open:rotate-90" />
                          <span className="font-medium">
                            {m.partial ? "Thinking…" : "Thought"}
                          </span>
                        </summary>
                        <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-slate-600 wrap-break-word">
                          {m.text}
                        </p>
                      </details>
                    ) : (
                      <p className="whitespace-pre-wrap wrap-break-word">
                        {m.text}
                      </p>
                    )}

                    {m.role === "error" && m.errorCode && (
                      <p className="mt-0.5 text-xs opacity-70">
                        Code: {m.errorCode}
                      </p>
                    )}
                    {m.role === "error" &&
                      (m.errorSeverity === "terminal" ||
                        m.errorSeverity === "transient") &&
                      (status === "disconnected" || status === "error") && (
                        <button
                          type="button"
                          className="mt-2 gap-1 flex items-center border-red-300 text-red-700 hover:bg-red-100 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                          onClick={connect}
                        >
                          <RefreshCw className="size-3" />
                          Reconnect
                        </button>
                      )}
                  </div>

                  {m.role === "user" && (
                    <div className="mt-0.5 shrink-0 rounded-full bg-slate-200 p-1">
                      <User className="size-3.5 text-slate-600" />
                    </div>
                  )}
                </div>
              ))}

              {agentSpeaking &&
                !messages.some((m) => m.partial && m.role === "agent") && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Bot className="size-3.5 text-blue-500" />
                    <span className="flex gap-0.5">
                      <span className="animate-bounce [animation-delay:0ms]">
                        •
                      </span>
                      <span className="animate-bounce [animation-delay:150ms]">
                        •
                      </span>
                      <span className="animate-bounce [animation-delay:300ms]">
                        •
                      </span>
                    </span>
                  </div>
                )}

              <div ref={scrollEnd} />
            </div>
          </ScrollArea>

          {/* ===== Input area ===== */}
          <div className="bg-white/95 backdrop-blur-md border-t border-slate-100 p-4">
            {/* Media controls row */}
            <div className="mb-3 flex items-center gap-2">
              <button
                type="button"
                onClick={micOn ? stopMic : startMic}
                disabled={status !== "connected"}
                title={micOn ? "Stop microphone" : "Start microphone"}
                className={cn(
                  "size-9 rounded-full flex items-center justify-center transition-all",
                  micOn
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50",
                )}
              >
                {micOn ? (
                  <MicOff className="size-4" />
                ) : (
                  <Mic className="size-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setMuted((v) => !v)}
                title={muted ? "Unmute agent" : "Mute agent"}
                className="size-9 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
              >
                {muted ? (
                  <VolumeX className="size-4" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </button>

              <div className="mx-1 h-5 w-px bg-slate-200" />

              <button
                type="button"
                onClick={screenSharing ? stopScreenShare : startScreenShare}
                disabled={status !== "connected"}
                title={
                  screenSharing ? "Stop screen sharing" : "Share your screen"
                }
                className={cn(
                  "size-9 rounded-full flex items-center justify-center transition-all",
                  screenSharing
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50",
                )}
              >
                {screenSharing ? (
                  <MonitorOff className="size-4" />
                ) : (
                  <MonitorUp className="size-4" />
                )}
              </button>

              <button
                type="button"
                onClick={webcamOn ? stopWebcam : startWebcam}
                disabled={status !== "connected"}
                title={webcamOn ? "Stop webcam" : "Share webcam"}
                className={cn(
                  "size-9 rounded-full flex items-center justify-center transition-all",
                  webcamOn
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50",
                )}
              >
                {webcamOn ? (
                  <CameraOff className="size-4" />
                ) : (
                  <Camera className="size-4" />
                )}
              </button>

              <div className="flex flex-col gap-0.5 ml-auto">
                {micOn && (
                  <span className="flex items-center gap-1.5 text-xs text-red-600">
                    <span className="size-1.5 animate-pulse rounded-full bg-red-600" />
                    Listening
                  </span>
                )}
                {screenSharing && (
                  <span className="flex items-center gap-1.5 text-xs text-blue-600">
                    <span className="size-1.5 animate-pulse rounded-full bg-blue-600" />
                    Screen
                  </span>
                )}
                {webcamOn && (
                  <span className="flex items-center gap-1.5 text-xs text-green-600">
                    <span className="size-1.5 animate-pulse rounded-full bg-green-600" />
                    Camera
                  </span>
                )}
              </div>
            </div>

            {/* Attachment chips (selected experiments + image preview) */}
            {hasAttachments && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {selectedNodeIds.map((nodeId) => {
                  const exp = experiments.find((e) => e.id === nodeId);
                  if (!exp) return null;
                  return (
                    <div
                      key={nodeId}
                      className="flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs text-blue-700"
                    >
                      <Beaker className="size-3.5" />
                      <span className="max-w-[120px] truncate font-medium">
                        {exp.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeNodeFromSelection(nodeId)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-blue-100 transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  );
                })}

                {attachedImage && (
                  <div className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs text-green-700">
                    <img
                      src={attachedImage.dataUrl}
                      alt="attached"
                      className="size-4 rounded object-cover"
                    />
                    <span className="max-w-[100px] truncate font-medium">
                      {attachedImage.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-green-100 transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Text input + send */}
            <form
              className="flex gap-2 items-center"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
            >
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={status !== "connected"}
                title="Attach image"
                className="shrink-0 size-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                <Paperclip className="size-4" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  status === "connected"
                    ? "Type a message…"
                    : "Connect to start chatting"
                }
                disabled={status !== "connected"}
                className="flex-1 rounded-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:opacity-50 transition-all"
              />
              <button
                type="submit"
                disabled={
                  status !== "connected" || (!input.trim() && !hasAttachments)
                }
                className={cn(
                  "shrink-0 size-10 rounded-full flex items-center justify-center transition-all",
                  status === "connected" && (input.trim() || hasAttachments)
                    ? "bg-[#3B82F6] text-white hover:bg-blue-600 shadow-md shadow-blue-500/20"
                    : "bg-slate-100 text-slate-400 disabled:cursor-not-allowed",
                )}
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
