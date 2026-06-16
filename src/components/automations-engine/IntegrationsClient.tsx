"use client"

import React, { useEffect, useState } from "react"
import { Plug, Plus, CheckCircle2, AlertCircle, Loader2, Lock } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { loadIntegrations, saveIntegration } from "./api"

type Conn = { id: string; provider: string; name: string; status: string; hasSecret: boolean; last_used_at: string | null; created_at: string }
type Cat = { type: string; label: string; description: string; group: string; risk: string; plan: string }

const STATUS_TONE: Record<string, string> = {
  connected: "bg-emerald-50 text-emerald-700 border-emerald-200",
  disconnected: "bg-slate-100 text-slate-500 border-slate-200",
  error: "bg-rose-50 text-rose-700 border-rose-200",
  revoked: "bg-amber-50 text-amber-700 border-amber-200",
}

export default function IntegrationsClient() {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const [catalogue, setCatalogue] = useState<Cat[]>([])
  const [connections, setConnections] = useState<Conn[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function reload() {
    setLoading(true)
    loadIntegrations(workspaceId).then((r) => { if (r.ok) { setCatalogue(r.catalogue as unknown as Cat[]); setConnections(r.connections as unknown as Conn[]) } }).finally(() => setLoading(false))
  }
  useEffect(reload, [workspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  function flash(m: string) { setToast(m); setTimeout(() => setToast(null), 3000) }

  async function connect(c: Cat) {
    setBusy(c.type)
    try {
      const res = await saveIntegration({ workspaceId, provider: c.type, name: c.label, status: "disconnected" })
      flash(res.ok ? "Connection added (disconnected). Configure it to go live." : (res.error ?? "Couldn't add the connection."))
      reload()
    } finally { setBusy(null) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-cyan-200 bg-cyan-50/50 px-4 py-3">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />
        <p className="text-sm text-cyan-800"><span className="font-semibold">Secrets stay server-side.</span> Provider secrets are never returned to the browser. Integrations like Stripe Connect run under approval, provider, and audit gates.</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : (
        <>
          {connections.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">Your connections</h3>
              <div className="space-y-2">
                {connections.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-50 text-cyan-600"><Plug className="h-4 w-4" /></span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                        <p className="text-[11px] font-mono text-slate-400">{c.provider}</p>
                      </div>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_TONE[c.status] ?? STATUS_TONE.disconnected}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">Available integrations</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {catalogue.map((c) => (
                <div key={c.type} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600"><Plug className="h-4 w-4" /></span>
                    <span className="text-sm font-semibold text-slate-900">{c.label}</span>
                    <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{c.plan}</span>
                  </div>
                  <p className="mt-2 flex-1 text-xs text-slate-500">{c.description}</p>
                  <button onClick={() => connect(c)} disabled={busy === c.type} className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    {busy === c.type ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add connection
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">{toast}</div>}
    </div>
  )
}
