"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Webhook,
  Zap,
} from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AutomationsKpiCard from "../components/AutomationsKpiCard"
import { Btn, Card, CardHeader, Modal, Toggle, useToast } from "../components/primitives"
import { useWorkspace } from "@/providers/AuthProvider"

// ── Event types ───────────────────────────────────────────────────────────────
const WEBHOOK_EVENTS = [
  { id: "rent.received", label: "Rent received", description: "Triggered when a rent payment is confirmed" },
  { id: "job.created", label: "Job created", description: "Triggered when a maintenance job is raised" },
  { id: "job.completed", label: "Job completed", description: "Triggered when a maintenance job is marked complete" },
  { id: "tenancy.started", label: "Tenancy started", description: "Triggered on tenancy start date" },
  { id: "tenancy.ending", label: "Tenancy ending", description: "Triggered 30 days before tenancy end" },
  { id: "certificate.expiring", label: "Certificate expiring", description: "Triggered 60 days before a certificate expires" },
  { id: "payment.failed", label: "Payment failed", description: "Triggered when a rent payment fails" },
  { id: "booking.confirmed", label: "Booking confirmed", description: "Triggered when a stay booking is confirmed" },
]

// ── Types ────────────────────────────────────────────────────────────────────
interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
  status: "active" | "paused" | "error"
  last_delivery_at: string | null
  created_at: string
}

interface WebhookDelivery {
  id: string
  event_type: string
  response_code: number | null
  response_body: string | null
  latency_ms: number | null
  retry_count: number
  delivered_at: string
}

