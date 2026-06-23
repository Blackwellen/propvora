"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Node, Edge } from "@xyflow/react"
import type { CanvasFlowNodeData, FlowDefinitionJson } from "../canvas/types"
import { createClient } from "@/lib/supabase/client"

export interface FlowMeta {
  id?: string
  name: string
  description: string
  status: "draft" | "pending_review" | "active" | "archived"
  reviewFirst: boolean
  version: string
  currentVersionId?: string
}

function nodesToDefinition(
  nodes: Node<CanvasFlowNodeData>[],
  edges: Edge[],
  meta: FlowMeta
): FlowDefinitionJson {
  const trigger = nodes.find((n) => n.data.category === "trigger")
  return {
    id: meta.id ?? `flow_${Date.now()}`,
    name: meta.name,
    status: meta.status === "pending_review" ? "draft_review_first" : meta.status,
    version: meta.version,
    reviewFirst: meta.reviewFirst,
    trigger: trigger
      ? { id: trigger.id, type: trigger.data.nodeType, config: trigger.data.config ?? {} }
      : { id: "", type: "", config: {} },
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.data.category as "trigger" | "condition" | "action" | "approval",
      label: n.data.label,
      position: n.position,
      config: n.data.config ?? {},
      nodeType: n.data.nodeType,
    })),
    edges: edges.map((e) => ({
      source: e.source,
      target: e.target,
      branchLabel: (e.label as string | undefined) ?? undefined,
    })),
    safety: {
      requiresApproval: meta.reviewFirst,
      approvalRole: "manager",
      auditEveryStep: true,
    },
  }
}

export function useAutomationFlow(workspaceId?: string, automationId?: string) {
  const [meta, setMeta] = useState<FlowMeta>({
    name: "Untitled automation",
    description: "",
    status: "draft",
    reviewFirst: true,
    version: "1.0.0",
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load existing flow
  useEffect(() => {
    if (!automationId || !workspaceId) return
    setLoading(true)
    const supabase = createClient()
    supabase
      .from("automation_flows")
      .select("*")
      .eq("id", automationId)
      .eq("workspace_id", workspaceId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setMeta({
            id: String(data.id),
            name: String(data.name ?? ""),
            description: String(data.description ?? ""),
            status: (data.status as FlowMeta["status"]) ?? "draft",
            reviewFirst: Boolean(data.review_first ?? true),
            version: "1.0.0",
            currentVersionId: data.current_version_id ? String(data.current_version_id) : undefined,
          })
        }
        setLoading(false)
      }, () => setLoading(false))
  }, [automationId, workspaceId])

  const saveFlow = useCallback(
    async (nodes: Node<CanvasFlowNodeData>[], edges: Edge[]) => {
      if (!workspaceId) {
        setSaveError("No workspace context — please reload.")
        return null
      }
      if (!meta.name.trim()) {
        setSaveError("Give your automation a name before saving.")
        return null
      }
      setSaving(true)
      setSaveError(null)
      setSaved(false)

      try {
        const supabase = createClient()
        const definitionJson = nodesToDefinition(nodes, edges, meta)

        let flowId = meta.id ?? null

        if (meta.id) {
          // Update existing
          const { error } = await supabase
            .from("automation_flows")
            .update({
              name: meta.name,
              description: meta.description,
              status: meta.status,
              review_first: meta.reviewFirst,
              updated_at: new Date().toISOString(),
            })
            .eq("id", meta.id)
            .eq("workspace_id", workspaceId)
          if (error) throw new Error(error.message)
        } else {
          // Insert new
          const { data, error } = await supabase
            .from("automation_flows")
            .insert({
              workspace_id: workspaceId,
              name: meta.name,
              description: meta.description,
              status: "draft",
              review_first: true,
              trigger_type: nodes.find((n) => n.data.category === "trigger")?.data.nodeType ?? null,
              is_enabled: false,
            })
            .select("id")
            .single()
          if (error) {
            // Table may not exist yet (42P01) — save definition JSON locally
            if (error.code === "42P01") {
              setSaved(true)
              console.warn("[AutomationFlow] automation_flows table not yet migrated — saved to local state only.")
              return { id: undefined, definitionJson }
            }
            throw new Error(error.message)
          }
          flowId = String(data.id)
          setMeta((m) => ({ ...m, id: flowId! }))
        }

        // Persist the workflow definition itself. Previously the built
        // definitionJson (nodes/edges/config) was discarded, so saving an
        // automation lost everything you built. Write it as a new version row
        // and point the flow at it. Best-effort: a missing versions table must
        // not fail the save (the flow metadata is still saved above).
        if (flowId) {
          try {
            const { data: lastV } = await supabase
              .from("automation_flow_versions")
              .select("version_number")
              .eq("automation_flow_id", flowId)
              .order("version_number", { ascending: false })
              .limit(1)
              .maybeSingle()
            const nextVersion = Number((lastV as { version_number?: number } | null)?.version_number ?? 0) + 1
            const { data: ver } = await supabase
              .from("automation_flow_versions")
              .insert({
                workspace_id: workspaceId,
                automation_flow_id: flowId,
                version_number: nextVersion,
                definition_json: definitionJson as unknown as Record<string, unknown>,
                visual_layout_json: { nodes: nodes.map((n) => ({ id: n.id, position: n.position })) },
                status: "draft",
              })
              .select("id")
              .single()
            if (ver?.id) {
              await supabase
                .from("automation_flows")
                .update({ current_version_id: String(ver.id) })
                .eq("id", flowId)
                .eq("workspace_id", workspaceId)
            }
          } catch {
            /* versions table missing — metadata save above still succeeded */
          }
        }

        setSaved(true)
        return { id: flowId ?? meta.id, definitionJson }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Save failed."
        setSaveError(msg)
        return null
      } finally {
        setSaving(false)
      }
    },
    [meta, workspaceId]
  )

  const publishForReview = useCallback(
    async (nodes: Node<CanvasFlowNodeData>[], edges: Edge[]) => {
      if (!workspaceId) return { ok: false, error: "No workspace." }
      setSaving(true)
      setSaveError(null)
      try {
        // Save first
        const saved = await saveFlow(nodes, edges)
        if (!saved) return { ok: false, error: saveError ?? "Save failed." }

        const supabase = createClient()
        const flowId = meta.id ?? saved.id

        if (flowId) {
          await supabase
            .from("automation_flows")
            .update({ status: "pending_review", updated_at: new Date().toISOString() })
            .eq("id", flowId)
            .eq("workspace_id", workspaceId)
        }
        setMeta((m) => ({ ...m, status: "pending_review" }))
        return { ok: true }
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Publish failed." }
      } finally {
        setSaving(false)
      }
    },
    [meta, workspaceId, saveFlow, saveError]
  )

  // Autosave: debounce 30s
  const scheduleAutosave = useCallback(
    (nodes: Node<CanvasFlowNodeData>[], edges: Edge[]) => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      autosaveTimer.current = setTimeout(() => {
        saveFlow(nodes, edges)
      }, 30_000)
    },
    [saveFlow]
  )

  const patchMeta = useCallback((p: Partial<FlowMeta>) => {
    setMeta((m) => ({ ...m, ...p }))
    setSaved(false)
  }, [])

  return {
    meta,
    patchMeta,
    loading,
    saving,
    saved,
    saveError,
    saveFlow,
    publishForReview,
    scheduleAutosave,
  }
}
