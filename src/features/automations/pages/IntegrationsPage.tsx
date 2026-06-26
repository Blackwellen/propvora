"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Activity,
  AlertCircle,
  Cable,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  KeyRound,
  LayoutGrid,
  List,
  Loader2,
  Lock,
  Plug,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  Unplug,
  Webhook,
  Zap,
} from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AutomationsKpiCard from "../components/AutomationsKpiCard"
import AutomationsDataTable, { type DataColumn } from "../components/AutomationsDataTable"
import { AutomationsStatusBadge } from "../components/AutomationsBadges"
import { Btn, Card, CardHeader, Modal, Toggle, useToast } from "../components/primitives"
import { Donut } from "../components/charts"
import { useAutomationIntegrations, useAutomationWebhooks } from "../data/hooks"
import {
  AVAILABLE_INTEGRATIONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type CatalogIntegration,
  type IntegrationCategory,
} from "../data/integrations-catalog"
import type { IntegrationRow, WebhookDelivery, WebhookEndpoint } from "../data/types"

// Use the live data type directly — avoids duplicate shape that drifts from the hook.
type ConnectedRow = IntegrationRow & { provider?: string }

const ENV_CLS: Record<string, string> = {
  Production: "bg-emerald-50 text-emerald-700",
  Staging: "bg-amber-50 text-amber-700",
  Development: "bg-blue-50 text-blue-700",
}

const EVENT_GROUPS = ["property.*", "tenancy.*", "compliance.*", "work.*", "finance.*", "contact.*", "automation.*"]
const ENVIRONMENTS = ["Production", "Staging", "Development"]

const SUBTABS = [
  "Overview",
  "Integrations",
  "Webhooks",
  "Connection Health",
  "Secrets",
  "Usage Analytics",
  "Audit Log",
] as const
type SubTab = (typeof SUBTABS)[number]

// ── Connection toast banner ─────────────────────────────────────────────────

function ConnectionBanner() {
  const params = useSearchParams()
  const toast = useToast()
  const router = useRouter()

  useEffect(() => {
    const provider = params?.get("integration")
    const connected = params?.get("connected")
    const error = params?.get("error")
    if (!provider) return

    if (connected === "1") {
      toast(`${provider.replace(/_/g, " ")} connected successfully`)
    } else if (error) {
      toast(`Failed to connect ${provider.replace(/_/g, " ")}: ${decodeURIComponent(error)}`)
    }
    const clean = new URL(window.location.href)
    clean.searchParams.delete("integration")
    clean.searchParams.delete("connected")
    clean.searchParams.delete("error")
    router.replace(clean.pathname + (clean.search || ""), { scroll: false })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

// ── API key connect modal ────────────────────────────────────────────────────

function ApiKeyModal({
  integration,
  onClose,
  onConnected,
}: {
  integration: CatalogIntegration
  onClose: () => void
  onConnected: () => void
}) {
  const toast = useToast()
  const [apiKey, setApiKey] = useState("")
  const [saving, setSaving] = useState(false)

  async function connect() {
    if (!apiKey.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId: integration.id, apiKey: apiKey.trim() }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || !data.success) throw new Error(data.error ?? "Connection failed")
      toast(`${integration.name} connected`)
      onConnected()
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Connection failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Connect ${integration.name}`}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={connect} disabled={!apiKey.trim() || saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Connecting…</> : "Connect"}
          </Btn>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <p className="text-slate-500">{integration.description}</p>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-600 mb-1.5">What this integration can do:</p>
          <ul className="space-y-1">
            {integration.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />{f}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            {integration.name} API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste your API key here"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none font-mono"
            autoComplete="off"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Your key is stored securely and only used to connect your account.
          </p>
        </div>

        {integration.docsUrl && (
          <a
            href={integration.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View {integration.name} developer docs
          </a>
        )}
      </div>
    </Modal>
  )
}

// ── Catalogue card ──────────────────────────────────────────────────────────

function CatalogCard({
  item,
  connected,
  onConnect,
  onDisconnect,
  onTest,
}: {
  item: CatalogIntegration
  connected: ConnectedRow | undefined
  onConnect: (item: CatalogIntegration) => void
  onDisconnect: (provider: string) => void
  onTest: (provider: string) => void
}) {
  const isConnected = !!connected && connected.health !== "disconnected"
  const isComingSoon = item.connectType === "coming_soon"

  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${item.logoGradient} text-xs font-bold text-white`}>
          {item.logoInitials}
        </div>
        {isConnected ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />Connected
          </span>
        ) : isComingSoon ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
            Coming soon
          </span>
        ) : null}
      </div>

      <h3 className="mt-2.5 text-sm font-semibold text-slate-900">{item.name}</h3>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-400 line-clamp-2">{item.description}</p>

      <div className="mt-auto pt-3 flex flex-wrap gap-1.5">
        {isConnected ? (
          <>
            <button
              onClick={() => onTest(item.id)}
              className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Test
            </button>
            <button
              onClick={() => onDisconnect(item.id)}
              className="flex-1 rounded-lg border border-red-100 px-2 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 transition"
            >
              Disconnect
            </button>
          </>
        ) : isComingSoon ? (
          <button disabled className="w-full rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-[11px] font-medium text-slate-400 cursor-not-allowed">
            Coming soon
          </button>
        ) : (
          <button
            onClick={() => onConnect(item)}
            className="w-full rounded-lg bg-blue-600 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700 transition"
          >
            {item.connectType === "oauth" ? "Connect with OAuth" : "Connect with API key"}
          </button>
        )}
      </div>
    </Card>
  )
}