// ── Add Webhook Modal ─────────────────────────────────────────────────────────
function AddWebhookModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (secret: string) => void
}) {
  const toast = useToast()
  const { workspace } = useWorkspace()
  const [url, setUrl] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [urlError, setUrlError] = useState("")

  const toggleEvent = (id: string) => {
    setSelectedEvents((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const validateUrl = (val: string) => {
    if (!val) { setUrlError(""); return }
    if (!val.startsWith("https://")) {
      setUrlError("Webhook URL must use HTTPS.")
    } else {
      try { new URL(val); setUrlError("") } catch { setUrlError("Enter a valid URL.") }
    }
  }

  const handleSave = async () => {
    if (!url || urlError) { toast("Fix the URL first"); return }
    if (selectedEvents.size === 0) { toast("Select at least one event"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          events: Array.from(selectedEvents),
          workspaceId: workspace?.id,
        }),
      })
      const json = await res.json() as { ok?: boolean; secret?: string; error?: string }
      if (!res.ok || !json.ok) {
        toast(json.error ?? "Failed to create webhook")
      } else {
        onCreated(json.secret ?? "")
        onClose()
      }
    } catch {
      toast("Network error — try again")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add webhook endpoint"
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn
            onClick={handleSave}
            variant="primary"
            disabled={saving || !url || !!urlError || selectedEvents.size === 0}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Creating…" : "Create webhook"}
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">Destination URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); validateUrl(e.target.value) }}
            placeholder="https://your-server.com/webhook"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${urlError ? "border-red-300 focus:border-red-400 focus:ring-red-400/30" : "border-slate-200 focus:border-blue-400 focus:ring-blue-400/30"}`}
          />
          {urlError && <p className="mt-1 text-xs text-red-600">{urlError}</p>}
          <p className="mt-1 text-[11px] text-slate-400">Must be HTTPS. Propvora will POST JSON payloads to this URL.</p>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold text-slate-700">Events to subscribe to</label>
          <div className="space-y-1.5 rounded-lg border border-slate-200 p-3">
            {WEBHOOK_EVENTS.map((evt) => (
              <label key={evt.id} className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={selectedEvents.has(evt.id)}
                  onChange={() => toggleEvent(evt.id)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
                />
                <div>
                  <div className="text-xs font-medium text-slate-800">{evt.label}</div>
                  <div className="text-[11px] text-slate-400">{evt.description}</div>
                </div>
              </label>
            ))}
          </div>
          {selectedEvents.size === 0 && <p className="mt-1 text-xs text-amber-600">Select at least one event.</p>}
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
          <Lock className="mr-1.5 inline h-3.5 w-3.5 text-slate-400" />
          A signing secret will be generated and shown once when you create this webhook. Copy it — you will not see it again.
        </div>
      </div>
    </Modal>
  )
}

// ── Secret reveal modal (shown once after creation) ───────────────────────────
function SecretRevealModal({ secret, onClose }: { secret: string; onClose: () => void }) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    toast("Secret copied to clipboard")
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Webhook created — copy your secret"
      footer={<Btn variant="primary" onClick={onClose}>Done</Btn>}
    >
      <div className="space-y-3">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <AlertCircle className="mr-1.5 inline h-4 w-4" />
          This secret is shown <strong>once only</strong>. Copy it now and store it securely. You cannot retrieve it later.
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">Signing secret</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-800 font-mono">
              {secret}
            </code>
            <button
              onClick={copy}
              className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition ${copied ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Use this secret to verify incoming webhook payloads are from Propvora. Include it as the
          <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-[11px]">X-Propvora-Signature</code>
          header value.
        </p>
      </div>
    </Modal>
  )
}

// ── Delivery log row ──────────────────────────────────────────────────────────
function DeliveryRow({ delivery, onResend }: { delivery: WebhookDelivery; onResend: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const ok = delivery.response_code !== null && delivery.response_code >= 200 && delivery.response_code < 300
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <div className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-slate-50/60" onClick={() => setExpanded(!expanded)}>
        <span className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {delivery.response_code ?? "—"}
        </span>
        <span className="flex-1 text-xs text-slate-700">{delivery.event_type}</span>
        <span className="text-[11px] text-slate-400">{delivery.latency_ms != null ? `${delivery.latency_ms}ms` : "—"}</span>
        <span className="text-[11px] text-slate-400">
          {new Date(delivery.delivered_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
        </span>
        {!ok && (
          <button
            onClick={(e) => { e.stopPropagation(); onResend() }}
            className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-50"
          >
            Resend
          </button>
        )}
      </div>
      {expanded && delivery.response_body && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Response body</div>
          <pre className="mt-1.5 overflow-x-auto rounded-lg bg-white border border-slate-200 p-2 text-xs text-slate-700 max-h-32">
            {delivery.response_body}
          </pre>
        </div>
      )}
    </div>
  )
}

// ── Endpoint row ──────────────────────────────────────────────────────────────
function EndpointRow({
  endpoint,
  onToggle,
  onDelete,
  onTest,
  onViewDeliveries,
}: {
  endpoint: WebhookEndpoint
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
  onTest: (id: string) => void
  onViewDeliveries: (id: string) => void
}) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; code: number; ms: number } | null>(null)
  const toast = useToast()

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`/api/webhooks/${endpoint.id}/test`, { method: "POST" })
      const json = await res.json() as { ok?: boolean; responseCode?: number; latencyMs?: number; error?: string }
      if (json.ok) {
        setTestResult({ ok: true, code: json.responseCode ?? 200, ms: json.latencyMs ?? 0 })
        toast(`Test ping sent — ${json.responseCode} in ${json.latencyMs}ms`)
      } else {
        setTestResult({ ok: false, code: json.responseCode ?? 0, ms: json.latencyMs ?? 0 })
        toast(json.error ?? "Test failed")
      }
      onTest(endpoint.id)
    } catch {
      toast("Test request failed")
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <div className="flex flex-wrap items-start gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${endpoint.status === "active" ? "bg-emerald-500" : endpoint.status === "error" ? "bg-red-500" : "bg-slate-300"}`} />
            <code className="truncate text-xs text-slate-700 font-mono">{endpoint.url}</code>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {endpoint.events.map((e) => (
              <span key={e} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{e}</span>
            ))}
          </div>
          {endpoint.last_delivery_at && (
            <div className="mt-1 text-[11px] text-slate-400">
              Last delivery: {new Date(endpoint.last_delivery_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <Toggle on={endpoint.status === "active"} onChange={(v) => onToggle(endpoint.id, v)} label="Enable/disable" />
          <button
            onClick={handleTest}
            disabled={testing}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            {testing ? "Testing…" : "Test"}
          </button>
          {testResult && (
            <span className={`text-[10px] font-semibold ${testResult.ok ? "text-emerald-600" : "text-red-600"}`}>
              {testResult.ok ? `${testResult.code} OK` : `${testResult.code} failed`} · {testResult.ms}ms
            </span>
          )}
          <button onClick={() => onViewDeliveries(endpoint.id)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50">
            <Activity className="h-3 w-3" />Logs
          </button>
          <button onClick={() => onDelete(endpoint.id)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50">
            <Trash2 className="h-3 w-3" />Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WebhooksPage() {
  const toast = useToast()
  const { workspace } = useWorkspace()
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [revealSecret, setRevealSecret] = useState<string | null>(null)
  const [deliveriesEndpointId, setDeliveriesEndpointId] = useState<string | null>(null)
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])
  const [loadingDeliveries, setLoadingDeliveries] = useState(false)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const loadEndpoints = useCallback(async () => {
    setLoading(true)
    try {
      const qs = workspace?.id ? `?workspaceId=${workspace.id}` : ""
      const res = await fetch(`/api/webhooks${qs}`)
      const json = await res.json() as { ok?: boolean; endpoints?: WebhookEndpoint[] }
      setEndpoints(json.endpoints ?? [])
    } catch {
      setEndpoints([])
    } finally {
      setLoading(false)
    }
  }, [workspace?.id])

  useEffect(() => { void loadEndpoints() }, [loadEndpoints])

  const loadDeliveries = async (endpointId: string) => {
    setDeliveriesEndpointId(endpointId)
    setLoadingDeliveries(true)
    try {
      const res = await fetch(`/api/webhooks/${endpointId}/deliveries`)
      const json = await res.json() as { ok?: boolean; deliveries?: WebhookDelivery[] }
      setDeliveries(json.deliveries ?? [])
    } catch {
      setDeliveries([])
    } finally {
      setLoadingDeliveries(false)
    }
  }

  const handleToggle = async (id: string, active: boolean) => {
    // Optimistic update
    setEndpoints((prev) => prev.map((e) => e.id === id ? { ...e, status: active ? "active" : "paused" } : e))
    try {
      await fetch("/api/automations/webhooks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active, workspaceId: workspace?.id }),
      })
    } catch {
      // Revert on failure
      void loadEndpoints()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this webhook endpoint? This cannot be undone.")) return
    setEndpoints((prev) => prev.filter((e) => e.id !== id))
    try {
      await fetch("/api/webhooks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, workspaceId: workspace?.id }),
      })
      toast("Webhook deleted")
    } catch {
      toast("Failed to delete — please try again")
      void loadEndpoints()
    }
  }

  const handleResend = async (deliveryId: string) => {
    toast(`Resending delivery ${deliveryId}…`)
    // TODO: wire to a resend API when delivery resend endpoint is built
  }

  const activeCount = endpoints.filter((e) => e.status === "active").length
  const errorCount = endpoints.filter((e) => e.status === "error").length

  const actions = (
    <>
      <Btn icon={RefreshCw} onClick={loadEndpoints}>Refresh</Btn>
      <Btn icon={Plus} variant="primary" onClick={() => setShowAdd(true)}>New endpoint</Btn>
    </>
  )

  return (
    <AutomationsModuleShell
      title="Webhooks"
      subtitle="Real-time event notifications delivered to your systems via HTTP POST."
      icon={Webhook}
      actions={actions}
    >
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AutomationsKpiCard label="Total endpoints" value={loading ? "…" : endpoints.length} icon={Webhook} tone="blue" />
        <AutomationsKpiCard label="Active" value={loading ? "…" : activeCount} icon={CheckCircle2} tone="emerald" />
        <AutomationsKpiCard label="Errors" value={loading ? "…" : errorCount} icon={Zap} tone="red" />
        <AutomationsKpiCard label="Events" value={WEBHOOK_EVENTS.length} icon={Activity} tone="violet" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
        {/* Left: endpoint list */}
        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Webhook endpoints"
              action={
                <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                  <Plus className="h-3.5 w-3.5" />Add endpoint
                </button>
              }
            />
            {loading ? (
              <div className="space-y-px p-4">
                {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}
              </div>
            ) : endpoints.length === 0 ? (
              <div className="grid place-items-center py-14 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
                  <Webhook className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-slate-800">No webhook endpoints yet</h3>
                <p className="mt-1 text-sm text-slate-500">Add a webhook to receive real-time events in your systems.</p>
                <button onClick={() => setShowAdd(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
                  <Plus className="h-4 w-4" />Add your first webhook
                </button>
              </div>
            ) : (
              <div>
                {endpoints.map((ep) => (
                  <EndpointRow
                    key={ep.id}
                    endpoint={ep}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onTest={() => { /* handled inside EndpointRow */ }}
                    onViewDeliveries={loadDeliveries}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Delivery log for selected endpoint */}
          {deliveriesEndpointId && (
            <Card>
              <CardHeader
                title={`Delivery log — ${endpoints.find((e) => e.id === deliveriesEndpointId)?.url ?? "endpoint"}`}
                action={
                  <button onClick={() => setDeliveriesEndpointId(null)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
                }
              />
              {loadingDeliveries ? (
                <div className="space-y-1 p-4">
                  {[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />)}
                </div>
              ) : deliveries.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">No deliveries yet for this endpoint.</div>
              ) : (
                <div>
                  {deliveries.map((d) => (
                    <DeliveryRow key={d.id} delivery={d} onResend={() => handleResend(d.id)} />
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right: reference panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Supported events" />
            <div className="divide-y divide-slate-100">
              {WEBHOOK_EVENTS.map((evt) => (
                <div key={evt.id} className="px-4 py-2.5">
                  <div className="text-xs font-semibold text-slate-700">{evt.label}</div>
                  <code className="text-[10px] text-slate-400">{evt.id}</code>
                  <div className="text-[11px] text-slate-500">{evt.description}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Sample payload" />
            <div className="p-4">
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
{JSON.stringify({
  event: "rent.received",
  timestamp: "2026-06-21T10:30:00.000Z",
  workspaceId: "ws_abc123",
  data: {
    tenancy_id: "TEN-0042",
    amount: 1200,
    currency: "GBP",
    received_at: "2026-06-21T10:29:58.000Z",
  },
}, null, 2)}
              </pre>
            </div>
          </Card>

          <Card>
            <CardHeader title="Verification" />
            <div className="px-4 py-3 text-xs text-slate-600 space-y-2">
              <p>Each request includes an <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">X-Propvora-Signature</code> header.</p>
              <p>Verify it equals <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">SHA-256(secret)</code> to confirm the request is genuine.</p>
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="text-slate-500">Secrets are stored securely and shown only once at creation.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Add webhook modal */}
      {showAdd && (
        <AddWebhookModal
          onClose={() => setShowAdd(false)}
          onCreated={(secret) => {
            void loadEndpoints()
            if (secret) setRevealSecret(secret)
          }}
        />
      )}

      {/* Secret reveal modal (shown once) */}
      {revealSecret && (
        <SecretRevealModal secret={revealSecret} onClose={() => setRevealSecret(null)} />
      )}
    </AutomationsModuleShell>
  )
}
