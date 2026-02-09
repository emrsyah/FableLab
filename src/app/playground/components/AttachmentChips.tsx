"use client";

import { Beaker, X } from "lucide-react";
import type { Experiment } from "../hooks";

interface AttachmentChipsProps {
  selectedNodeIds: string[];
  attachedImage: { dataUrl: string; name: string } | null;
  experiments: Experiment[];
  onRemoveNode: (nodeId: string) => void;
  onRemoveImage: () => void;
}

export function AttachmentChips({
  selectedNodeIds,
  attachedImage,
  experiments,
  onRemoveNode,
  onRemoveImage,
}: AttachmentChipsProps) {
  const hasAttachments = selectedNodeIds.length > 0 || attachedImage !== null;

  if (!hasAttachments) return null;

  return (
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
              onClick={() => onRemoveNode(nodeId)}
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
            onClick={onRemoveImage}
            className="ml-0.5 rounded-full p-0.5 hover:bg-green-100 transition-colors"
          >
            <X className="size-3" />
          </button>
        </div>
      )}
    </div>
  );
}