// ── Webhooks inner content (no shell — embedded as sub-tab) ─────────────────

function WebhooksTabContent() {
  const toast = useToast()
  const { data, loading, reload } = useAutomationWebhooks()
  const [active, setActive] = useState<WebhookEndpoint | undefined>(data.endpoints[0])
  const [detailTab, setDetailTab] = useState<"overview" | "deliveries" | "attempts" | "logs">("overview")
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(data.endpoints.map((e) => [e.id, e.enabled])),
  )
  const [epPage, setEpPage] = useState(1)
  const [newEndpointOpen, setNewEndpointOpen] = useState(false)
  const [newEp, setNewEp] = useState({
    name: "", url: "", environment: "Production", eventGroups: [] as string[], secret: "",
  })
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [rotatingId, setRotatingId] = useState<string | null>(null)

  const endpointCols: DataColumn<WebhookEndpoint>[] = useMemo(
    () => [
      { key: "name", header: "Name", render: (r) => <div className="min-w-[160px]"><div className="font-medium text-slate-900">{r.name}</div><div className="text-xs text-slate-400">{r.slug}</div></div> },
      { key: "url", header: "Destination URL", render: (r) => <span className="font-mono text-xs text-slate-500">{r.url}</span> },
      { key: "groups", header: "Event groups", render: (r) => <div className="flex flex-wrap gap-1">{r.eventGroups.map((g) => <span key={g} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{g}</span>)}<span className="text-[10px] text-slate-400">+{r.eventCount}</span></div> },
      { key: "secret", header: "Signing secret", render: (r) => r.secretSet ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><Lock className="h-3 w-3" />Secured</span> : <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Lock className="h-3 w-3" />Not set</span> },
      { key: "env", header: "Environment", render: (r) => <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${ENV_CLS[r.environment]}`}>{r.environment}</span> },
      { key: "last", header: "Last delivery", render: (r) => <span className="text-slate-500">{r.lastDelivery}</span> },
      { key: "rate", header: "Success rate", render: (r) => <span className="inline-flex items-center gap-2"><span className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-emerald-500" style={{ width: `${r.successRate}%` }} /></span><span className="text-xs text-slate-600">{r.successRate}%</span></span> },
      { key: "enabled", header: "Enabled", render: (r) => <Toggle on={enabled[r.id] ?? r.enabled} onChange={(v) => { setEnabled((s) => ({ ...s, [r.id]: v })); toast(v ? `${r.name} enabled` : `${r.name} disabled`) }} /> },
    ],
    [enabled, toast],
  )

  const deliveryCols: DataColumn<WebhookDelivery>[] = useMemo(
    () => [
      { key: "event", header: "Event", render: (r) => <div><div className="font-medium text-slate-800">{r.event}</div><div className="text-xs text-slate-400">{r.eventId}</div></div> },
      { key: "endpoint", header: "Endpoint", render: (r) => <span className="text-slate-600">{r.endpoint} <span className="text-slate-400">· {r.environment}</span></span> },
      { key: "status", header: "Status", render: (r) => <AutomationsStatusBadge status={r.status} /> },
      { key: "at", header: "Delivered at", render: (r) => <span className="text-slate-500">{r.deliveredAt}</span> },
      { key: "resp", header: "Response", render: (r) => <span className={`font-mono text-xs ${r.response >= 400 ? "text-red-600" : "text-emerald-600"}`}>{r.response}</span> },
      { key: "latency", header: "Latency", render: (r) => <span className="text-slate-500">{r.latency}</span> },
      { key: "retries", header: "Retries", render: (r) => <span className="text-slate-600">{r.retries}</span> },
      { key: "menu", header: "", render: (r) => r.status === "failed" ? <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600">Failed</span> : <span className="text-slate-300">—</span> },
    ],
    [toast],
  )

  async function handleTestEvent() {
    if (!active) { toast("Select an endpoint to test"); return }
    setTestingId(active.id)
    try {
      const res = await fetch("/api/automations/outbound-webhooks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: active.id }),
      })
      const json = await res.json() as { ok: boolean; httpStatus?: number; responseMs?: number; error?: string }
      if (json.ok) {
        toast(`Test delivered to ${active.name} — HTTP ${json.httpStatus ?? "OK"} in ${json.responseMs ?? "?"}ms`)
      } else {
        toast(json.error ? `Test failed: ${json.error}` : `Test failed (HTTP ${json.httpStatus ?? "error"})`)
      }
      reload?.()
    } catch {
      toast("Test request failed — check your network")
    } finally {
      setTestingId(null)
    }
  }

  async function handleRotateSecret() {
    if (!active) { toast("Select an endpoint first"); return }
    setRotatingId(active.id)
    try {
      const res = await fetch("/api/automations/outbound-webhooks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: active.id, withSecret: true }),
      })
      if (!res.ok) throw new Error("Failed to rotate secret")
      toast("Secret rotated — copy the new secret from your webhook settings")
      reload?.()
    } catch {
      toast("Secret rotation failed")
    } finally {
      setRotatingId(null)
    }
  }

  async function handleCopy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast(`${label} copied to clipboard`)
    } catch {
      toast("Copy failed — please select and copy manually")
    }
  }

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AutomationsKpiCard label="Active endpoints" value={data.endpoints.filter((e) => e.enabled).length} icon={Webhook} tone="blue" />
        <AutomationsKpiCard label="Total endpoints" value={data.endpoints.length} icon={Activity} tone="emerald" />
        <AutomationsKpiCard label="Failed deliveries" value={data.deliveries.filter((d) => d.status === "failed").length} icon={Zap} tone="red" />
        <AutomationsKpiCard label="Recent deliveries" value={data.deliveries.length} icon={Clock} tone="violet" />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Btn
          icon={Send}
          disabled={!active || testingId === active?.id}
          onClick={handleTestEvent}
        >
          {testingId ? "Sending…" : "Test event"}
        </Btn>
        <Btn icon={Plus} variant="primary" onClick={() => setNewEndpointOpen(true)}>New endpoint</Btn>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Webhook endpoints" />
            {loading ? <div className="h-48 animate-pulse bg-slate-100" /> : (
              <AutomationsDataTable columns={endpointCols} rows={data.endpoints} selectable page={epPage} pageSize={5} total={data.endpoints.length} onPageChange={setEpPage} onRowClick={(r) => setActive(r)} activeRowId={active?.id} />
            )}
          </Card>
          <Card>
            <CardHeader title="Recent event deliveries" action={<button className="text-xs font-medium text-blue-600 hover:underline">View all deliveries →</button>} />
            <AutomationsDataTable columns={deliveryCols} rows={data.deliveries} selectable pageSize={5} total={data.deliveries.length} />
          </Card>
        </div>

        {/* Endpoint detail rail */}
        {active && (
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{active.name}</h3>
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${ENV_CLS[active.environment]}`}>{active.environment}</span>
              </div>
              <Toggle on={enabled[active.id] ?? active.enabled} onChange={(v) => { setEnabled((s) => ({ ...s, [active.id]: v })); toast(v ? "Enabled" : "Disabled") }} />
            </div>
            <div className="flex gap-1 border-b border-slate-100 px-3 py-2">
              {(["overview", "deliveries", "attempts", "logs"] as const).map((t) => (
                <button key={t} onClick={() => setDetailTab(t)} className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${detailTab === t ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50"}`}>
                  {t === "deliveries" ? "Recent deliveries" : t === "attempts" ? "Delivery attempts" : t}
                </button>
              ))}
            </div>
            <div className="space-y-4 p-4 text-sm">
              {detailTab === "overview" && (
                <>
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-slate-400">Destination URL</div>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="flex-1 truncate rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{active.url}</code>
                      <button onClick={() => handleCopy(active.url, "URL")} className="text-slate-400 hover:text-slate-700"><Copy className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-slate-400">Signing secret</div>
                    {active.secretSet ? (
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="flex-1 truncate rounded bg-slate-100 px-2 py-1 text-xs text-slate-400">••••••••••••••••••••</code>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Secret is set</span>
                          <button
                            disabled={rotatingId === active.id}
                            onClick={handleRotateSecret}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
                          >
                            <RefreshCw className={`h-3 w-3 ${rotatingId === active.id ? "animate-spin" : ""}`} />
                            {rotatingId === active.id ? "Rotating…" : "Rotate secret"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-400">
                        No signing secret set.
                        <button
                          disabled={rotatingId === active.id}
                          onClick={handleRotateSecret}
                          className="ml-2 font-semibold text-blue-600 hover:underline disabled:opacity-50"
                        >
                          {rotatingId === active.id ? "Generating…" : "Generate secret"}
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-semibold uppercase text-slate-400">Sample payload</div>
                      <button
                        onClick={() => handleCopy(JSON.stringify({ event: "property.updated", id: "evt_sample", workspace_id: "ws_xxx", timestamp: new Date().toISOString(), data: { property_id: "PR-0042" } }, null, 2), "Payload")}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="mt-1.5 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                      {JSON.stringify({ event: "property.updated", id: "evt_sample", workspace_id: "ws_xxx", timestamp: new Date().toISOString(), data: { property_id: "PR-0042" } }, null, 2)}
                    </pre>
                  </div>
                </>
              )}
              {detailTab !== "overview" && (
                <div className="space-y-1">
                  {data.deliveries.slice(0, 4).map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs">
                      <span className="text-slate-700">{d.event}</span>
                      <span className={d.response >= 400 ? "font-mono text-red-600" : "font-mono text-emerald-600"}>{d.response} OK</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* New endpoint modal */}
      <Modal
        open={newEndpointOpen}
        onClose={() => { setNewEndpointOpen(false); setNewEp({ name: "", url: "", environment: "Production", eventGroups: [], secret: "" }) }}
        title="New webhook endpoint"
        footer={
          <>
            <Btn variant="outline" onClick={() => setNewEndpointOpen(false)}>Cancel</Btn>
            <Btn
              variant="primary"
              disabled={saving || !newEp.name.trim() || !newEp.url.trim()}
              onClick={async () => {
                if (!newEp.url.startsWith("https://")) { toast("URL must start with https://"); return }
                setSaving(true)
                try {
                  const res = await fetch("/api/automations/outbound-webhooks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      url: newEp.url,
                      description: newEp.name,
                      event_types: newEp.eventGroups.length > 0 ? newEp.eventGroups : ["property.*"],
                      withSecret: newEp.secret.trim().length > 0,
                    }),
                  })
                  if (!res.ok) throw new Error("Failed to create endpoint")
                  toast(`Endpoint "${newEp.name}" created`)
                  setNewEndpointOpen(false)
                  setNewEp({ name: "", url: "", environment: "Production", eventGroups: [], secret: "" })
                  reload?.()
                } catch {
                  toast("Could not save endpoint — please try again")
                } finally {
                  setSaving(false)
                }
              }}
            >
              {saving ? "Saving…" : "Create endpoint"}
            </Btn>
          </>
        }
      >
        <div className="space-y-4 text-sm">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Endpoint name <span className="text-red-500">*</span></label>
            <input
              value={newEp.name}
              onChange={(e) => setNewEp((s) => ({ ...s, name: e.target.value }))}
              placeholder="e.g. Production webhook"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Destination URL <span className="text-red-500">*</span></label>
            <input
              value={newEp.url}
              onChange={(e) => setNewEp((s) => ({ ...s, url: e.target.value }))}
              placeholder="https://your-server.com/webhook"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-blue-400 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">Must be an HTTPS endpoint. POST requests with JSON payloads will be sent here.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Environment</label>
            <select
              value={newEp.environment}
              onChange={(e) => setNewEp((s) => ({ ...s, environment: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            >
              {ENVIRONMENTS.map((env) => <option key={env}>{env}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Event groups to subscribe</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {EVENT_GROUPS.map((g) => (
                <button
                  key={g}
                  onClick={() => setNewEp((s) => ({ ...s, eventGroups: s.eventGroups.includes(g) ? s.eventGroups.filter((x) => x !== g) : [...s.eventGroups, g] }))}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${newEp.eventGroups.includes(g) ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Signing secret <span className="text-slate-400">(optional)</span></label>
            <input
              value={newEp.secret}
              onChange={(e) => setNewEp((s) => ({ ...s, secret: e.target.value }))}
              type="password"
              placeholder="Leave blank to auto-generate"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const toast = useToast()
  const { data, loading, reload } = useAutomationIntegrations()
  const refresh = reload
  const [subtab, setSubtab] = useState<SubTab>("Overview")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string>("All categories")
  const [apiKeyModal, setApiKeyModal] = useState<CatalogIntegration | null>(null)
  const [testingProvider, setTestingProvider] = useState<string | null>(null)

  const connected: ConnectedRow[] = data.integrations

  function connectedFor(catalogId: string): ConnectedRow | undefined {
    return connected.find((c) => c.name.toLowerCase().includes(catalogId.toLowerCase()))
  }

  const filteredCatalog = AVAILABLE_INTEGRATIONS.filter((item) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === "All categories" || CATEGORY_LABELS[item.category as IntegrationCategory] === category
    return matchSearch && matchCat
  })

  const groupedCatalog = CATEGORY_ORDER.reduce<Record<string, CatalogIntegration[]>>((acc, cat) => {
    const items = filteredCatalog.filter((i) => i.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  async function handleConnect(item: CatalogIntegration) {
    if (item.connectType === "oauth" && item.oauthPath) {
      window.location.href = item.oauthPath
    } else if (item.connectType === "api_key") {
      setApiKeyModal(item)
    }
  }

  async function handleDisconnect(provider: string) {
    try {
      const res = await fetch("/api/integrations/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      })
      if (!res.ok) throw new Error("Disconnect failed")
      toast(`${provider} disconnected`)
      refresh?.()
    } catch {
      toast("Failed to disconnect")
    }
  }

  async function handleTest(provider: string) {
    setTestingProvider(provider)
    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      })
      const data = await res.json() as { ok: boolean; detail?: string }
      toast(data.ok ? `${provider}: ${data.detail ?? "Connection OK"}` : `${provider}: ${data.detail ?? "Connection failed"}`)
      refresh?.()
    } catch {
      toast("Test failed")
    } finally {
      setTestingProvider(null)
    }
  }

  const categories = ["All categories", ...CATEGORY_ORDER.map((c) => CATEGORY_LABELS[c])]

  const actions = (
    <>
      {subtab === "Integrations" && (
        <Btn icon={Plus} variant="primary" onClick={() => { setSearch("") }}>Add integration</Btn>
      )}
      {subtab === "Webhooks" && (
        <Btn icon={Webhook} variant="primary" onClick={() => setSubtab("Webhooks")}>Manage webhooks</Btn>
      )}
      {subtab === "Secrets" && (
        <Btn icon={KeyRound} onClick={() => toast("Secrets vault — available in Enterprise plan")}>Manage secrets</Btn>
      )}
    </>
  )

  return (
    <AutomationsModuleShell
      title="Integrations"
      subtitle="Connect third-party apps, manage outbound webhooks, and control credential secrets."
      icon={Cable}
      actions={actions}
    >
      <ConnectionBanner />

      {/* Sub-tab strip */}
      <div role="tablist" aria-label="Integrations sections" className="flex flex-wrap items-center gap-1 border-b border-slate-200">
        {SUBTABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={subtab === t}
            aria-controls={`integrations-panel-${t.toLowerCase().replace(/\s+/g, "-")}`}
            id={`integrations-tab-${t.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={() => setSubtab(t)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm transition ${subtab === t ? "border-blue-600 font-semibold text-blue-700" : "border-transparent font-medium text-slate-500 hover:text-slate-800"}`}
          >
            {t}
            {t === "Integrations" && connected.length > 0 && (
              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{connected.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {subtab === "Overview" && (
        <div className="mt-4 space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <AutomationsKpiCard label="Connected apps" value={connected.length} icon={Plug} tone="blue" />
            <AutomationsKpiCard label="Healthy connections" value={connected.filter((i) => i.health === "healthy").length} icon={CheckCircle2} tone="emerald" />
            <AutomationsKpiCard label="Available integrations" value={AVAILABLE_INTEGRATIONS.filter((i) => i.connectType !== "coming_soon").length} icon={Zap} tone="violet" />
            <AutomationsKpiCard label="Needs attention" value={connected.filter((i) => i.health === "error" || i.health === "warning").length} icon={AlertCircle} tone="amber" />
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Connected apps" action={<button onClick={() => setSubtab("Integrations")} className="text-xs font-medium text-blue-600 hover:underline">View all →</button>} />
              {connected.length === 0 ? (
                <div className="p-6 text-sm text-slate-400">
                  No integrations connected yet.{" "}
                  <button onClick={() => setSubtab("Integrations")} className="font-semibold text-blue-600 hover:underline">Browse catalogue →</button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {connected.slice(0, 5).map((it) => (
                    <div key={it.id} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-600">{it.name.slice(0, 2).toUpperCase()}</span>
                        <span className="text-sm font-medium text-slate-900">{it.name}</span>
                      </div>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${it.health === "healthy" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {it.health === "healthy" ? "Healthy" : "Warning"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card>
              <CardHeader title="Quick actions" />
              <div className="grid grid-cols-2 gap-2 p-4">
                {[
                  { label: "Browse integrations", icon: Plug, action: () => setSubtab("Integrations") },
                  { label: "Manage webhooks", icon: Webhook, action: () => setSubtab("Webhooks") },
                  { label: "Connection health", icon: CheckCircle2, action: () => setSubtab("Connection Health") },
                  { label: "Audit log", icon: Activity, action: () => setSubtab("Audit Log") },
                ].map(({ label, icon: Icon, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                    {label}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── Integrations catalogue ── */}
      {subtab === "Integrations" && (
        <div className="mt-4 space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <AutomationsKpiCard label="Connected apps" value={connected.length} icon={Plug} tone="blue" />
            <AutomationsKpiCard label="Healthy connections" value={connected.filter((i) => i.health === "healthy").length} icon={CheckCircle2} tone="emerald" />
            <AutomationsKpiCard label="Available integrations" value={AVAILABLE_INTEGRATIONS.filter((i) => i.connectType !== "coming_soon").length} icon={Zap} tone="violet" />
            <AutomationsKpiCard label="Needs attention" value={connected.filter((i) => i.health === "error" || i.health === "warning").length} icon={AlertCircle} tone="amber" />
          </div>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search integrations…"
                className="w-48 rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-blue-400 focus:outline-none"
            >
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <div className="ml-auto flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
              <button onClick={() => setView("grid")} className={`grid h-7 w-7 place-items-center rounded ${view === "grid" ? "bg-slate-100 text-slate-800" : "text-slate-400"}`}><LayoutGrid className="h-4 w-4" /></button>
              <button onClick={() => setView("list")} className={`grid h-7 w-7 place-items-center rounded ${view === "list" ? "bg-slate-100 text-slate-800" : "text-slate-400"}`}><List className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Grouped catalogue */}
          {Object.entries(groupedCatalog).length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <p className="text-sm text-slate-500">No integrations match your search.</p>
            </div>
          ) : (
            Object.entries(groupedCatalog).map(([cat, items]) => (
              <div key={cat}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {CATEGORY_LABELS[cat as IntegrationCategory]}
                </h3>
                <div className={`grid gap-3 ${view === "grid" ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
                  {items.map((item) => (
                    <CatalogCard
                      key={item.id}
                      item={item}
                      connected={connectedFor(item.id)}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                      onTest={handleTest}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Webhooks ── */}
      {subtab === "Webhooks" && (
        <div className="mt-4">
          <WebhooksTabContent />
        </div>
      )}

      {/* ── Connection Health ── */}
      {subtab === "Connection Health" && (
        <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {(() => {
            const healthy = connected.filter((i) => i.health === "healthy").length
            const warning = connected.filter((i) => i.health === "warning").length
            const error = connected.filter((i) => i.health === "error").length
            const disconnected = connected.filter((i) => i.health === "disconnected").length
            const total = connected.length
            return (
              <Card>
                <CardHeader title="Connection health overview" />
                <div className="flex items-center gap-6 p-5">
                  <Donut size={120} centerLabel={`${total}`} centerSub="total" slices={[
                    { label: "Healthy", value: healthy || 0, color: "#10b981" },
                    { label: "Warning", value: warning || 0, color: "#f59e0b" },
                    { label: "Error", value: error || 0, color: "#ef4444" },
                    { label: "Disconnected", value: disconnected || (total === 0 ? 1 : 0), color: "#cbd5e1" },
                  ]} />
                  <div className="space-y-2 text-sm">
                    {([["Healthy", healthy, "bg-emerald-500"], ["Warning", warning, "bg-amber-500"], ["Error", error, "bg-red-500"], ["Disconnected", disconnected, "bg-slate-300"]] as [string, number, string][]).map(([l, v, c]) => (
                      <div key={l} className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${c}`} />
                        <span className="text-slate-600">{l}</span>
                        <span className="ml-auto font-semibold text-slate-800">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )
          })()}
          <Card>
            <CardHeader title="Credential renewal alerts" />
            {connected.length === 0 ? (
              <div className="p-5 text-sm text-slate-400">No credential alerts — connect integrations first.</div>
            ) : (
              <div className="p-3 space-y-2">
                {connected.filter((c) => c.health !== "healthy").map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <span className="text-slate-700">{c.name}</span>
                    <button onClick={() => handleTest(c.id ?? c.name.toLowerCase())} className="text-xs font-medium text-blue-600 hover:underline">
                      Test connection
                    </button>
                  </div>
                ))}
                {connected.filter((c) => c.health !== "healthy").length === 0 && (
                  <div className="px-3 py-4 text-sm text-slate-400">All connections are healthy.</div>
                )}
              </div>
            )}
          </Card>
          {connected.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader title="All connections" action={<button onClick={() => refresh?.()} className="text-xs font-medium text-blue-600 hover:underline">Refresh</button>} />
              <div className="divide-y divide-slate-100">
                {connected.map((it) => (
                  <div key={it.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-600">{it.name.slice(0, 2).toUpperCase()}</span>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{it.name}</div>
                        <div className="text-xs text-slate-400">{it.category} · {it.environment} · Last sync {it.lastSync || "—"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${it.health === "healthy" ? "bg-emerald-50 text-emerald-700" : it.health === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                        {it.health === "healthy" ? "Healthy" : it.health === "error" ? "Error" : "Warning"}
                      </span>
                      <button onClick={() => handleTest(it.id ?? it.name.toLowerCase())} disabled={testingProvider === (it.id ?? it.name.toLowerCase())} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                        {testingProvider === (it.id ?? it.name.toLowerCase()) ? <Loader2 className="h-3 w-3 animate-spin" /> : "Test"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Secrets (V2 — Enterprise) ── */}
      {subtab === "Secrets" && (
        <div className="mt-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-500">
              <Shield className="h-7 w-7" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-900">Secrets vault</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Store API keys, tokens and credentials centrally with AES-256 encryption, automatic rotation reminders and per-integration access scoping. Available on the Enterprise plan.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">Enterprise</span>
              <a href="/property-manager/workspace/billing" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
                Upgrade plan <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3 text-left sm:grid-cols-3 max-w-xl mx-auto">
              {["AES-256 encryption at rest", "Automatic rotation reminders", "Per-integration access scoping"].map((f) => (
                <div key={f} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />{f}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Usage Analytics ── */}
      {subtab === "Usage Analytics" && (
        <div className="mt-4 space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <AutomationsKpiCard label="API calls this month" value={0} icon={Zap} tone="blue" />
            <AutomationsKpiCard label="Webhook deliveries" value={0} icon={Webhook} tone="violet" />
            <AutomationsKpiCard label="Failed requests" value={0} icon={AlertCircle} tone="red" />
            <AutomationsKpiCard label="Avg response time" value="—" icon={Clock} tone="slate" />
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Calls per integration" />
              <div className="p-6 text-sm text-slate-400">
                Per-integration API call counts appear here once your automations start using connected apps.
              </div>
            </Card>
            <Card>
              <CardHeader title="Error rate trend" />
              <div className="p-6 text-sm text-slate-400">
                Integration error rate over the last 30 days appears here once usage is recorded.
              </div>
            </Card>
          </div>
          <Card>
            <CardHeader title="Top integrations by volume" action={<span className="text-xs text-slate-400">Last 30 days</span>} />
            {connected.length === 0 ? (
              <div className="p-6 text-sm text-slate-400">Connect integrations to see usage analytics.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {connected.map((it) => (
                  <div key={it.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-600">{it.name.slice(0, 2).toUpperCase()}</span>
                      <span className="font-medium text-slate-900">{it.name}</span>
                    </div>
                    <span className="text-slate-500">0 calls</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Audit Log ── */}
      {subtab === "Audit Log" && (
        <div className="mt-4">
          <Card>
            <CardHeader title="Integration audit log" action={<button className="text-xs font-medium text-blue-600 hover:underline">Export CSV</button>} />
            <div className="p-6 text-center text-sm text-slate-400">
              Connect/disconnect events, credential changes, and test calls will appear here once integrations are active.
            </div>
          </Card>
        </div>
      )}

      {/* API key modal */}
      {apiKeyModal && (
        <ApiKeyModal
          integration={apiKeyModal}
          onClose={() => setApiKeyModal(null)}
          onConnected={() => refresh?.()}
        />
      )}
    </AutomationsModuleShell>
  )
}
