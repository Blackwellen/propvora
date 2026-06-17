"use client"

// Central ReactFlow canvas zone.
// Renders nodes, edges, minimap, background, and the "empty canvas" state.
// Uses @xyflow/react v12 API. NodeTypes cast needed due to generic constraints.

import React, { useCallback } from "react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  useReactFlow,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Zap, LayoutTemplate, Wand2, Plus } from "lucide-react"
import type { CanvasFlowNodeData } from "./types"
import { AutomationNodeCard } from "./AutomationNodeCard"

// v12: nodeTypes must be typed as NodeTypes; cast the custom component.
const nodeTypes: NodeTypes = {
  automationNode: AutomationNodeCard as NodeTypes[string],
}

interface Props {
  nodes: Node<CanvasFlowNodeData>[]
  edges: Edge[]
  selectedNodeId: string | null
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  onNodeClick: (nodeId: string) => void
  onPaneClick: () => void
  onAddTrigger?: () => void
  onUseTemplate?: () => void
  onDescribeWithAi?: () => void
}

function EmptyCanvasState({
  onAddTrigger,
  onUseTemplate,
  onDescribeWithAi,
}: {
  onAddTrigger?: () => void
  onUseTemplate?: () => void
  onDescribeWithAi?: () => void
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="pointer-events-auto flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white/95 px-10 py-10 shadow-[0_8px_40px_rgba(15,23,42,0.08)]">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-[0_4px_16px_rgba(99,102,241,0.30)]">
          <Zap className="h-7 w-7 text-white" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900">Start with a trigger</h3>
          <p className="mt-1.5 text-sm text-slate-500">
            Choose an event that starts your automation
          </p>
        </div>
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={onAddTrigger}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)] hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            Choose trigger
          </button>
          <button
            onClick={onUseTemplate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <LayoutTemplate className="h-4 w-4" />
            Use template
          </button>
          <button
            onClick={onDescribeWithAi}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-5 py-2.5 text-sm font-medium text-violet-700 hover:bg-violet-100 transition"
          >
            <Wand2 className="h-4 w-4" />
            Describe with AI
          </button>
        </div>
      </div>
    </div>
  )
}

// Inner component that uses useReactFlow (must be inside ReactFlowProvider).
function CanvasInner({
  nodes,
  edges,
  selectedNodeId,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onAddTrigger,
  onUseTemplate,
  onDescribeWithAi,
}: Props) {
  const isEmpty = nodes.length === 0

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => onNodeClick(node.id),
    [onNodeClick]
  )

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <ReactFlow
        nodes={nodes.map((n) => ({
          ...n,
          selected: n.id === selectedNodeId,
        }))}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
        snapToGrid
        snapGrid={[16, 16]}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        panOnScroll
        zoomOnDoubleClick={false}
        className="bg-slate-50"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.2}
          color="#cbd5e1"
        />
        <Controls
          showZoom
          showFitView
          showInteractive={false}
          className="!rounded-xl !border !border-slate-200 !bg-white !shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
        />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={(n) => {
            const cat = (n.data as CanvasFlowNodeData).category
            const colorMap: Record<string, string> = {
              trigger: "#10b981",
              condition: "#f59e0b",
              branch: "#f97316",
              action: "#3b82f6",
              communication: "#6366f1",
              approval: "#7c3aed",
              ai: "#8b5cf6",
              payment: "#ef4444",
              legal: "#f43f5e",
              end: "#64748b",
            }
            return colorMap[cat] ?? "#94a3b8"
          }}
          className="!rounded-xl !border !border-slate-200 !bg-white !shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
        />
      </ReactFlow>

      {isEmpty && (
        <EmptyCanvasState
          onAddTrigger={onAddTrigger}
          onUseTemplate={onUseTemplate}
          onDescribeWithAi={onDescribeWithAi}
        />
      )}
    </div>
  )
}

export function AutomationCanvas(props: Props) {
  return <CanvasInner {...props} />
}
