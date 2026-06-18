"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  CheckCircle2,
  CreditCard,
  Database,
  Download,
  Gauge,
  Lock,
  ShieldCheck,
  Sliders,
  Users,
  Webhook,
  Zap,
} from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AutomationsKpiCard from "../components/AutomationsKpiCard"
import AutomationsDataTable, { type DataColumn } from "../components/AutomationsDataTable"
import { Btn, Card, CardHeader, Modal, useToast } from "../components/primitives"
import { BarList, Donut, MiniLine } from "../components/charts"
import { useAutomationUsageLimits } from "../data/hooks"
import { SEED_USAGE_BY_MODULE } from "../data/seed"
import type { PlanQuotaRow } from "../data/types"

const ADMIN_CARDS = [
  { id: "roles", title: "Role permissions", value: "8 roles", cta: "Manage roles", icon: Users },
  { id: "publish", title: "Publish permissions", value: "5 publishers", cta: "Manage publishers", icon: Lock },
  { id: "review", title: "Review-first policy", value: "Required · 100% coverage", cta: "Configure policy", icon: ShieldCheck },
  { id: "danger", title: "Dangerous action restrictions", value: "23 restricted · 2 exceptions", cta: "View restrictions", icon: Zap },
  { id: "env", title: "Environment controls", value: "3 environments · 7 rules", cta: "Manage environments", icon: Sliders },
  { id: "audit", title: "Audit retention", value: "180 days · 98.2 GB", cta: "Manage retention", icon: Database },
]

