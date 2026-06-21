"use client"

// Enterprise Automation Canvas Builder — full page orchestrator.
// 4-zone layout: Left Library | Central Canvas | Right Inspector | Bottom Testing
// Supports ?automationId=xxx, ?mode=max, ?fullscreen=true

import React, { useCallback, useMemo, useRef, useState } from "react"
import { ReactFlowProvider } from "@xyflow/react"
import { useSearchParams } from "next/navigation"
import { Plus, Sparkles } from "lucide-react"
import type { Node } from "@xyflow/react"
import type { CanvasFlowNodeData, FlowDefinitionJson, ViewMode } from "./types"
import { buildSeedWorkflow } from "./seedWorkflow"
import { AutomationWorkflowHeader } from "./AutomationWorkflowHeader"
import { AutomationNodeLibrary } from "./AutomationNodeLibrary"
import { AutomationCanvas } from "./AutomationCanvas"
import { AutomationNodeInspector } from "./AutomationNodeInspector"
import { AutomationTestingPanel } from "./AutomationTestingPanel"
import { AutomationPublishReviewModal } from "./AutomationPublishReviewModal"
import { AddNodePopover } from "./AddNodePopover"
import { AutomationJsonPreview } from "./AutomationJsonPreview"
import { AutomationCodeEditor } from "./AutomationCodeEditor"
import { AutomationAiAssistantCard } from "./AutomationAiAssistantCard"
import { useAutomationCanvasState } from "../hooks/useAutomationCanvasState"
import { useAutomationFlow } from "../hooks/useAutomationFlow"
import { useAutomationDryRun } from "../hooks/useAutomationDryRun"
import { useAutomationValidation } from "../hooks/useAutomationValidation"

interface Props {
  workspaceId?: string
}

