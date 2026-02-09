"use client";

import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  MonitorOff,
  MonitorUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaControlsProps {
  isMicOn: boolean;
  isMuted: boolean;
  isScreenSharing: boolean;
  isWebcamOn: boolean;
  isConnected: boolean;
  onToggleMic: () => void;
  onToggleMute: () => void;
  onToggleScreenShare: () => void;
  onToggleWebcam: () => void;
}

export function MediaControls({
  isMicOn,
  isMuted,
  isScreenSharing,
  isWebcamOn,
  isConnected,
  onToggleMic,
  onToggleMute,
  onToggleScreenShare,
  onToggleWebcam,
}: MediaControlsProps) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {/* Mic button */}
      <button
        type="button"
        onClick={onToggleMic}
        disabled={!isConnected}
        title={isMicOn ? "Stop microphone" : "Start microphone"}
        className={cn(
          "size-9 rounded-full flex items-center justify-center transition-all",
          isMicOn
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50",
        )}
      >
        {isMicOn ? <MicOff className="size-4" /> : <Mic className="size-4" />}
      </button>

      {/* Mute button */}
      <button
        type="button"
        onClick={onToggleMute}
        title={isMuted ? "Unmute agent" : "Mute agent"}
        className="size-9 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
      >
        {isMuted ? (
          <VolumeX className="size-4" />
        ) : (
          <Volume2 className="size-4" />
        )}
      </button>

      <div className="mx-1 h-5 w-px bg-slate-200" />

      {/* Screen share button */}
      <button
        type="button"
        onClick={onToggleScreenShare}
        disabled={!isConnected}
        title={isScreenSharing ? "Stop screen sharing" : "Share your screen"}
        className={cn(
          "size-9 rounded-full flex items-center justify-center transition-all",
          isScreenSharing
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50",
        )}
      >
        {isScreenSharing ? (
          <MonitorOff className="size-4" />
        ) : (
          <MonitorUp className="size-4" />
        )}
      </button>

      {/* Webcam button */}
      <button
        type="button"
        onClick={onToggleWebcam}
        disabled={!isConnected}
        title={isWebcamOn ? "Stop webcam" : "Share webcam"}
        className={cn(
          "size-9 rounded-full flex items-center justify-center transition-all",
          isWebcamOn
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50",
        )}
      >
        {isWebcamOn ? (
          <CameraOff className="size-4" />
        ) : (
          <Camera className="size-4" />
        )}
      </button>

      {/* Status indicators */}
      <div className="flex flex-col gap-0.5 ml-auto">
        {isMicOn && (
          <span className="flex items-center gap-1.5 text-xs text-red-600">
            <span className="size-1.5 animate-pulse rounded-full bg-red-600" />
            Listening
          </span>
        )}
        {isScreenSharing && (
          <span className="flex items-center gap-1.5 text-xs text-blue-600">
            <span className="size-1.5 animate-pulse rounded-full bg-blue-600" />
            Screen
          </span>
        )}
        {isWebcamOn && (
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <span className="size-1.5 animate-pulse rounded-full bg-green-600" />
            Camera
          </span>
        )}
      </div>
    </div>
  );
}