export default function UsageLimitsPage({ initialTab = "usage" }: { initialTab?: "usage" | "admin" }) {
  const toast = useToast()
  const { data, loading } = useAutomationUsageLimits()
  const [subtab, setSubtab] = useState<"usage" | "admin">(initialTab)
  const [modal, setModal] = useState<string | null>(null)

  useEffect(() => {
    if (initialTab === "admin") {
      const el = document.getElementById("admin-controls-section")
      el?.scrollIntoView({ behavior: "smooth" })
    }
  }, [initialTab])

  const quotaCols: DataColumn<PlanQuotaRow>[] = [
    { key: "name", header: "Plan / Workspace", render: (r) => <div><div className="font-medium text-slate-900">{r.name}</div><div className="text-xs text-slate-400">{r.plan}</div></div> },
    { key: "runs", header: "Runs/month", render: (r) => <span className="text-slate-600">{r.runs}{r.runsUsedPct ? <span className="text-slate-400"> ({r.runsUsedPct}% used)</span> : null}</span> },
    { key: "ai", header: "AI credits", render: (r) => <span className="text-slate-600">{r.aiCredits}</span> },
    { key: "webhooks", header: "Webhooks", render: (r) => <span className="text-slate-600">{r.webhooks}</span> },
    { key: "storage", header: "Storage (GB)", render: (r) => <span className="text-slate-600">{r.storage}</span> },
    { key: "active", header: "Active automations", render: (r) => <span className="text-slate-600">{r.activeAutomations}</span> },
    { key: "concurrent", header: "Concurrent runs", render: (r) => <span className="text-slate-600">{r.concurrentRuns}</span> },
    { key: "queue", header: "Approval queue", render: (r) => <span className="text-slate-600">{r.approvalQueue}</span> },
    { key: "status", header: "Status", render: (r) => <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${r.status === "Warning" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{r.status}</span> },
    { key: "actions", header: "Actions", render: () => <button onClick={() => setModal("quotas")} className="text-xs font-medium text-blue-600 hover:underline">Configure</button> },
  ]

  const actions = (
    <>
      <Btn icon={Sliders} onClick={() => setModal("limits")}>Edit limits</Btn>
      <Btn icon={CreditCard} onClick={() => toast("Opening billing")}>View billing</Btn>
      <Btn icon={Download} onClick={() => toast("Exporting usage…")}>Export usage</Btn>
      <Btn icon={Lock} onClick={() => setModal("policy")}>Policy controls</Btn>
    </>
  )

  return (
    <AutomationsModuleShell
      title="Usage & Limits"
      subtitle="Govern automation usage, enforce policies, and maintain operational guardrails."
      icon={Gauge}
      actions={actions}
    >
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button onClick={() => setSubtab("usage")} className={`border-b-2 px-3.5 py-2.5 text-sm transition ${subtab === "usage" ? "border-blue-600 font-semibold text-blue-700" : "border-transparent font-medium text-slate-500 hover:text-slate-800"}`}>Usage & Limits</button>
        <button onClick={() => setSubtab("admin")} className={`border-b-2 px-3.5 py-2.5 text-sm transition ${subtab === "admin" ? "border-blue-600 font-semibold text-blue-700" : "border-transparent font-medium text-slate-500 hover:text-slate-800"}`}>Admin Controls</button>
      </div>

      {/* KPI row */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <AutomationsKpiCard label="Total runs this month" value="14,382" trend="18.7%" sub="vs 12,121" icon={Activity} tone="blue"><MiniLine data={[10, 11, 12, 12, 13, 14]} color="#3b82f6" /></AutomationsKpiCard>
        <AutomationsKpiCard label="AI credits used" value="68,450" sub="/ 100,000" icon={Zap} tone="violet" progress={68.5} />
        <AutomationsKpiCard label="Webhook volume" value="1.62M" trend="12.5%" icon={Webhook} tone="emerald"><MiniLine data={[1.2, 1.3, 1.4, 1.5, 1.6, 1.62]} color="#10b981" /></AutomationsKpiCard>
        <AutomationsKpiCard label="Storage / log retention" value="412.6 GB" trend="9.3%" icon={Database} tone="amber" progress={41.3} />
        <AutomationsKpiCard label="Approval queue capacity" value="312 / 1,000" sub="31.2% utilised" icon={ShieldCheck} tone="slate" progress={31.2} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Usage trends" action={<span className="text-xs text-slate-400">Daily · Last 30 days</span>} />
              <div className="h-40 p-4"><MiniLine data={[8, 10, 9, 12, 11, 14, 13, 15, 14, 16]} color="#3b82f6" /></div>
            </Card>
            <Card>
              <CardHeader title="Usage by automation type" />
              <div className="flex items-center gap-4 p-4">
                <Donut size={130} centerLabel="14,382" centerSub="total" slices={[
                  { label: "Workflow", value: 42.6, color: "#3b82f6" },
                  { label: "AI", value: 25.3, color: "#7c3aed" },
                  { label: "Integration", value: 18.7, color: "#10b981" },
                  { label: "Scheduled", value: 9.8, color: "#f59e0b" },
                  { label: "Approval", value: 3.6, color: "#94a3b8" },
                ]} />
                <div className="space-y-1 text-xs">
                  {[["Workflow", "42.6%", "bg-blue-500"], ["AI", "25.3%", "bg-violet-500"], ["Integration", "18.7%", "bg-emerald-500"], ["Scheduled", "9.8%", "bg-amber-500"], ["Approval", "3.6%", "bg-slate-400"]].map(([l, v, c]) => (
                    <div key={l as string} className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${c}`} /><span className="text-slate-600">{l}</span><span className="ml-auto font-medium text-slate-800">{v}</span></div>
                  ))}
                </div>
              </div>
            </Card>
            <Card>
              <CardHeader title="Usage by module" />
              <div className="p-4"><BarList items={SEED_USAGE_BY_MODULE} color="bg-blue-500" /></div>
            </Card>
            <Card>
              <CardHeader title="Compliance posture" action={<button onClick={() => toast("Compliance details")} className="text-xs font-medium text-blue-600 hover:underline">View details</button>} />
              <div className="p-4 space-y-1.5 text-sm">
                {[["Review-first policy", "Enforced"], ["Dangerous actions", "Restricted"], ["Publish permissions", "Enforced"], ["Environment controls", "Compliant"], ["Audit logging", "Enabled"], ["Data retention", "Compliant"]].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5 text-slate-600"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{l}</span><span className="text-xs font-medium text-emerald-700">{v}</span></div>
                ))}
              </div>
            </Card>
          </div>

          {/* Admin controls */}
          <div id="admin-controls-section">
            <h2 className="text-sm font-semibold text-slate-900">Admin Controls</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ADMIN_CARDS.map((c) => (
                <Card key={c.id} className="p-4">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600"><c.icon className="h-4 w-4" /></span>
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">{c.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{c.value}</p>
                  <Btn variant="outline" className="mt-3" onClick={() => setModal(c.id)}>{c.cta}</Btn>
                </Card>
              ))}
            </div>
          </div>

          {/* Plan limits table */}
          <Card>
            <CardHeader title="Plan limits & workspace quotas" action={<button onClick={() => setModal("quotas")} className="text-xs font-medium text-blue-600 hover:underline">Configure quotas</button>} />
            {loading ? <div className="h-40 animate-pulse bg-slate-100" /> : (
              <AutomationsDataTable columns={quotaCols} rows={data.quotas} pageSize={3} total={3} />
            )}
          </Card>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Cost forecast" action={<button onClick={() => toast("Billing & usage")} className="text-xs font-medium text-blue-600 hover:underline">View billing</button>} />
            <div className="p-4">
              <div className="text-2xl font-semibold text-slate-900">$1,842.30 <span className="text-xs font-medium text-emerald-600">+14.6%</span></div>
              <div className="mt-1 text-xs text-slate-400">Estimated spend this cycle</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div><div className="font-semibold text-slate-800">$1,210</div><div className="text-slate-400">Actual</div></div>
                <div><div className="font-semibold text-slate-800">$2,500</div><div className="text-slate-400">Budget</div></div>
                <div><div className="font-semibold text-slate-800">$658</div><div className="text-slate-400">Remaining</div></div>
              </div>
              <div className="mt-3 h-16"><MiniLine data={[400, 700, 950, 1210, 1500, 1842]} color="#7c3aed" /></div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Top usage drivers" />
            <div className="p-3 space-y-1">
              {data.drivers.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                  <span className="text-slate-700">{d.name}</span>
                  <span className="text-xs text-slate-500">{d.runs.toLocaleString()} · {d.share}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title="Admin action"
        footer={<><Btn variant="outline" onClick={() => setModal(null)}>Cancel</Btn><Btn variant="primary" onClick={() => { setModal(null); toast("Saved (demo)") }}>Confirm</Btn></>}
      >
        This control is permission-gated to workspace admins. It connects to the governance and
        billing back-end to update {modal} settings.
      </Modal>
    </AutomationsModuleShell>
  )
}
