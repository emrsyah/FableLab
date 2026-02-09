"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { ExpandedOverlay } from "./expanded-overlay";
import {
  ExperimentNode,
  type ExperimentNodeType,
} from "./nodes/experiment-node";

// ============================================================================
// Types (shared with page.tsx)
// ============================================================================

export interface Experiment {
  id: string;
  title: string;
  description: string;
  p5Code: string;
  parentId?: string;
  parentIds?: string[];
  version: number;
}

// ============================================================================
// Auto-layout — hierarchical tree for experiments
// ============================================================================

const EXP_NODE_W = 280;
const EXP_NODE_H = 240;
const GAP_X = 100;
const GAP_Y = 80;

function autoLayoutExperiments(
  experiments: Experiment[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (experiments.length === 0) return positions;

  const childrenOf = new Map<string, Experiment[]>();
  const roots: Experiment[] = [];

  for (const exp of experiments) {
    // Handle combined experiments with multiple parents (parentIds)
    if (exp.parentIds && exp.parentIds.length > 0) {
      // Add as child of first parent, track all parents for positioning
      const firstParentId = exp.parentIds[0];
      if (experiments.some((e) => e.id === firstParentId)) {
        const siblings = childrenOf.get(firstParentId) || [];
        siblings.push(exp);
        childrenOf.set(firstParentId, siblings);
      } else {
        roots.push(exp);
      }
    } else if (exp.parentId && experiments.some((e) => e.id === exp.parentId)) {
      const siblings = childrenOf.get(exp.parentId) || [];
      siblings.push(exp);
      childrenOf.set(exp.parentId, siblings);
    } else {
      roots.push(exp);
    }
  }

  function layoutSubtree(exp: Experiment, x: number, y: number): number {
    positions.set(exp.id, { x, y });

    const children = childrenOf.get(exp.id) || [];
    if (children.length === 0) return x;

    let childX = x;
    for (let i = 0; i < children.length; i++) {
      const mx = layoutSubtree(children[i], childX, y + EXP_NODE_H + GAP_Y);
      childX = mx + EXP_NODE_W + GAP_X;
    }
    return childX - EXP_NODE_W - GAP_X;
  }

  let currentX = 0;
  for (const root of roots) {
    const mx = layoutSubtree(root, currentX, 0);
    currentX = mx + EXP_NODE_W + GAP_X * 2;
  }

  return positions;
}

// ============================================================================
// Custom node types registry
// ============================================================================

const nodeTypes = {
  experiment: ExperimentNode,
};

// ============================================================================
// Inner workspace (must be inside ReactFlowProvider)
// ============================================================================

interface WorkspaceInnerProps {
  experiments: Experiment[];
  activeExpId: string | null;
  generating: boolean;
  selectedNodeIds: string[];
  onActiveExpChange: (id: string | null) => void;
  onToggleNodeSelection: (id: string, shiftKey: boolean) => void;
}

function WorkspaceInner({
  experiments,
  activeExpId,
  generating,
  selectedNodeIds,
  onActiveExpChange,
  onToggleNodeSelection,
}: WorkspaceInnerProps) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<ExperimentNodeType>(
    [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Compute positions
  const layoutPositions = useMemo(
    () => autoLayoutExperiments(experiments),
    [experiments],
  );

  // Sync experiments → React Flow nodes
  useEffect(() => {
    setNodes((prev) => {
      const allNodes: ExperimentNodeType[] = [];

      for (const exp of experiments) {
        const existing = prev.find((n) => n.id === exp.id);
        allNodes.push({
          id: exp.id,
          type: "experiment" as const,
          position: existing?.position ||
            layoutPositions.get(exp.id) || { x: 0, y: 0 },
          selected: selectedNodeIds.includes(exp.id),
          data: {
            experimentId: exp.id,
            title: exp.title,
            p5Code: exp.p5Code,
            version: exp.version,
            parentId: exp.parentId,
            parentIds: exp.parentIds,
            isActive: exp.id === activeExpId,
          },
        });
      }

      return allNodes;
    });
  }, [experiments, activeExpId, selectedNodeIds, layoutPositions, setNodes]);

  // Sync evolution edges (single parent and combined/multi-parent)
  useEffect(() => {
    const edgesList: Edge[] = [];

    // Single parent edges (evolved experiments)
    experiments
      .filter(
        (exp) => exp.parentId && experiments.some((e) => e.id === exp.parentId),
      )
      .forEach((exp) => {
        edgesList.push({
          id: `evolution-${exp.parentId}-${exp.id}`,
          source: exp.parentId!,
          target: exp.id,
          animated: true,
          style: {
            stroke: "#8B5CF6",
            strokeWidth: 2,
            strokeDasharray: "6 3",
          },
          label: "evolved",
          labelBgStyle: { fill: "#f5f3ff", fillOpacity: 0.9 },
          labelStyle: { fill: "#7c3aed", fontSize: 11, fontWeight: 600 },
        });
      });

    // Multi-parent edges (combined experiments)
    experiments
      .filter(
        (exp) =>
          exp.parentIds &&
          exp.parentIds.length >= 2 &&
          exp.parentIds.every((pid) => experiments.some((e) => e.id === pid)),
      )
      .forEach((exp) => {
        exp.parentIds!.forEach((parentId, index) => {
          edgesList.push({
            id: `combined-${parentId}-${exp.id}-${index}`,
            source: parentId,
            target: exp.id,
            animated: true,
            style: {
              stroke: "#10B981",
              strokeWidth: 2,
              strokeDasharray: "6 3",
            },
            label: index === 0 ? "combined" : undefined,
            labelBgStyle: { fill: "#ecfdf5", fillOpacity: 0.9 },
            labelStyle: { fill: "#059669", fontSize: 11, fontWeight: 600 },
          });
        });
      });

    setEdges(edgesList);
  }, [experiments, setEdges]);

  // Fit view when node count changes
  useEffect(() => {
    if (experiments.length > 0) {
      const t = setTimeout(
        () => fitView({ padding: 0.3, maxZoom: 1, duration: 400 }),
        100,
      );
      return () => clearTimeout(t);
    }
  }, [experiments.length, fitView]);

  // Single click → select as context (Shift = multi-select)
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onToggleNodeSelection(node.id, event.shiftKey);
    },
    [onToggleNodeSelection],
  );

  // Double-click → expand (open experiment full-size)
  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "experiment") {
        onActiveExpChange(node.id);
      }
    },
    [onActiveExpChange],
  );

  // ---- Expanded experiment overlay -------------------------------------------
  const activeExp = activeExpId
    ? experiments.find((e) => e.id === activeExpId)
    : null;
  if (activeExp) {
    return (
      <ExpandedOverlay
        title={activeExp.title}
        p5Code={activeExp.p5Code}
        version={activeExp.version}
        onClose={() => onActiveExpChange(null)}
      />
    );
  }

  // ---- Canvas view -----------------------------------------------------------
  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        // Disable default React Flow selection (we handle it ourselves)
        selectionOnDrag={false}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="rgba(0,0,0,0.08)"
        />
        <Controls className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg" />
        <MiniMap
          nodeColor={() => "#3b82f6"}
          maskColor="rgba(0,0,0,0.06)"
          className="!bg-white/80 !rounded-lg"
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Empty state */}
      {experiments.length === 0 && !generating && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground">
            <div className="text-5xl mb-3">🧪</div>
            <h3 className="text-lg font-semibold mb-1">
              Your Experiment Canvas
            </h3>
            <p className="text-sm max-w-sm">
              Ask the AI to create an experiment — it will appear here. Click to
              select as context, double-click to expand.
            </p>
          </div>
        </div>
      )}

      {/* Generating indicator */}
      {generating && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full px-4 py-2 shadow-lg">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              Generating experiment…
            </span>
          </div>
        </div>
      )}

      {/* Selection hint */}
      {selectedNodeIds.length > 0 && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-1.5 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full px-3 py-1.5 shadow-sm">
            <span className="text-xs font-medium text-primary">
              {selectedNodeIds.length} selected as context
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Public wrapper (provides ReactFlowProvider context)
// ============================================================================

interface WorkspaceProps {
  experiments: Experiment[];
  activeExpId: string | null;
  generating: boolean;
  selectedNodeIds: string[];
  onActiveExpChange: (id: string | null) => void;
  onToggleNodeSelection: (id: string, shiftKey: boolean) => void;
}

export function Workspace(props: WorkspaceProps) {
  return (
    <ReactFlowProvider>
      <WorkspaceInner {...props} />
    </ReactFlowProvider>
  );
}
