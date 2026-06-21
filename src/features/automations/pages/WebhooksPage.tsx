"use client"

// Outbound Webhooks management — Propvora → external systems.
// CRUD wired to /api/automations/outbound-webhooks.
// Falls back to useful empty state when no webhooks exist.

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Activity, AlertCircle, Check, CheckCircle2, Clock, Copy, ExternalLink,
  KeyRound, Loader2, Lock, Plus, RefreshCw, Send, Trash2, Webhook, X, Zap
} from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AutomationsKpiCard from "../components/AutomationsKpiCard"
import { Btn, Card, CardHeader, Modal, Toggle, useToast } from "../components/primitives"
import { useWorkspace } from "@/providers/AuthProvider"

// ── Types ─────────────────────────────────────────────────────────────────────

interface OutboundWebhook {
  id: string
  url: string
  description: string | null
  event_types: string[]
  enabled: boolean
  last_triggered_at: string | null
  created_at: string
}

interface WebhookLog {
  id: string
  event_type: string | null
  http_status: number | null
  response_ms: number | null
  delivered_at: string
  error_msg: string | null
}

// The 45 + 17 trigger/action slugs from the catalogue — offered as event type options
const ALL_EVENT_TYPES = [
  "compliance_due_soon", "compliance_overdue", "tenancy_ending", "rent_overdue",
  "planning_offer_sent", "planning_offer_expiring", "job_completed", "licence_expiring",
  "tenancy_started", "tenancy_expired", "lease_renewal_approaching", "move_out_approaching",
  "void_period_started", "void_period_long", "rent_due_soon", "rent_payment_received",
  "payment_failed", "arrears_threshold_reached", "maintenance_request_submitted",
  "maintenance_request_overdue", "job_overdue", "quote_received", "quote_expiring",
  "invoice_overdue", "inspection_due", "inspection_overdue", "contractor_not_reviewed",
  "gas_cert_expiring", "eicr_expiring", "epc_expiring", "right_to_rent_due",
  "insurance_expiring", "deposit_unprotected", "deposit_return_overdue",
  "portal_message_unanswered", "complaint_received", "document_expiring",
  "property_added", "unit_vacant", "hmo_room_vacant", "booking_checkin_tomorrow",
  "booking_checkout_today", "booking_cancelled", "viewing_not_booked",
  "offer_accepted", "referencing_overdue",
]

// ── Add Webhook Modal ─────────────────────────────────────────────────────────

