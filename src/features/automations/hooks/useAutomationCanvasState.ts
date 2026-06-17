"use client"

import { useCallback, useState } from "react"
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react"
import type { CanvasFlowNodeData } from "../canvas/types"
import { useAutomationUndoRedo } from "./useAutomationUndoRedo"

export interface CanvasState {
  nodes: Node<CanvasFlowNodeData>[]
  edges: Edge[]
}

/** All canvas state: nodes, edges, selection, zoom, undo/redo. */
export function useAutomationCanvasState(initial: CanvasState) {
  const { present, set, undo, redo, canUndo, canRedo } = useAutomationUndoRedo<CanvasState>(initial)

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)

  const nodes = present.nodes
  const edges = present.edges

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updated = applyNodeChanges(changes, present.nodes) as Node<CanvasFlowNodeData>[]
      set({ nodes: updated, edges: present.edges })
    },
    [present, set]
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updated = applyEdgeChanges(changes, present.edges)
      set({ nodes: present.nodes, edges: updated })
    },
    [present, set]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#94a3b8", strokeWidth: 2 },
      }
      set({ nodes: present.nodes, edges: addEdge(edge, present.edges) })
    },
    [present, set]
  )

  const updateNodeConfig = useCallback(
    (nodeId: string, config: Record<string, unknown>) => {
      const updated = present.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } } : n
      )
      set({ nodes: updated, edges: present.edges })
    },
    [present, set]
  )

  const updateNodeLabel = useCallback(
    (nodeId: string, label: string) => {
      const updated = present.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, label } } : n
      )
      set({ nodes: updated, edges: present.edges })
    },
    [present, set]
  )

  const addNode = useCallback(
    (node: Node<CanvasFlowNodeData>) => {
      set({ nodes: [...present.nodes, node], edges: present.edges })
    },
    [present, set]
  )

  const removeNode = useCallback(
    (nodeId: string) => {
      const updated = present.nodes.filter((n) => n.id !== nodeId)
      const updatedEdges = present.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      )
      set({ nodes: updated, edges: updatedEdges })
      if (selectedNodeId === nodeId) setSelectedNodeId(null)
    },
    [present, set, selectedNodeId]
  )

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null

  return {
    nodes,
    edges,
    selectedNodeId,
    selectedNode,
    zoom,
    setZoom,
    setSelectedNodeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    updateNodeConfig,
    updateNodeLabel,
    addNode,
    removeNode,
    undo,
    redo,
    canUndo,
    canRedo,
    setFullState: set,
  }
}
