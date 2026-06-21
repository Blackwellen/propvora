// Shared types for the enterprise Automation Canvas Builder.

import type { AutomationNodeCategory } from "@/lib/automation/node-registry"

/** Data attached to every ReactFlow node in the canvas. */
export interface CanvasFlowNodeData extends Record<string, unknown> {
  nodeKey: string
  nodeType: string
  category: AutomationNodeCategory
  label: string
  description: string
  config: Record<string, unknown>
  validationStatus: "valid" | "warning" | "error" | "unchecked"
  requiresApproval: boolean
  risk: "low" | "medium" | "high" | "critical" | "restricted"
  /**
   * Last execution status for this node, populated from `automation_node_runs`
   * after a run completes. Undefined means the node has never been run.
   * Used to render the run-status indicator dot on the node card.
   */
  lastRunStatus?: "succeeded" | "failed" | "skipped" | "blocked" | "awaiting_approval" | "running" | "timeout"
  /** Error message from the last failed run, shown on hover. */
  lastRunError?: string | null
}

/** The canonical workflow definition JSON (persisted in automation_flow_versions.definition_json). */
export interface FlowDefinitionJson {
  id: string
  name: string
  status: string
  version: string
  reviewFirst: boolean
  trigger: {
    id: string
    type: string
    config: Record<string, unknown>
  }
  nodes: Array<{
    id: string
    type: "trigger" | "condition" | "action" | "approval"
    label: string
    position: { x: number; y: number }
    config: Record<string, unknown>
    nodeType: string
  }>
  edges: Array<{
    source: string
    target: string
    branchLabel?: string
  }>
  safety: {
    requiresApproval: boolean
    approvalRole: string
    auditEveryStep: boolean
  }
}

/** Inspector tab IDs. */
export type InspectorTab = "settings" | "inputs" | "json" | "code" | "test"

/** Testing panel tab IDs. */
export type TestingTab = "dryrun" | "steps" | "validation" | "logs" | "outputs"

/** Canvas view mode. */
export type ViewMode = "visual" | "json" | "code"
