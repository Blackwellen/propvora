"use client"

import React, { useState } from "react"
import { Power, ShieldAlert, Loader2 } from "lucide-react"

type Node = {
  node_type: string; label: string; category: string; risk: string; min_plan: string
  requires_approval: boolean; blocked_from_autorun: boolean; enabled: boolean
}

const RISK_TONE: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700", medium: "bg-amber-50 text-amber-700",
  high: "bg-orange-50 text-orange-700", critical: "bg-rose-50 text-rose-700", restricted: "bg-slate-900 text-white",
}

// Admin node registry with a per-node KILL-SWITCH. Disabling a node bans it from
// every workspace's canvas compiler (a global safety control).
export default function NodeRegistryTable({ initial }: { initial: Node[] }) {
  const [nodes, setNodes] = useState<Node[]>(initial)
  const [busy, setBusy] = useState<string | null>(null)

  async function toggle(node: Node) {
    setBusy(node.node_type)
    try {
      const res = await fetch("/api/admin/automations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_node", nodeType: node.node_type, enabled: !node.enabled }),
      })
      const json = await res.json()
      if (json.ok) setNodes((ns) => ns.map((n) => (n.node_type === node.node_type ? { ...n, enabled: json.enabled } : n)))
    } finally { setBusy(null) }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              {["Node", "Category", "Risk", "Min plan", "Flags", "Kill-switch"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {nodes.map((n) => (
              <tr key={n.node_type} className={n.enabled ? "" : "bg-rose-50/40"}>
                <td className="px-4 py-3"><div className="font-medium text-slate-900">{n.label}</div><div className="font-mono text-[10px] text-slate-400">{n.node_type}</div></td>
                <td className="px-4 py-3 capitalize text-slate-600">{n.category}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${RISK_TONE[n.risk] ?? "bg-slate-100 text-slate-600"}`}>{n.risk}</span></td>
                <td className="px-4 py-3 text-slate-600">{n.min_plan}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {n.requires_approval && <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700"><ShieldAlert className="h-2.5 w-2.5" /> approval</span>}
                    {n.blocked_from_autorun && <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">no auto-run</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(n)} disabled={busy === n.node_type}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 ${n.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                    {busy === n.node_type ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />} {n.enabled ? "Enabled" : "Killed"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
