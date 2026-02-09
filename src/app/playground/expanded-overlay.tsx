"use client";

import { ArrowLeft, Beaker } from "lucide-react";
import { P5Widget } from "@/components/playground/P5Widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ExpandedOverlayProps {
  title: string;
  p5Code: string;
  version: number;
  onClose: () => void;
}

/**
 * Full-size overlay that replaces the canvas view when a node is expanded.
 * Renders the full P5Widget for interactive experiment use.
 */
export function ExpandedOverlay({
  title,
  p5Code,
  version,
  onClose,
}: ExpandedOverlayProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header bar */}
      <div className="flex items-center gap-2 border-b px-3 py-1.5 shrink-0 bg-background">
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onClose}
          title="Back to canvas"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <Beaker className="size-4 text-muted-foreground" />
        <span className="text-xs font-medium">{title}</span>
        <Badge variant="secondary" className="ml-1 text-[10px] font-mono">
          v{version}
        </Badge>
      </div>

      {/* Full-size P5Widget */}
      <div className="flex-1 relative min-h-0">
        <P5Widget code={p5Code} width="100%" height="100%" />
      </div>
    </div>
  );
}
