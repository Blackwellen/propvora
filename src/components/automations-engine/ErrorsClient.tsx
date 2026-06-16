"use client"

import React, { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { loadErrors, resolveErrorApi } from "./api"

type AutoError = {
  id: string; severity: string; code: string | null; message: string; node_type: string | null
  resolved: boolean; created_at: string; run_id: string | null
}
const SEV_TONE: Record<string, string> = {
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  critical: "border-red-300 bg-red-50 text-red-800",
}

export default function ErrorsClient() {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const [items, setItems] = useState<AutoError[]>([])
  const [loading, setLoading] = useState(true)
  const [showResolved, setShowResolved] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  function reload() {
    setLoading(true)
    loadErrors(workspaceId, showResolved ? undefined : false)
      .then((r) => { if (r.ok) setItems(r.errors as unknown as AutoError[]) })
      .finally(() => setLoading(false))
  }
  useEffect(reload, [workspaceId, showResolved]) // eslint-disable-line react-hooks/exhaustive-deps

  async function resolve(id: string) {
    setBusy(id)
    try { await resolveErrorApi({ workspaceId, errorId: id }); reload() } finally { setBusy(null) }
  }

  return (
    <div className="space-y-4">
      <label className="inline-flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} className="h-4 w-4 rounded border-slate-300" /> Show resolved
      </label>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : items.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-300" />
          <p className="mt-2 text-sm font-medium text-slate-600">No {showResolved ? "" : "open "}errors.</p>
          <p className="text-xs text-slate-400">Failed automation runs and nodes are recorded here for triage.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((e) => (
            <div key={e.id} className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 ${SEV_TONE[e.severity] ?? SEV_TONE.error}`}>
              <div className="flex min-w-0 items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{e.message}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] opacity-80">
                    {e.code && <span className="font-mono">{e.code}</span>}
                    {e.node_type && <span className="font-mono">{e.node_type}</span>}
                    <span>{new Date(e.created_at).toLocaleString()}</span>
                    {e.resolved && <span className="font-semibold">resolved</span>}
                  </div>
                </div>
              </div>
              {!e.resolved && (
                <button onClick={() => resolve(e.id)} disabled={busy === e.id} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-current/30 bg-white/70 px-2.5 py-1.5 text-xs font-medium hover:bg-white disabled:opacity-50">
                  {busy === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Resolve
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
