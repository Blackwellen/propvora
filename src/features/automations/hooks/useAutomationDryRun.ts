"use client"

import { useCallback, useState } from "react"
import type { Node, Edge } from "@xyflow/react"
import type { CanvasFlowNodeData } from "../canvas/types"
import { createClient } from "@/lib/supabase/client"

export interface DryRunStep {
  index: number
  nodeId: string
  nodeLabel: string
  nodeType: string
  status: "pass" | "skip" | "error" | "pending"
  duration_ms: number
  input: Record<string, unknown>
  output: Record<string, unknown>
  error?: string
}

export interface DryRunResult {
  id: string
  status: "passed" | "failed" | "partial"
  steps: DryRunStep[]
  durationMs: number
  testEventJson: Record<string, unknown>
  errorMessage?: string
}

function simulateDryRun(
  nodes: Node<CanvasFlowNodeData>[],
  edges: Edge[],
  testEvent: Record<string, unknown>
): DryRunResult {
  // Build adjacency from edges
  const adj: Record<string, string[]> = {}
  edges.forEach((e) => {
    if (!adj[e.source]) adj[e.source] = []
    adj[e.source].push(e.target)
  })

  // Find trigger node
  const trigger = nodes.find((n) => n.data.category === "trigger")
  const steps: DryRunStep[] = []
  const visited = new Set<string>()
  const queue: string[] = trigger ? [trigger.id] : []

  let stepIndex = 0
  const startTime = Date.now()

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    if (visited.has(nodeId)) continue
    visited.add(nodeId)

    const node = nodes.find((n) => n.id === nodeId)
    if (!node) continue

    const delay = Math.floor(Math.random() * 40) + 5
    const cat = node.data.category

    let status: DryRunStep["status"] = "pass"
    let output: Record<string, unknown> = { result: "simulated" }

    if (cat === "condition") {
      // Simulate condition check — 80% pass rate
      status = Math.random() > 0.2 ? "pass" : "skip"
      output = { branch: status === "pass" ? "TRUE" : "FALSE", evaluated: true }
    } else if (cat === "trigger") {
      output = { ...testEvent, matched: true, estimatedCount: Math.floor(Math.random() * 5) + 1 }
    } else if (cat === "action" || cat === "communication") {
      output = { drafted: true, id: `dry_${Date.now()}_${stepIndex}`, preview_only: true }
    } else if (cat === "approval") {
      status = "pending"
      output = { approval_required: true, routed_to: "manager" }
    }

    steps.push({
      index: stepIndex++,
      nodeId,
      nodeLabel: node.data.label,
      nodeType: node.data.nodeType,
      status,
      duration_ms: delay,
      input: stepIndex === 1 ? testEvent : { from_previous: true },
      output,
    })

    // Follow edges only on pass
    if (status === "pass" || cat === "trigger") {
      const next = adj[nodeId] ?? []
      queue.push(...next)
    }
  }

  const failed = steps.some((s) => s.status === "error")
  const partial = steps.some((s) => s.status === "skip" || s.status === "pending")

  return {
    id: `dry_${Date.now()}`,
    status: failed ? "failed" : partial ? "partial" : "passed",
    steps,
    durationMs: Date.now() - startTime,
    testEventJson: testEvent,
  }
}

export function useAutomationDryRun(workspaceId?: string) {
  const [result, setResult] = useState<DryRunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (
      nodes: Node<CanvasFlowNodeData>[],
      edges: Edge[],
      testEvent: Record<string, unknown>,
      definitionId?: string
    ) => {
      if (!nodes.length) {
        setError("Add at least one node before running a dry run.")
        return
      }
      setRunning(true)
      setError(null)

      try {
        // Simulate locally (the real executor is server-side)
        await new Promise((r) => setTimeout(r, 600))
        const simResult = simulateDryRun(nodes, edges, testEvent)
        setResult(simResult)

        // Persist dry-run record (best-effort, 42P01-safe)
        if (workspaceId && definitionId) {
          try {
            const supabase = createClient()
            await supabase.from("automation_dry_runs").insert({
              workspace_id: workspaceId,
              automation_flow_id: definitionId,
              test_event_json: testEvent,
              result_status: simResult.status,
              started_at: new Date(Date.now() - simResult.durationMs).toISOString(),
              completed_at: new Date().toISOString(),
              duration_ms: simResult.durationMs,
            })
          } catch {
            // Non-fatal — table may not exist yet
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Dry run failed.")
      } finally {
        setRunning(false)
      }
    },
    [workspaceId]
  )

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { result, running, error, run, clear }
}
