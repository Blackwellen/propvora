"use client"

import { useMemo, useState } from "react"
import { Activity, Clock, Copy, KeyRound, Lock, Plus, RefreshCw, Send, Webhook, Zap } from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AutomationsKpiCard from "../components/AutomationsKpiCard"
import AutomationsDataTable, { type DataColumn } from "../components/AutomationsDataTable"
import { AutomationsStatusBadge } from "../components/AutomationsBadges"
import { Btn, Card, CardHeader, Modal, Toggle, useToast } from "../components/primitives"
import { useAutomationWebhooks } from "../data/hooks"
import type { WebhookDelivery, WebhookEndpoint } from "../data/types"

const ENV_CLS: Record<string, string> = {
  Production: "bg-emerald-50 text-emerald-700",
  Staging: "bg-amber-50 text-amber-700",
  Development: "bg-[var(--brand-soft)] text-[var(--brand)]",
}

const EVENT_GROUPS = ["property.*", "tenancy.*", "compliance.*", "work.*", "finance.*", "contact.*", "automation.*"]
const ENVIRONMENTS = ["Production", "Staging", "Development"]

export default function WebhooksPage() {
  const toast = useToast()
  const { data, loading } = useAutomationWebhooks()
  const [active, setActive] = useState<WebhookEndpoint | undefined>(data.endpoints[0])
  const [detailTab, setDetailTab] = useState<"overview" | "deliveries" | "attempts" | "logs">("overview")
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(data.endpoints.map((e) => [e.id, e.enabled])))
  const [showSecret, setShowSecret] = useState(false)
  const [epPage, setEpPage] = useState(1)
  const [newEndpointOpen, setNewEndpointOpen] = useState(false)
  const [newEp, setNewEp] = useState({ name: "", url: "", environment: "Production", eventGroups: [] as string[], secret: "" })
  const [saving, setSaving] = useState(false)

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
      { key: "menu", header: "", render: (r) => r.status === "failed" ? <button onClick={() => toast(`Retrying ${r.event}…`)} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50">Retry</button> : <span className="text-slate-300">—</span> },
    ],
    [toast],
  )

  const actions = (
    <>
      <Btn onClick={() => toast("Opening docs")}>View docs</Btn>
      <Btn icon={KeyRound} onClick={() => toast("Secret generated")}>Generate secret</Btn>
      <Btn icon={Send} onClick={() => toast("Test event sent")}>Test event</Btn>
      <Btn icon={Plus} variant="primary" onClick={() => setNewEndpointOpen(true)}>New endpoint</Btn>
    </>
  )

  return (
    <AutomationsModuleShell
      title="Webhooks"
      subtitle="Real-time event notifications for your systems and integrations."
      icon={Webhook}
      actions={actions}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AutomationsKpiCard label="Active endpoints" value={data.endpoints.filter((e) => e.enabled).length} icon={Webhook} tone="blue" />
        <AutomationsKpiCard label="Total endpoints" value={data.endpoints.length} icon={Activity} tone="emerald" />
        <AutomationsKpiCard label="Failed deliveries" value={data.deliveries.filter((d) => d.status === "failed").length} icon={Zap} tone="red" />
        <AutomationsKpiCard label="Recent deliveries" value={data.deliveries.length} icon={Clock} tone="violet" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Webhook endpoints" />
            {loading ? <div className="h-48 animate-pulse bg-slate-100" /> : (
              <AutomationsDataTable columns={endpointCols} rows={data.endpoints} selectable page={epPage} pageSize={5} total={data.endpoints.length} onPageChange={setEpPage} onRowClick={(r) => setActive(r)} activeRowId={active?.id} />
            )}
          </Card>
          <Card>
            <CardHeader title="Recent event deliveries" action={<button className="text-xs font-medium text-[var(--brand)] hover:underline">View all deliveries →</button>} />
            <AutomationsDataTable columns={deliveryCols} rows={data.deliveries} selectable pageSize={5} total={data.deliveries.length} />
          </Card>
        </div>

        {/* Endpoint detail */}
        {active && (
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2"><h3 className="text-sm font-semibold text-slate-900">{active.name}</h3><span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${ENV_CLS[active.environment]}`}>{active.environment}</span></div>
              <Toggle on={enabled[active.id] ?? active.enabled} onChange={(v) => { setEnabled((s) => ({ ...s, [active.id]: v })); toast(v ? "Enabled" : "Disabled") }} />
            </div>
            <div className="flex gap-1 border-b border-slate-100 px-3 py-2">
              {(["overview", "deliveries", "attempts", "logs"] as const).map((t) => (
                <button key={t} onClick={() => setDetailTab(t)} className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${detailTab === t ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50"}`}>{t === "deliveries" ? "Recent deliveries" : t === "attempts" ? "Delivery attempts" : t}</button>
              ))}
            </div>
            <div className="space-y-4 p-4 text-sm">
              {detailTab === "overview" && (
                <>
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-slate-400">Destination URL</div>
                    <div className="mt-1 flex items-center gap-2"><code className="flex-1 truncate rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{active.url}</code><button onClick={() => toast("URL copied")} className="text-slate-400 hover:text-slate-700"><Copy className="h-4 w-4" /></button></div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-slate-400">Signing secret</div>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="flex-1 truncate rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{showSecret ? "whsec_8f2a91bc3de4" : "•••••••••••••••"}</code>
                      <button onClick={() => setShowSecret((v) => !v)} className="text-xs font-medium text-[var(--brand)]">{showSecret ? "Hide" : "Show"}</button>
                      <button onClick={() => toast("Secret copied")} className="text-slate-400 hover:text-slate-700"><Copy className="h-4 w-4" /></button>
                    </div>
                    <div className="mt-1 flex items-center justify-between"><span className="text-xs text-slate-400">Last rotated 12 days ago</span><button onClick={() => toast("Secret rotated")} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline"><RefreshCw className="h-3 w-3" />Rotate secret</button></div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between"><div className="text-[11px] font-semibold uppercase text-slate-400">Sample payload</div><button onClick={() => toast("Payload copied")} className="text-xs font-medium text-[var(--brand)]">Copy</button></div>
                    <pre className="mt-1.5 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify({ event: "property.updated", id: "evt_8821", data: { property_id: "PR-0042" } }, null, 2)}</pre>
                  </div>
                </>
              )}
              {detailTab !== "overview" && (
                <div className="space-y-1">
                  {data.deliveries.slice(0, 4).map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs"><span className="text-slate-700">{d.event}</span><span className={d.response >= 400 ? "font-mono text-red-600" : "font-mono text-emerald-600"}>{d.response} OK</span></div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
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
                  const res = await fetch("/api/automations/webhooks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newEp),
                  })
                  if (!res.ok) throw new Error("Failed to create endpoint")
                  toast(`Endpoint "${newEp.name}" created`)
                  setNewEndpointOpen(false)
                  setNewEp({ name: "", url: "", environment: "Production", eventGroups: [], secret: "" })
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[var(--color-brand-400)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Destination URL <span className="text-red-500">*</span></label>
            <input
              value={newEp.url}
              onChange={(e) => setNewEp((s) => ({ ...s, url: e.target.value }))}
              placeholder="https://your-server.com/webhook"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-[var(--color-brand-400)] focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">Must be an HTTPS endpoint. POST requests with JSON payloads will be sent here.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Environment</label>
            <select
              value={newEp.environment}
              onChange={(e) => setNewEp((s) => ({ ...s, environment: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[var(--color-brand-400)] focus:outline-none"
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
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${newEp.eventGroups.includes(g) ? "border-[var(--color-brand-100)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[var(--color-brand-400)] focus:outline-none"
            />
          </div>
        </div>
      </Modal>
    </AutomationsModuleShell>
  )
}
