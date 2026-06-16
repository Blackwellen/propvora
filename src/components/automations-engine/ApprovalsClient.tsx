"use client"

import React, { useEffect, useState } from "react"
import { ShieldCheck, Check, X, Clock, AlertTriangle, Loader2 } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { loadApprovals, decideApproval } from "./api"

type Approval = {
  id: string; node_type: string; category: string; risk: string; title: string; summary: string | null
  status: string; created_at: string; due_at: string | null; payload?: Record<string, unknown>
}

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  escalated: "bg-orange-50 text-orange-700 border-orange-200",
  expired: "bg-slate-100 text-slate-500 border-slate-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
}

export default function ApprovalsClient() {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const [items, setItems] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("pending")
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function reload() {
    setLoading(true)
    loadApprovals(workspaceId, filter === "all" ? undefined : filter)
      .then((r) => { if (r.ok) setItems(r.approvals as unknown as Approval[]) })
      .finally(() => setLoading(false))
  }
  useEffect(reload, [workspaceId, filter]) // eslint-disable-line react-hooks/exhaustive-deps

  function flash(m: string) { setToast(m); setTimeout(() => setToast(null), 3000) }

  async function decide(id: string, decision: "approved" | "rejected") {
    setBusy(id)
    try {
      const res = await decideApproval({ workspaceId, approvalId: id, decision })
      flash(res.ok ? `Approval ${decision}. The engine still won't auto-run payments/legal — a separate audited action does that.` : (res.error ?? "Couldn't record the decision."))
      reload()
    } finally { setBusy(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
        <p className="text-sm text-indigo-800"><span className="font-semibold">Human-in-the-loop.</span> Payment, legal, and other high-risk automation steps pause here for your decision. Approving records the decision — the engine never auto-executes a payment or legal action.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["pending", "escalated", "approved", "rejected", "all"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${filter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : items.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
          <ShieldCheck className="h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-600">No {filter === "all" ? "" : filter} approvals.</p>
          <p className="text-xs text-slate-400">When an automation reaches a high-risk node, it lands here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className={`rounded-xl border p-4 ${a.status === "pending" || a.status === "escalated" ? "border-amber-200 bg-amber-50/30" : "border-slate-200 bg-white"}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{a.title}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_TONE[a.status] ?? STATUS_TONE.pending}`}>{a.status}</span>
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 capitalize">{a.risk}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{a.summary}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-mono">{a.node_type}</span>
                    {a.due_at && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> due {new Date(a.due_at).toLocaleString()}</span>}
                    {a.status === "escalated" && <span className="inline-flex items-center gap-1 text-orange-600"><AlertTriangle className="h-3 w-3" /> escalated</span>}
                  </div>
                </div>
                {(a.status === "pending" || a.status === "escalated") && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => decide(a.id, "rejected")} disabled={busy === a.id} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"><X className="h-3.5 w-3.5" /> Reject</button>
                    <button onClick={() => decide(a.id, "approved")} disabled={busy === a.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">{busy === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 max-w-md rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-white shadow-lg">{toast}</div>}
    </div>
  )
}
