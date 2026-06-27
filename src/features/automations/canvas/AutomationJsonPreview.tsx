"use client"

// Full-canvas JSON view mode — shows the entire flow definition as editable JSON.

import React, { useEffect, useState } from "react"
import { Copy, Check, RefreshCw } from "lucide-react"
import type { Node, Edge } from "@xyflow/react"
import type { CanvasFlowNodeData, FlowDefinitionJson } from "./types"
import type { FlowMeta } from "../hooks/useAutomationFlow"

interface Props {
  nodes: Node<CanvasFlowNodeData>[]
  edges: Edge[]
  meta: FlowMeta
  onImport: (json: FlowDefinitionJson) => void
}

function buildJson(
  nodes: Node<CanvasFlowNodeData>[],
  edges: Edge[],
  meta: FlowMeta
): FlowDefinitionJson {
  const trigger = nodes.find((n) => n.data.category === "trigger")
  return {
    id: meta.id ?? `flow_draft`,
    name: meta.name,
    status: meta.status,
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

export function AutomationJsonPreview({ nodes, edges, meta, onImport }: Props) {
  const [json, setJson] = useState("")
  const [parseError, setParseError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [synced, setSynced] = useState(false)

  // Sync from canvas
  useEffect(() => {
    setJson(JSON.stringify(buildJson(nodes, edges, meta), null, 2))
  }, [nodes, edges, meta])

  function copy() {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  function importJson() {
    setParseError(null)
    try {
      const parsed = JSON.parse(json) as FlowDefinitionJson
      onImport(parsed)
      setSynced(true)
      setTimeout(() => setSynced(false), 2000)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON")
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">JSON definition</p>
          <p className="text-[11px] text-slate-500">Edit directly or sync back to the canvas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={importJson}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[var(--brand-strong)] transition"
          >
            {synced ? <Check className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {synced ? "Applied" : "Apply to canvas"}
          </button>
        </div>
      </div>

      {parseError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] text-red-700">
          JSON error: {parseError}
        </div>
      )}

      <textarea
        value={json}
        onChange={(e) => { setJson(e.target.value); setParseError(null) }}
        spellCheck={false}
        className="flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-900 p-5 font-mono text-[12px] leading-relaxed text-emerald-300 focus:border-[var(--color-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-100)]"
      />
    </div>
  )
}
