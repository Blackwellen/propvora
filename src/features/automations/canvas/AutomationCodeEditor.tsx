"use client"

// Full-canvas Code view mode — shows Python-like pseudocode for the flow.

import React, { useEffect, useState } from "react"
import { Copy, Check, RefreshCw } from "lucide-react"
import type { Node, Edge } from "@xyflow/react"
import type { CanvasFlowNodeData } from "./types"

interface Props {
  nodes: Node<CanvasFlowNodeData>[]
  edges: Edge[]
}

function flowToCode(nodes: Node<CanvasFlowNodeData>[], edges: Edge[]): string {
  const adj: Record<string, string[]> = {}
  edges.forEach((e) => {
    if (!adj[e.source]) adj[e.source] = []
    adj[e.source].push(e.target)
  })

  const trigger = nodes.find((n) => n.data.category === "trigger")
  const lines: string[] = [
    `# Propvora Automation — auto-generated pseudocode`,
    `# This is a preview. The real execution happens server-side with full safety caps.`,
    ``,
  ]

  if (!trigger) {
    lines.push("# No trigger configured yet.")
    return lines.join("\n")
  }

  lines.push(`on trigger("${trigger.data.nodeType}"):`)
  lines.push(`  # Config: ${JSON.stringify(trigger.data.config)}`)
  lines.push(``)

  const visited = new Set<string>()
  function walk(nodeId: string, indent: number) {
    if (visited.has(nodeId)) return
    visited.add(nodeId)
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return
    const pad = "  ".repeat(indent)
    const cat = node.data.category
    if (cat === "trigger") {
      const next = adj[nodeId] ?? []
      next.forEach((id) => walk(id, indent))
    } else if (cat === "condition") {
      lines.push(`${pad}if condition("${node.data.nodeType}", ${JSON.stringify(node.data.config)}):`)
      const next = adj[nodeId] ?? []
      if (next.length > 0) {
        lines.push(`${pad}  # TRUE branch`)
        walk(next[0], indent + 2)
      }
      if (next.length > 1) {
        lines.push(`${pad}else:`)
        lines.push(`${pad}  # FALSE branch`)
        walk(next[1], indent + 2)
      }
    } else if (cat === "end") {
      lines.push(`${pad}end(status="${node.data.nodeType}")`)
    } else {
      lines.push(
        `${pad}${cat}("${node.data.nodeType}",`
      )
      lines.push(`${pad}  label="${node.data.label}",`)
      lines.push(`${pad}  config=${JSON.stringify(node.data.config)},`)
      lines.push(`${pad}  review_first=${node.data.requiresApproval ? "True" : "False"},`)
      lines.push(`${pad})`)
      const next = adj[nodeId] ?? []
      next.forEach((id) => walk(id, indent))
    }
  }

  walk(trigger.id, 1)
  return lines.join("\n")
}

export function AutomationCodeEditor({ nodes, edges }: Props) {
  const [code, setCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    setCode(flowToCode(nodes, edges))
  }, [nodes, edges])

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">Code view</p>
          <p className="text-[11px] text-slate-500">Pseudocode representation of your workflow</p>
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
            onClick={() => { setCode(flowToCode(nodes, edges)); setSynced(true); setTimeout(() => setSynced(false), 1500) }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            {synced ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {synced ? "Refreshed" : "Refresh"}
          </button>
        </div>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        className="flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-900 p-5 font-mono text-[12px] leading-relaxed text-sky-300 focus:border-[var(--color-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-100)]"
      />
    </div>
  )
}
