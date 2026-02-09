"use client";

import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { Beaker } from "lucide-react";
import { memo } from "react";
import { P5Widget } from "@/components/playground/P5Widget";
import { cn } from "@/lib/utils";

export interface ExperimentNodeData extends Record<string, unknown> {
  experimentId: string;
  title: string;
  p5Code: string;
  version: number;
  parentId?: string;
  isActive?: boolean;
}

export type ExperimentNodeType = Node<ExperimentNodeData, "experiment">;

export const ExperimentNode = memo(function ExperimentNode({
  data,
  selected,
}: NodeProps<ExperimentNodeType>) {
  return (
    <div
      className={cn(
        "w-[260px] rounded-xl border-2 bg-white shadow-md overflow-hidden transition-all cursor-pointer",
        selected
          ? "border-primary shadow-lg shadow-primary/20"
          : "border-slate-200 hover:border-slate-300",
        data.isActive && "ring-2 ring-primary/50 ring-offset-2",
      )}
    >
      {/* Live P5 thumbnail — interaction disabled, visual only */}
      <div className="h-[170px] bg-slate-50 relative overflow-hidden">
        <div className="pointer-events-none w-full h-full">
          <P5Widget code={data.p5Code} width="100%" height="100%" />
        </div>
      </div>

      {/* Info bar */}
      <div className="px-3 py-2 border-t border-slate-100 bg-white">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Beaker className="size-3.5 text-primary shrink-0" />
            <span className="text-xs font-semibold truncate">{data.title}</span>
          </div>
          <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-full shrink-0">
            v{data.version}
          </span>
        </div>
      </div>

      {/* Connection handles for evolution edges */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-primary !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-white"
      />
    </div>
  );
});
