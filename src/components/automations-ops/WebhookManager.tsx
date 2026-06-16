"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  Webhook, Plus, Power, Trash2, Copy, Check, KeyRound, ShieldCheck, X as XIcon,
  ChevronRight, Inbox, AlertCircle,
} from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { MobileCardList } from "@/components/mobile"
import {
  DeliveryStatusPill, relativeTime, absoluteTime, OpsEmptyState, OpsSkeleton, UpgradeNotice,
} from "./ui"

interface Endpoint {
  id: string
  name: string
  token: string
  has_secret: boolean
  active: boolean
  definition_id: string | null
  last_triggered_at: string | null
  created_at: string
}

interface Delivery {
  id: string
  received_at: string
  source_ip: string | null
  status: string
  run_id: string | null
  payload: Record<string, unknown>
}

function triggerUrl(token: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : ""
  return `${base}/api/automations/trigger/${token}`
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); setDone(true); window.setTimeout(() => setDone(false), 1800) } catch { /* clipboard blocked */ }
      }}
      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} {done ? "Copied" : label}
    </button>
  )
}

export default function WebhookManager() {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id

  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [upgrade, setUpgrade] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  // create form
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")
  const [withSecret, setWithSecret] = useState(true)
  const [creating, setCreating] = useState(false)
  // one-time reveal after create
  const [reveal, setReveal] = useState<{ url: string; secret: string | null } | null>(null)

  // deliveries drawer
  const [openEndpoint, setOpenEndpoint] = useState<Endpoint | null>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [deliveriesLoading, setDeliveriesLoading] = useState(false)

  async function load() {
    setLoading(true); setError(null); setUpgrade(null)
    try {
      const params = new URLSearchParams()
      if (workspaceId) params.set("workspaceId", workspaceId)
      const res = await fetch(`/api/automations/webhooks?${params.toString()}`, { cache: "no-store" })
      const json = await res.json()
      if (res.status === 402) { setUpgrade(json.error ?? "Automation isn't on your plan."); setEndpoints([]); return }
      if (!res.ok) { setError(json.error ?? "Couldn't load webhooks."); setEndpoints([]); return }
      setEndpoints(Array.isArray(json.endpoints) ? json.endpoints : [])
    } catch {
      setError("Couldn't load webhooks.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [workspaceId])

  async function create() {
    if (!name.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/automations/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, name: name.trim(), withSecret }),
      })
      const json = await res.json()
      if (res.status === 402) { setUpgrade(json.error ?? "Automation isn't on your plan."); return }
      if (!res.ok || !json.ok) { setError(json.error ?? "Couldn't create the webhook."); return }
      setReveal({ url: triggerUrl(json.endpoint.token), secret: json.secret ?? null })
      setShowCreate(false); setName(""); setWithSecret(true)
      await load()
    } catch {
      setError("Couldn't create the webhook.")
    } finally {
      setCreating(false)
    }
  }

  async function toggle(ep: Endpoint) {
    setBusy(ep.id)
    try {
      await fetch("/api/automations/webhooks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, id: ep.id, active: !ep.active }),
      })
      await load()
    } finally { setBusy(null) }
  }

  async function remove(ep: Endpoint) {
    setBusy(ep.id)
    try {
      await fetch("/api/automations/webhooks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, id: ep.id }),
      })
      if (openEndpoint?.id === ep.id) setOpenEndpoint(null)
      await load()
    } finally { setBusy(null) }
  }

  async function openDeliveries(ep: Endpoint) {
    setOpenEndpoint(ep)
    setDeliveriesLoading(true)
    setDeliveries([])
    try {
      const params = new URLSearchParams({ endpointId: ep.id })
      if (workspaceId) params.set("workspaceId", workspaceId)
      const res = await fetch(`/api/automations/webhooks?${params.toString()}`, { cache: "no-store" })
      const json = await res.json()
      setDeliveries(Array.isArray(json.deliveries) ? json.deliveries : [])
    } catch {
      setDeliveries([])
    } finally {
      setDeliveriesLoading(false)
    }
  }

  const activeCount = useMemo(() => endpoints.filter((e) => e.active).length, [endpoints])

  if (upgrade) return <UpgradeNotice message={upgrade} />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500">
          {endpoints.length} endpoint{endpoints.length === 1 ? "" : "s"} · {activeCount} active
        </div>
        <button
          onClick={() => { setShowCreate(true); setReveal(null) }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.30)] hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New webhook
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50/60 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* One-time reveal */}
      {reveal && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-800">Your webhook is ready</p>
              <p className="mt-0.5 text-xs text-emerald-700">
                Copy these now — the signing secret is shown ONCE and can never be retrieved again.
              </p>
              <div className="mt-3 space-y-2">
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase text-emerald-700">Receiver URL</div>
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2">
                    <code className="min-w-0 flex-1 truncate text-xs text-slate-700">{reveal.url}</code>
                    <CopyButton value={reveal.url} />
                  </div>
                </div>
                {reveal.secret && (
                  <div>
                    <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase text-emerald-700">
                      <KeyRound className="h-3 w-3" /> Signing secret (send as X-Propvora-Signature: sha256(secret))
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2">
                      <code className="min-w-0 flex-1 truncate text-xs text-slate-700">{reveal.secret}</code>
                      <CopyButton value={reveal.secret} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setReveal(null)} aria-label="Dismiss" className="grid h-7 w-7 place-items-center rounded-lg text-emerald-600 hover:bg-emerald-100"><XIcon className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">New inbound webhook</h3>
            <button onClick={() => setShowCreate(false)} aria-label="Cancel" className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><XIcon className="h-4 w-4" /></button>
          </div>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Zapier — new enquiry"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <label className="flex items-start gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={withSecret} onChange={(e) => setWithSecret(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600" />
              <span>Require a signing secret <span className="text-slate-400">(recommended — adds an HMAC-style check on top of the unguessable URL token)</span></span>
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={create} disabled={creating || !name.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {creating ? "Creating…" : "Create webhook"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <OpsSkeleton rows={3} />
      ) : endpoints.length === 0 ? (
        <OpsEmptyState
          icon={Webhook}
          title="No inbound webhooks yet"
          body="Create an endpoint to let external systems (Zapier, Make, your own apps) trigger an automation by calling a secure URL."
          action={
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> New webhook
            </button>
          }
        />
      ) : (
        <>
          {/* Desktop list */}
          <div className="hidden space-y-3 lg:block">
            {endpoints.map((ep) => (
              <EndpointRow key={ep.id} ep={ep} busy={busy} onToggle={toggle} onRemove={remove} onOpen={openDeliveries} />
            ))}
          </div>
          {/* Mobile cards */}
          <div className="lg:hidden">
            <MobileCardList
              rows={endpoints}
              mapping={{
                getKey: (ep) => ep.id,
                title: (ep) => <span className="font-semibold text-slate-900">{ep.name}</span>,
                subtitle: (ep) => <span className="text-xs text-slate-500">{ep.last_triggered_at ? `Last triggered ${relativeTime(ep.last_triggered_at)}` : "Never triggered"}</span>,
                badge: (ep) => (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${ep.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-500"}`}>
                    {ep.active ? "Active" : "Disabled"}
                  </span>
                ),
                onRowClick: (ep) => openDeliveries(ep),
                fields: [
                  { label: "Secret", render: (ep) => (ep.has_secret ? "Required" : "None") },
                  { label: "Created", render: (ep) => relativeTime(ep.created_at) },
                ],
                actions: (ep) => (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => toggle(ep)} disabled={busy === ep.id} className={`grid h-8 w-8 place-items-center rounded-lg border ${ep.active ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-slate-200 bg-white text-slate-400"}`}><Power className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(ep)} disabled={busy === ep.id} aria-label="Delete" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ),
              }}
            />
          </div>
        </>
      )}

      {/* Deliveries drawer */}
      {openEndpoint && (
        <DeliveriesPanel
          endpoint={openEndpoint}
          deliveries={deliveries}
          loading={deliveriesLoading}
          onClose={() => setOpenEndpoint(null)}
        />
      )}
    </div>
  )
}

function EndpointRow({ ep, busy, onToggle, onRemove, onOpen }: {
  ep: Endpoint; busy: string | null
  onToggle: (ep: Endpoint) => void; onRemove: (ep: Endpoint) => void; onOpen: (ep: Endpoint) => void
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${ep.active ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"}`}><Webhook className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-900">{ep.name}</span>
          {ep.has_secret && <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-600"><KeyRound className="h-3 w-3" /> Signed</span>}
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${ep.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-500"}`}>{ep.active ? "Active" : "Disabled"}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <code className="truncate rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px]">…/trigger/{ep.token.slice(0, 10)}…</code>
          <CopyButton value={triggerUrl(ep.token)} label="Copy URL" />
          <span className="text-slate-400">· {ep.last_triggered_at ? `last fired ${relativeTime(ep.last_triggered_at)}` : "never fired"}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button onClick={() => onOpen(ep)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"><Inbox className="h-3.5 w-3.5" /> Deliveries</button>
        <button onClick={() => onToggle(ep)} disabled={busy === ep.id} title={ep.active ? "Disable" : "Enable"} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${ep.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500"}`}><Power className="h-3.5 w-3.5" /> {ep.active ? "On" : "Off"}</button>
        <button onClick={() => onRemove(ep)} disabled={busy === ep.id} aria-label="Delete" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  )
}

function DeliveriesPanel({ endpoint, deliveries, loading, onClose }: {
  endpoint: Endpoint; deliveries: Delivery[]; loading: boolean; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Delivery history</h3>
            <p className="text-xs text-slate-500">{endpoint.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"><XIcon className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-auto p-5">
          {loading ? (
            <OpsSkeleton rows={4} />
          ) : deliveries.length === 0 ? (
            <OpsEmptyState icon={Inbox} title="No deliveries yet" body="When an external system calls this webhook's URL, every attempt is recorded here." />
          ) : (
            <div className="space-y-2">
              {deliveries.map((d) => (
                <div key={d.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <DeliveryStatusPill status={d.status} />
                    <span className="text-xs text-slate-400" title={absoluteTime(d.received_at)}>{relativeTime(d.received_at)}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    {d.source_ip && <span>from {d.source_ip}</span>}
                    {d.run_id && (
                      <a href={`/property-manager/automations/runs/${d.run_id}`} className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-700">
                        view run <ChevronRight className="h-3 w-3" />
                      </a>
                    )}
                    {!d.run_id && d.status !== "accepted" && (
                      <span className="inline-flex items-center gap-1 text-amber-600"><AlertCircle className="h-3 w-3" /> no run enqueued</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
