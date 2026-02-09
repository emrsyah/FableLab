"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatPanel, Header } from "./components";
import {
  useAudioCapture,
  useAudioPlayback,
  useExperiments,
  useMessages,
  useScreenShare,
  useWebcam,
  useWebSocket,
} from "./hooks";
import { Workspace } from "./workspace";

// ============================================================================
// Configuration
// ============================================================================

const WS_BASE =
  process.env.NEXT_PUBLIC_PLAYGROUND_WS_URL || "ws://localhost:8000";

// ============================================================================
// Page component
// ============================================================================

export default function PlaygroundPage() {
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ---- Local state ------------------------------------------------------------
  const [input, setInput] = useState("");
  const [muted, setMuted] = useState(false);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [attachedImage, setAttachedImage] = useState<{
    dataUrl: string;
    name: string;
  } | null>(null);

  // ---- Experiments hook -------------------------------------------------------
  const {
    experiments,
    activeExpId,
    setActiveExpId,
    create: createExperiment,
    evolve: evolveExperiment,
    combine: combineExperiment,
    edit: editExperiment,
    confirmId: confirmExperimentId,
    findById,
  } = useExperiments();

  // ---- Messages hook ----------------------------------------------------------
  const { messages, pushSystem, pushUser, handleEvent } = useMessages({
    onFunctionCall: (name, args) => {
      if (name === "create_experiment" && args.p5_code) {
        createExperiment({
          title: String(args.title || ""),
          description: String(args.description || ""),
          p5Code: String(args.p5_code),
          parentId: args.parent_id ? String(args.parent_id) : undefined,
        });
      }
      if (name === "evolve_experiment" && args.p5_code) {
        evolveExperiment({
          title: String(args.title || ""),
          changesDescription: String(args.changes_description || ""),
          description: String(args.description || ""),
          p5Code: String(args.p5_code),
          parentId: args.parent_id ? String(args.parent_id) : undefined,
        });
      }
      if (name === "edit_experiment" && args.p5_code) {
        const expId = String(args.experiment_id);
        editExperiment(expId, String(args.p5_code));
      }
      if (name === "combine_experiments" && args.p5_code) {
        const parentIds = Array.isArray(args.parent_ids)
          ? args.parent_ids.map(String)
          : [];
        combineExperiment({
          title: String(args.title || ""),
          description: String(args.description || ""),
          p5Code: String(args.p5_code),
          parentIds,
        });
      }
    },
    onFunctionResponse: (name, response) => {
      if (
        (name === "create_experiment" ||
          name === "evolve_experiment" ||
          name === "combine_experiments") &&
        response.experiment_id
      ) {
        const pendingExp = experiments.find((e) => e.id.startsWith("pending_"));
        if (pendingExp) {
          confirmExperimentId(pendingExp.id, String(response.experiment_id));
        }
      }
    },
    onError: (code, severity) => {
      if (severity === "terminal" || severity === "transient") {
        disconnect();
      }
    },
  });

  // ---- Audio playback hook ----------------------------------------------------
  const {
    isPlaying: agentSpeaking,
    play: playAudio,
    resume: resumeAudio,
  } = useAudioPlayback({ muted });

  // ---- WebSocket hook ---------------------------------------------------------
  const { status, connect, disconnect, send } = useWebSocket({
    baseUrl: WS_BASE,
    onBinaryMessage: (data) => {
      playAudio(data);
    },
    onTextMessage: (data) => {
      handleEvent(data);
    },
  });

  // ---- Audio capture hook -----------------------------------------------------
  const {
    isCapturing: micOn,
    start: startMic,
    stop: stopMic,
  } = useAudioCapture({
    onAudioData: (pcm) => {
      send(pcm);
    },
  });

  // ---- Screen share hook ------------------------------------------------------
  const {
    isSharing: screenSharing,
    start: startScreenShare,
    stop: stopScreenShare,
  } = useScreenShare({
    onFrame: (b64) => {
      send(
        JSON.stringify({
          type: "image",
          data: b64,
          mime_type: "image/jpeg",
        }),
      );
    },
  });

  // ---- Webcam hook ------------------------------------------------------------
  const {
    isActive: webcamOn,
    start: startWebcam,
    stop: stopWebcam,
  } = useWebcam({
    onFrame: (b64) => {
      send(
        JSON.stringify({
          type: "image",
          data: b64,
          mime_type: "image/jpeg",
        }),
      );
    },
  });

  // ---- Effects ----------------------------------------------------------------

  // Auto-connect on first mount
  const hasAutoConnected = useRef(false);
  useEffect(() => {
    if (!hasAutoConnected.current && status === "disconnected") {
      hasAutoConnected.current = true;
      connect();
    }
  }, [status, connect]);

  // Push system message on connect
  useEffect(() => {
    if (status === "connected") {
      pushSystem("Connected to Playground Agent");
    }
  }, [status, pushSystem]);

  // Resume audio context on connect
  useEffect(() => {
    if (status === "connecting") {
      resumeAudio();
    }
  }, [status, resumeAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMic();
      stopScreenShare();
      stopWebcam();
    };
  }, [stopMic, stopScreenShare, stopWebcam]);

  // ---- Handlers ---------------------------------------------------------------

  const handleSendMessage = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t && !attachedImage && selectedNodeIds.length === 0) return;

      // 1) Send attached image if present
      if (attachedImage) {
        const b64 = attachedImage.dataUrl.split(",")[1];
        if (b64) {
          send(
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
            const exp = findById(id);
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
        send(JSON.stringify({ type: "text", content: fullText }));
      }

      // 4) Show in chat
      const displayParts: string[] = [];
      if (selectedNodeIds.length > 0) {
        const names = selectedNodeIds
          .map((id) => findById(id)?.title)
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
        pushUser(displayParts.join("\n"));
      }

      // 5) Clear attachments
      setInput("");
      setAttachedImage(null);
      setSelectedNodeIds([]);
    },
    [send, attachedImage, selectedNodeIds, findById, pushUser],
  );

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

  const handleToggleNodeSelection = useCallback(
    (nodeId: string, shiftKey: boolean) => {
      setSelectedNodeIds((prev) => {
        if (shiftKey) {
          return prev.includes(nodeId)
            ? prev.filter((id) => id !== nodeId)
            : [...prev, nodeId];
        }
        return prev.includes(nodeId) ? [] : [nodeId];
      });
    },
    [],
  );

  const removeNodeFromSelection = useCallback((nodeId: string) => {
    setSelectedNodeIds((prev) => prev.filter((id) => id !== nodeId));
  }, []);

  const handleDisconnect = useCallback(() => {
    disconnect();
    stopScreenShare();
    stopWebcam();
  }, [disconnect, stopScreenShare, stopWebcam]);

  // ---- Render -----------------------------------------------------------------

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

      <Header
        experimentCount={experiments.length}
        isScreenSharing={screenSharing}
        status={status}
        onConnect={connect}
        onDisconnect={handleDisconnect}
      />

      {/* ===== Main ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ---------- Workspace ---------- */}
        <div className="flex flex-1 flex-col border-r">
          <Workspace
            experiments={experiments}
            activeExpId={activeExpId}
            generating={false}
            selectedNodeIds={selectedNodeIds}
            onActiveExpChange={setActiveExpId}
            onToggleNodeSelection={handleToggleNodeSelection}
          />
        </div>

        {/* ---------- Chat panel ---------- */}
        <ChatPanel
          messages={messages}
          isAgentSpeaking={agentSpeaking}
          status={status}
          isMicOn={micOn}
          isMuted={muted}
          isScreenSharing={screenSharing}
          isWebcamOn={webcamOn}
          selectedNodeIds={selectedNodeIds}
          attachedImage={attachedImage}
          experiments={experiments}
          input={input}
          onConnect={connect}
          onReconnect={connect}
          onSendMessage={handleSendMessage}
          onToggleMic={micOn ? stopMic : startMic}
          onToggleMute={() => setMuted((v) => !v)}
          onToggleScreenShare={
            screenSharing ? stopScreenShare : startScreenShare
          }
          onToggleWebcam={webcamOn ? stopWebcam : startWebcam}
          onRemoveNode={removeNodeFromSelection}
          onRemoveImage={() => setAttachedImage(null)}
          onInputChange={setInput}
          onAttachImage={() => imageInputRef.current?.click()}
        />
      </div>
    </div>
  );
}
