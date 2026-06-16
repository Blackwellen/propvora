"use client"

import React, { useEffect, useState } from "react"
import { CircleDot, ShieldAlert, RotateCcw, Loader2, Ban, Clock, CheckCircle2, XCircle } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { loadRunDetail, replayRun } from "./api"

type NodeRun = { id: string; node_key: string; node_type: string; category: string; seq: number; status: string; error: string | null }
type Event = { id: string; event_type: string; level: string; message: string | null; node_key: string | null; created_at: string }

const NODE_STATUS_ICON: Record<string, React.ElementType> = {
  succeeded: CheckCircle2, failed: XCircle, blocked: Ban, awaiting_approval: Clock, skipped: CircleDot, simulated: CircleDot,
}
const NODE_STATUS_TONE: Record<string, string> = {
  succeeded: "text-emerald-600", failed: "text-rose-600", blocked: "text-slate-500",
  awaiting_approval: "text-amber-600", skipped: "text-slate-400", simulated: "text-violet-500",
}

export default function RunNodeTimeline({ runId }: { runId: string }) {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const [nodeRuns, setNodeRuns] = useState<NodeRun[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [replaying, setReplaying] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    loadRunDetail(runId, workspaceId).then((r) => {
      if (r.ok) { setNodeRuns((r.nodeRuns ?? []) as unknown as NodeRun[]); setEvents((r.events ?? []) as unknown as Event[]) }
    }).finally(() => setLoading(false))
  }, [runId, workspaceId])

  async function replay() {
    setReplaying(true)
    try {
      const res = await replayRun({ workspaceId, runId })
      setToast(res.ok ? "Replay queued — it drains under all gates + approvals." : (res.error ?? "Couldn't replay."))
    } finally { setReplaying(false); setTimeout(() => setToast(null), 3500) }
  }

  if (loading) return <div className="h-32 animate-pulse rounded-xl bg-slate-100" />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Node graph traversal</h3>
        <button onClick={replay} disabled={replaying} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          {replaying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />} Replay run
        </button>
      </div>

      {nodeRuns.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-xs text-slate-400">No node-level records for this run.</p>
      ) : (
        <div className="space-y-2">
          {nodeRuns.map((n) => {
            const Icon = NODE_STATUS_ICON[n.status] ?? CircleDot
            return (
              <div key={n.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                <Icon className={`h-4 w-4 shrink-0 ${NODE_STATUS_TONE[n.status] ?? "text-slate-400"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-800">{n.node_type}</span>
                    {(n.status === "awaiting_approval" || n.status === "blocked") && <ShieldAlert className="h-3 w-3 text-rose-500" />}
                  </div>
                  {n.error && <p className="mt-0.5 text-[11px] text-rose-600">{n.error}</p>}
                </div>
                <span className="shrink-0 text-[10px] font-medium capitalize text-slate-400">{n.status.replace("_", " ")}</span>
              </div>
            )
          })}
        </div>
      )}

      {events.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Event log</h3>
          <div className="relative space-y-1 border-l border-slate-200 pl-4">
            {events.map((e) => (
              <div key={e.id} className="relative py-1">
                <span className={`absolute -left-[21px] top-2 h-2 w-2 rounded-full ${e.level === "error" ? "bg-rose-500" : e.level === "warn" ? "bg-amber-500" : "bg-slate-300"}`} />
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-slate-700"><span className="font-mono text-[10px] text-slate-400">{e.event_type}</span> {e.message}</span>
                  <span className="shrink-0 text-[10px] text-slate-400">{new Date(e.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">{toast}</div>}
    </div>
  )
}