function AddWebhookModal({
  workspaceId,
  onClose,
  onCreated,
}: {
  workspaceId: string
  onClose: () => void
  onCreated: (w: OutboundWebhook) => void
}) {
  const toast = useToast()
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [withSecret, setWithSecret] = useState(true)
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["rent_overdue", "compliance_due_soon"])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null)

  function toggleEvent(slug: string) {
    setSelectedEvents((prev) =>
      prev.includes(slug) ? prev.filter((e) => e !== slug) : [...prev, slug]
    )
  }

  async function handleSubmit() {
    setError(null)
    if (!url.startsWith("https://")) {
      setError("Webhook URL must start with https://")
      return
    }
    if (selectedEvents.length === 0) {
      setError("Select at least one event type.")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/automations/outbound-webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, url, description, event_types: selectedEvents, withSecret }),
      })
      const json = await res.json() as { ok?: boolean; webhook?: OutboundWebhook; secret?: string; error?: string }
      if (!json.ok || !json.webhook) throw new Error(json.error ?? "Failed to create webhook.")
      if (json.secret) {
        setRevealedSecret(json.secret)
      } else {
        toast("Webhook created")
        onCreated(json.webhook)
        onClose()
      }
      if (json.webhook) onCreated(json.webhook)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.")
    } finally {
      setSaving(false)
    }
  }

  if (revealedSecret) {
    return (
      <Modal open onClose={onClose} title="Webhook secret — copy now">
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <strong>Copy this secret now.</strong> It will not be shown again. Use it to verify webhook
            deliveries by including it in the <code>X-Propvora-Token</code> header.
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-emerald-300 break-all">{revealedSecret}</code>
            <button
              onClick={() => { void navigator.clipboard.writeText(revealedSecret); toast("Secret copied") }}
              className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <Btn variant="primary" className="w-full justify-center" onClick={onClose} icon={Check}>
            Done — I&apos;ve copied the secret
          </Btn>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add webhook"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Creating…" : "Create webhook"}
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Endpoint URL (HTTPS required)</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-server.com/webhook"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Zapier compliance alerts"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">
            Event types <span className="text-slate-400">({selectedEvents.length} selected)</span>
          </label>
          <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-slate-200 p-3">
            {ALL_EVENT_TYPES.map((slug) => (
              <button
                key={slug}
                type="button"
                onClick={() => toggleEvent(slug)}
                className={[
                  "rounded-md px-2 py-1 text-[11px] font-medium transition",
                  selectedEvents.includes(slug)
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                ].join(" ")}
              >
                {slug.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
          <div>
            <div className="text-xs font-semibold text-slate-700">Generate signing secret</div>
            <div className="text-[11px] text-slate-400">Authenticate deliveries with a token. Shown once.</div>
          </div>
          <Toggle on={withSecret} onChange={setWithSecret} />
        </div>
      </div>
    </Modal>
  )
}

// ── Webhook row ───────────────────────────────────────────────────────────────

function WebhookRow({
  webhook,
  active,
  onClick,
  onToggle,
  onDelete,
  onTest,
}: {
  webhook: OutboundWebhook
  active: boolean
  onClick: () => void
  onToggle: (enabled: boolean) => void
  onDelete: () => void
  onTest: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={[
        "cursor-pointer rounded-xl border p-3 transition",
        active ? "border-blue-300 bg-blue-50/40" : "border-slate-200 bg-white hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Webhook className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="font-mono text-xs text-slate-700 truncate">{webhook.url}</span>
          </div>
          {webhook.description && (
            <div className="mt-0.5 text-[11px] text-slate-500">{webhook.description}</div>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {webhook.event_types.slice(0, 4).map((e) => (
              <span key={e} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                {e.replace(/_/g, " ")}
              </span>
            ))}
            {webhook.event_types.length > 4 && (
              <span className="text-[10px] text-slate-400">+{webhook.event_types.length - 4} more</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onTest() }}
            title="Send test event"
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 transition"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            title="Delete webhook"
            className="rounded-lg border border-red-100 p-1.5 text-red-400 hover:bg-red-50 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <Toggle
            on={webhook.enabled}
            onChange={(v) => { onToggle(v) }}
          />
        </div>
      </div>
      {webhook.last_triggered_at && (
        <div className="mt-1.5 text-[10px] text-slate-400">
          Last triggered {new Date(webhook.last_triggered_at).toLocaleString("en-GB")}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WebhooksPage() {
  const toast = useToast()
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id ?? ""

  const [webhooks, setWebhooks] = useState<OutboundWebhook[]>([])
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)

  const activeWebhook = useMemo(() => webhooks.find((w) => w.id === activeId) ?? null, [webhooks, activeId])

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/automations/outbound-webhooks?workspaceId=${workspaceId}`)
      const json = await res.json() as { ok?: boolean; webhooks?: OutboundWebhook[] }
      if (json.ok && json.webhooks) {
        setWebhooks(json.webhooks)
        if (json.webhooks.length > 0 && !activeId) setActiveId(json.webhooks[0].id)
      }
    } catch {
      // 42P01-safe: table may not exist yet
    } finally {
      setLoading(false)
    }
  }, [workspaceId, activeId])

  const loadLogs = useCallback(async (webhookId: string) => {
    if (!workspaceId) return
    try {
      const res = await fetch(`/api/automations/outbound-webhooks?workspaceId=${workspaceId}&webhookId=${webhookId}`)
      const json = await res.json() as { ok?: boolean; logs?: WebhookLog[] }
      if (json.ok && json.logs) setLogs(json.logs)
    } catch {/* non-fatal */}
  }, [workspaceId])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (activeId) void loadLogs(activeId)
  }, [activeId, loadLogs])

  async function handleToggle(id: string, enabled: boolean) {
    setWebhooks((prev) => prev.map((w) => w.id === id ? { ...w, enabled } : w))
    try {
      const res = await fetch("/api/automations/outbound-webhooks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, id, enabled }),
      })
      const json = await res.json() as { ok?: boolean; error?: string }
      if (!json.ok) throw new Error(json.error)
      toast(enabled ? "Webhook enabled" : "Webhook disabled")
    } catch {
      // Revert
      setWebhooks((prev) => prev.map((w) => w.id === id ? { ...w, enabled: !enabled } : w))
      toast("Failed to update webhook")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this webhook? This cannot be undone.")) return
    try {
      const res = await fetch("/api/automations/outbound-webhooks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, id }),
      })
      const json = await res.json() as { ok?: boolean; error?: string }
      if (!json.ok) throw new Error(json.error)
      setWebhooks((prev) => prev.filter((w) => w.id !== id))
      if (activeId === id) setActiveId(webhooks.find((w) => w.id !== id)?.id ?? null)
      toast("Webhook deleted")
    } catch {
      toast("Failed to delete webhook")
    }
  }

  async function handleTest(id: string) {
    setTesting(id)
    try {
      const res = await fetch("/api/automations/outbound-webhooks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, id }),
      })
      const json = await res.json() as { ok?: boolean; httpStatus?: number; responseMs?: number; error?: string }
      if (json.ok) {
        toast(`Test sent — ${json.httpStatus ?? "?"} in ${json.responseMs ?? "?"}ms`)
      } else {
        toast(`Test failed: ${json.error ?? `HTTP ${json.httpStatus}`}`)
      }
      // Refresh logs
      void loadLogs(id)
    } catch {
      toast("Test delivery failed")
    } finally {
      setTesting(null)
    }
  }

  const activeCount = webhooks.filter((w) => w.enabled).length
  const totalCount = webhooks.length

  const actions = (
    <>
      <Btn icon={Plus} variant="primary" onClick={() => setShowAdd(true)}>Add webhook</Btn>
      <a
        href="https://docs.propvora.com/automations/webhooks"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
      >
        <ExternalLink className="h-4 w-4" /> Docs
      </a>
    </>
  )

  return (
    <AutomationsModuleShell
      title="Webhooks"
      subtitle="Send real-time event notifications to your external systems and integrations."
      icon={Webhook}
      actions={actions}
    >
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AutomationsKpiCard label="Total webhooks" value={totalCount} icon={Webhook} tone="blue" />
        <AutomationsKpiCard label="Active webhooks" value={activeCount} icon={CheckCircle2} tone="emerald" />
        <AutomationsKpiCard label="Event types covered" value={webhooks.reduce((n, w) => n + w.event_types.length, 0)} icon={Zap} tone="violet" />
        <AutomationsKpiCard label="Recent deliveries" value={logs.length} icon={Activity} tone="slate" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
        {/* Webhook list */}
        <Card>
          <CardHeader
            title={`Webhook endpoints (${totalCount})`}
            action={
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add webhook
              </button>
            }
          />

          {loading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : webhooks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100">
                <Webhook className="h-6 w-6 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">No webhooks yet</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Add a webhook to receive real-time event notifications in your systems.
                </p>
              </div>
              <Btn icon={Plus} variant="primary" onClick={() => setShowAdd(true)}>Add first webhook</Btn>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {webhooks.map((w) => (
                <WebhookRow
                  key={w.id}
                  webhook={w}
                  active={w.id === activeId}
                  onClick={() => setActiveId(w.id)}
                  onToggle={(enabled) => void handleToggle(w.id, enabled)}
                  onDelete={() => void handleDelete(w.id)}
                  onTest={() => void handleTest(w.id)}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Detail panel */}
        {activeWebhook ? (
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 truncate max-w-[180px]">{activeWebhook.url}</h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${activeWebhook.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {activeWebhook.enabled ? "Active" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => void handleTest(activeWebhook.id)}
                  disabled={testing === activeWebhook.id}
                  title="Send test event"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
                >
                  {testing === activeWebhook.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Send className="h-3.5 w-3.5" />
                  }
                  Test
                </button>
              </div>
            </div>

            <div className="space-y-4 p-4 text-sm">
              {/* URL */}
              <div>
                <div className="text-[11px] font-semibold uppercase text-slate-400">Endpoint URL</div>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{activeWebhook.url}</code>
                  <button
                    onClick={() => { void navigator.clipboard.writeText(activeWebhook.url); toast("URL copied") }}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Description */}
              {activeWebhook.description && (
                <div>
                  <div className="text-[11px] font-semibold uppercase text-slate-400">Description</div>
                  <p className="mt-1 text-slate-600">{activeWebhook.description}</p>
                </div>
              )}

              {/* Event types */}
              <div>
                <div className="text-[11px] font-semibold uppercase text-slate-400">
                  Event types ({activeWebhook.event_types.length})
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {activeWebhook.event_types.map((e) => (
                    <span key={e} className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                      {e.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>

              {/* Signing secret notice */}
              <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <div>
                  <div className="text-[11px] font-semibold text-slate-600">Signing secret</div>
                  <div className="text-[11px] text-slate-400">
                    Secret tokens are shown once at creation. To rotate, delete and re-create the webhook.
                  </div>
                </div>
              </div>

              {/* Delivery log */}
              <div>
                <div className="text-[11px] font-semibold uppercase text-slate-400">Last 20 deliveries</div>
                {logs.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">No deliveries yet. Send a test event to verify connectivity.</p>
                ) : (
                  <div className="mt-1.5 space-y-1">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs">
                        <span className="text-slate-600 truncate mr-2">{log.event_type ?? "—"}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {log.error_msg ? (
                            <span className="text-red-600 font-mono">{log.http_status ?? "ERR"}</span>
                          ) : (
                            <span className={`font-mono ${(log.http_status ?? 0) >= 400 ? "text-red-600" : "text-emerald-600"}`}>
                              {log.http_status ?? "?"}
                            </span>
                          )}
                          {log.response_ms != null && (
                            <span className="text-slate-400">{log.response_ms}ms</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 text-center p-4">
              <Webhook className="h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm text-slate-400">Select a webhook to see details and delivery logs</p>
            </div>
          </Card>
        )}
      </div>

      {/* Sample payload reference */}
      {webhooks.length > 0 && (
        <Card className="mt-5">
          <CardHeader title="Sample payload" />
          <div className="p-4">
            <p className="text-xs text-slate-500 mb-2">Every delivery POSTs JSON to your endpoint URL. Structure:</p>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
              {JSON.stringify({
                event: "rent_overdue",
                id: "evt_01JXYZABC",
                workspace_id: "ws_your_workspace",
                timestamp: new Date().toISOString(),
                data: {
                  record_id: "rec_0042",
                  summary: "Rent overdue — 14 Maple Street",
                  days_overdue: 5,
                },
              }, null, 2)}
            </pre>
          </div>
        </Card>
      )}

      {showAdd && (
        <AddWebhookModal
          workspaceId={workspaceId}
          onClose={() => setShowAdd(false)}
          onCreated={(w) => {
            setWebhooks((prev) => [w, ...prev])
            setActiveId(w.id)
            setShowAdd(false)
            toast("Webhook created")
          }}
        />
      )}
    </AutomationsModuleShell>
  )
}