export function AutomationCanvasPageInner({ workspaceId }: Props) {
  const searchParams = useSearchParams()
  const automationId = searchParams.get("automationId") ?? undefined
  const initMode = searchParams.get("mode") === "max" || searchParams.get("fullscreen") === "true"

  // ── State ────────────────────────────────────────────────────────────────────
  const seed = useRef(buildSeedWorkflow())
  const canvas = useAutomationCanvasState({
    nodes: seed.current.nodes,
    edges: seed.current.edges,
  })
  const flow = useAutomationFlow(workspaceId, automationId)
  const dryRun = useAutomationDryRun(workspaceId)
  const validation = useAutomationValidation(canvas.nodes)

  // ── Context variable helpers ─────────────────────────────────────────────────
  // Derive trigger node type and upstream node types for the inspector
  const triggerNodeType = useMemo(() => {
    const trigger = canvas.nodes.find((n) => n.data.category === "trigger")
    return trigger?.data.nodeType ?? null
  }, [canvas.nodes])

  const upstreamNodeTypes = useMemo(() => {
    if (!canvas.selectedNodeId) return []
    // Walk the edge graph to find all ancestors of the selected node (excluding trigger)
    const adj: Record<string, string[]> = {}
    canvas.edges.forEach((e) => {
      if (!adj[e.target]) adj[e.target] = []
      adj[e.target].push(e.source)
    })
    const visited = new Set<string>()
    const queue = [canvas.selectedNodeId]
    while (queue.length) {
      const id = queue.shift()!
      if (visited.has(id)) continue
      visited.add(id)
      const parents = adj[id] ?? []
      queue.push(...parents)
    }
    visited.delete(canvas.selectedNodeId)
    return canvas.nodes
      .filter((n) => visited.has(n.id) && n.data.category !== "trigger")
      .map((n) => n.data.nodeType)
  }, [canvas.nodes, canvas.edges, canvas.selectedNodeId])

  const [viewMode, setViewMode] = useState<ViewMode>("visual")
  const [maximised, setMaximised] = useState(initMode)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showAddNode, setShowAddNode] = useState(false)
  const [showAi, setShowAi] = useState(false)
  const [testingCollapsed, setTestingCollapsed] = useState(false)

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    await flow.saveFlow(canvas.nodes, canvas.edges)
    flow.scheduleAutosave(canvas.nodes, canvas.edges)
  }, [flow, canvas.nodes, canvas.edges])

  const handlePublish = useCallback(async () => {
    return flow.publishForReview(canvas.nodes, canvas.edges)
  }, [flow, canvas.nodes, canvas.edges])

  const handleZoomIn = useCallback(() => {
    canvas.setZoom(Math.min(canvas.zoom + 0.1, 2))
  }, [canvas])

  const handleZoomOut = useCallback(() => {
    canvas.setZoom(Math.max(canvas.zoom - 0.1, 0.2))
  }, [canvas])

  const handleFitView = useCallback(() => {
    // Fit view is available via the ReactFlow Controls panel (bottom-left of canvas)
    canvas.setZoom(1)
  }, [canvas])

  const handleDryRun = useCallback(
    (testEvent: Record<string, unknown>) => {
      dryRun.run(canvas.nodes, canvas.edges, testEvent, flow.meta.id)
    },
    [dryRun, canvas.nodes, canvas.edges, flow.meta.id]
  )

  // JSON import: reconstruct canvas from definition JSON
  const handleJsonImport = useCallback(
    (def: FlowDefinitionJson) => {
      const newNodes: Node<CanvasFlowNodeData>[] = def.nodes.map((n) => ({
        id: n.id,
        type: "automationNode",
        position: n.position,
        data: {
          nodeKey: n.id,
          nodeType: n.nodeType ?? n.type,
          category: n.type as CanvasFlowNodeData["category"],
          label: n.label,
          description: "",
          config: n.config ?? {},
          validationStatus: "unchecked" as const,
          requiresApproval: def.safety?.requiresApproval ?? false,
          risk: "low" as const,
        },
      }))
      const newEdges = def.edges.map((e, i) => ({
        id: `e-imported-${i}`,
        source: e.source,
        target: e.target,
        label: e.branchLabel,
        type: "smoothstep",
        style: { stroke: "#94a3b8", strokeWidth: 2 },
      }))
      canvas.setFullState({ nodes: newNodes, edges: newEdges })
    },
    [canvas]
  )

  // ── Layout dimensions ────────────────────────────────────────────────────────
  const libraryWidth = maximised ? "w-[280px]" : "w-[280px]"
  const inspectorWidth = maximised ? "w-[440px]" : "w-[380px]"

  const outer = [
    "flex flex-col overflow-hidden bg-slate-100",
    maximised
      ? "fixed inset-0 z-[60]"
      : "h-[calc(100vh-var(--app-topbar-height,64px)-var(--automations-nav-height,52px)-2rem)] min-h-[600px] rounded-2xl border border-slate-200",
  ].join(" ")

  return (
    <>
      <div className={outer}>
        {/* Top header */}
        <AutomationWorkflowHeader
          meta={flow.meta}
          onPatchMeta={flow.patchMeta}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          canUndo={canvas.canUndo}
          canRedo={canvas.canRedo}
          onUndo={canvas.undo}
          onRedo={canvas.redo}
          zoom={canvas.zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          maximised={maximised}
          onToggleMaximise={() => setMaximised((v) => !v)}
          saving={flow.saving}
          saved={flow.saved}
          onSave={handleSave}
          onPublish={() => setShowPublishModal(true)}
        />

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Node Library */}
          <div className={`${libraryWidth} shrink-0 overflow-hidden border-r border-slate-200 p-3`}>
            <AutomationNodeLibrary onAddNode={canvas.addNode} />
          </div>

          {/* Centre: Canvas / JSON / Code */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Canvas zone */}
            <div className="relative flex-1 overflow-hidden p-3">
              {viewMode === "visual" && (
                <>
                    <AutomationCanvas
                      nodes={canvas.nodes}
                      edges={canvas.edges}
                      selectedNodeId={canvas.selectedNodeId}
                      onNodesChange={canvas.onNodesChange}
                      onEdgesChange={canvas.onEdgesChange}
                      onConnect={canvas.onConnect}
                      onNodeClick={canvas.setSelectedNodeId}
                      onPaneClick={() => canvas.setSelectedNodeId(null)}
                      onAddTrigger={() => setShowAddNode(true)}
                      onUseTemplate={() => { /* templates via node library */ }}
                      onDescribeWithAi={() => setShowAi(true)}
                    />

                  {/* Floating action bar */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-[0_4px_20px_rgba(15,23,42,0.10)]">
                    <button
                      onClick={() => setShowAddNode(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add node
                    </button>
                    <button
                      onClick={() => setShowAi((v) => !v)}
                      className={[
                        "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                        showAi
                          ? "bg-violet-600 text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <Sparkles className="h-3.5 w-3.5" /> AI
                    </button>
                  </div>
                </>
              )}

              {viewMode === "json" && (
                <AutomationJsonPreview
                  nodes={canvas.nodes}
                  edges={canvas.edges}
                  meta={flow.meta}
                  onImport={handleJsonImport}
                />
              )}

              {viewMode === "code" && (
                <AutomationCodeEditor
                  nodes={canvas.nodes}
                  edges={canvas.edges}
                />
              )}
            </div>

            {/* Bottom: Testing panel */}
            <AutomationTestingPanel
              nodes={canvas.nodes}
              edges={canvas.edges}
              dryRunResult={dryRun.result}
              dryRunRunning={dryRun.running}
              dryRunError={dryRun.error}
              validation={validation}
              onRunDryRun={handleDryRun}
              collapsed={testingCollapsed}
              onToggleCollapse={() => setTestingCollapsed((v) => !v)}
            />
          </div>

          {/* Right: Inspector or AI panel */}
          <div className={`${inspectorWidth} shrink-0 overflow-hidden border-l border-slate-200 p-3`}>
            {showAi ? (
              <AutomationAiAssistantCard
                onClose={() => setShowAi(false)}
              />
            ) : (
              <AutomationNodeInspector
                node={canvas.selectedNode}
                onUpdateConfig={canvas.updateNodeConfig}
                onUpdateLabel={canvas.updateNodeLabel}
                onRemoveNode={canvas.removeNode}
                triggerNodeType={triggerNodeType}
                upstreamNodeTypes={upstreamNodeTypes}
              />
            )}
          </div>
        </div>
      </div>

      {/* Publish modal */}
      {showPublishModal && (
        <AutomationPublishReviewModal
          meta={flow.meta}
          validation={validation}
          dryRunResult={dryRun.result}
          onPublish={handlePublish}
          onClose={() => setShowPublishModal(false)}
        />
      )}

      {/* Add node popover */}
      {showAddNode && (
        <AddNodePopover
          onAddNode={canvas.addNode}
          onClose={() => setShowAddNode(false)}
        />
      )}
    </>
  )
}

/** Public export: wraps with ReactFlowProvider so hooks work at any depth. */
export function AutomationCanvasPage({ workspaceId }: Props) {
  return (
    <ReactFlowProvider>
      <AutomationCanvasPageInner workspaceId={workspaceId} />
    </ReactFlowProvider>
  )
}
