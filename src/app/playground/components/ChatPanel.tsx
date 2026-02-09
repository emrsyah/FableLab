"use client";

import { useRef } from "react";
import type { Experiment, Msg } from "../hooks";
import { AttachmentChips } from "./AttachmentChips";
import { ChatInput } from "./ChatInput";
import { MediaControls } from "./MediaControls";
import { MessageList } from "./MessageList";
import { WelcomeScreen } from "./WelcomeScreen";

interface ChatPanelProps {
  // Messages
  messages: Msg[];
  isAgentSpeaking: boolean;

  // Connection status
  status: "disconnected" | "connecting" | "connected" | "error";

  // Media controls
  isMicOn: boolean;
  isMuted: boolean;
  isScreenSharing: boolean;
  isWebcamOn: boolean;

  // Attachments
  selectedNodeIds: string[];
  attachedImage: { dataUrl: string; name: string } | null;
  experiments: Experiment[];

  // Input
  input: string;

  // Callbacks
  onConnect: () => void;
  onReconnect: () => void;
  onSendMessage: (text: string) => void;
  onToggleMic: () => void;
  onToggleMute: () => void;
  onToggleScreenShare: () => void;
  onToggleWebcam: () => void;
  onRemoveNode: (nodeId: string) => void;
  onRemoveImage: () => void;
  onInputChange: (value: string) => void;
  onAttachImage: () => void;
}

export function ChatPanel({
  messages,
  isAgentSpeaking,
  status,
  isMicOn,
  isMuted,
  isScreenSharing,
  isWebcamOn,
  selectedNodeIds,
  attachedImage,
  experiments,
  input,
  onConnect,
  onReconnect,
  onSendMessage,
  onToggleMic,
  onToggleMute,
  onToggleScreenShare,
  onToggleWebcam,
  onRemoveNode,
  onRemoveImage,
  onInputChange,
  onAttachImage,
}: ChatPanelProps) {
  const isConnected = status === "connected";
  const hasAttachments = selectedNodeIds.length > 0 || attachedImage !== null;
  const showWelcome = messages.length <= 1;

  return (
    <div className="flex w-[380px] h-full shrink-0 flex-col overflow-hidden">
      {showWelcome ? (
        <WelcomeScreen
          status={status}
          onConnect={onConnect}
          onSendMessage={onSendMessage}
        />
      ) : (
        <MessageList
          messages={messages}
          isAgentSpeaking={isAgentSpeaking}
          status={status}
          onReconnect={onReconnect}
        />
      )}

      {/* Input area */}
      <div className="bg-white/95 backdrop-blur-md border-t border-slate-100 p-4">
        <MediaControls
          isMicOn={isMicOn}
          isMuted={isMuted}
          isScreenSharing={isScreenSharing}
          isWebcamOn={isWebcamOn}
          isConnected={isConnected}
          onToggleMic={onToggleMic}
          onToggleMute={onToggleMute}
          onToggleScreenShare={onToggleScreenShare}
          onToggleWebcam={onToggleWebcam}
        />

        <AttachmentChips
          selectedNodeIds={selectedNodeIds}
          attachedImage={attachedImage}
          experiments={experiments}
          onRemoveNode={onRemoveNode}
          onRemoveImage={onRemoveImage}
        />

        <ChatInput
          input={input}
          isConnected={isConnected}
          hasAttachments={hasAttachments}
          onInputChange={onInputChange}
          onSend={() => onSendMessage(input)}
          onAttachImage={onAttachImage}
        />
      </div>
    </div>
  );
}
