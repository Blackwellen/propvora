"use client"

import { useState } from "react"
import { AlertCircle, Cable, CheckCircle2, KeyRound, LayoutGrid, List, Plus, Plug, Zap } from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AutomationsKpiCard from "../components/AutomationsKpiCard"
import { Btn, Card, CardHeader, useToast } from "../components/primitives"
import { BarList, Donut } from "../components/charts"
import { useAutomationIntegrations } from "../data/hooks"

const SUBTABS = ["Overview", "Integrations", "Webhooks", "Connection health", "Secrets", "Usage analytics", "Audit log"]

export default function IntegrationsPage() {
  const toast = useToast()
  const { data, loading } = useAutomationIntegrations()
  const [subtab, setSubtab] = useState("Integrations")
  const [view, setView] = useState<"grid" | "list">("grid")

  const integrations = data.integrations
  const alerts = data.credentialAlerts

  const actions = (
    <>
      <Btn icon={Plus} variant="primary" onClick={() => toast("Add integration — opens connect flow")}>Add integration</Btn>
      <Btn onClick={() => toast("Testing connections…")}>Test connection</Btn>
      <Btn onClick={() => toast("Opening docs")}>View docs</Btn>
      <Btn icon={KeyRound} onClick={() => toast("Manage secrets")}>Manage secrets</Btn>
    </>
  )

  return (
    <AutomationsModuleShell
      title="Integrations"
      subtitle="Connect and manage third-party apps and services that power your automations."
      icon={Cable}
      actions={actions}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AutomationsKpiCard label="Connected apps" value={22} trend="10%" icon={Plug} tone="blue" />
        <AutomationsKpiCard label="Healthy connections" value={20} trend="5%" sub="90.9%" icon={CheckCircle2} tone="emerald" />
        <AutomationsKpiCard label="Expiring credentials" value={3} trend="25%" trendDir="down" icon={KeyRound} tone="amber" />
        <AutomationsKpiCard label="Webhook-capable" value={14} trend="8%" icon={Zap} tone="violet" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1 border-b border-slate-200">
        {SUBTABS.map((t) => (
          <button key={t} onClick={() => setSubtab(t)} className={`border-b-2 px-3 py-2.5 text-sm transition ${subtab === t ? "border-blue-600 font-semibold text-blue-700" : "border-transparent font-medium text-slate-500 hover:text-slate-800"}`}>{t}</button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input placeholder="Search…" className="w-44 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30" />
        {["All categories", "All status", "All environments"].map((f) => <span key={f} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">{f}</span>)}
        <button onClick={() => toast("Filters cleared")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Clear filters</button>
        <div className="ml-auto flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
          <button onClick={() => setView("grid")} className={`grid h-7 w-7 place-items-center rounded ${view === "grid" ? "bg-slate-100 text-slate-800" : "text-slate-400"}`}><LayoutGrid className="h-4 w-4" /></button>
          <button onClick={() => setView("list")} className={`grid h-7 w-7 place-items-center rounded ${view === "list" ? "bg-slate-100 text-slate-800" : "text-slate-400"}`}><List className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : (
        <div className={`mt-4 grid gap-3 ${view === "grid" ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-5" : "grid-cols-1"}`}>
          {integrations.map((it) => (
            <Card key={it.id} className="flex flex-col p-3.5">
              <div className="flex items-start justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">{it.name.slice(0, 2)}</span>
                <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${it.health === "healthy" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {it.health === "healthy" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}{it.health === "healthy" ? "Healthy" : "Warning"}
                </span>
              </div>
              <h3 className="mt-2.5 text-sm font-semibold text-slate-900">{it.name}</h3>
              <div className="text-[11px] text-slate-400">{it.category}</div>
              <div className="mt-2 space-y-0.5 text-[11px] text-slate-500">
                <div>{it.environment}</div>
                <div>Last sync {it.lastSync}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button onClick={() => toast(`Configure ${it.name}`)} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50">Configure</button>
                <button onClick={() => toast(`Testing ${it.name}…`)} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50">Test</button>
                <button onClick={() => toast(`${it.name} logs`)} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50">Logs</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Bottom 3 panels */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Connection health" />
          <div className="flex items-center gap-4 p-4">
            <Donut size={120} centerLabel="22" centerSub="total" slices={[
              { label: "Healthy", value: 20, color: "#10b981" },
              { label: "Warning", value: 1, color: "#f59e0b" },
              { label: "Error", value: 1, color: "#ef4444" },
            ]} />
            <div className="space-y-1 text-xs">
              {[["Healthy", 20, "bg-emerald-500"], ["Warning", 1, "bg-amber-500"], ["Error", 1, "bg-red-500"], ["Disconnected", 0, "bg-slate-300"]].map(([l, v, c]) => (
                <div key={l as string} className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${c}`} /><span className="text-slate-600">{l}</span><span className="ml-auto font-medium text-slate-800">{v}</span></div>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Credential renewal alerts" />
          <div className="p-3 space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span className="text-slate-700">{a.name} {a.credential}</span>
                <span className={`text-xs font-medium ${a.tone === "warning" ? "text-amber-600" : "text-emerald-600"}`}>{a.daysLeft} days {a.tone === "warning" ? "· Expiring soon" : "· OK"}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Usage by integration" />
          <div className="p-4">
            <BarList items={integrations.filter((i) => i.executions).map((i) => ({ label: i.name, value: i.executions!, sub: `${i.executions!.toLocaleString()} · ${i.successRate}%` }))} color="bg-violet-500" />
          </div>
        </Card>
      </div>
    </AutomationsModuleShell>
  )
}
