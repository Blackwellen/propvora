"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Activity,
  CheckCircle2,
  CreditCard,
  Download,
  Gauge,
  Lock,
  ShieldCheck,
  Sliders,
  Webhook,
  Zap,
} from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AutomationsKpiCard from "../components/AutomationsKpiCard"
import AutomationsDataTable, { type DataColumn } from "../components/AutomationsDataTable"
import { Btn, Card, CardHeader, Modal, useToast } from "../components/primitives"
import { useAutomationUsageLimits } from "../data/hooks"
import type { PlanQuotaRow } from "../data/types"

export default function UsageLimitsPage() {
  const toast = useToast()
  const { data, loading } = useAutomationUsageLimits()
  const [modal, setModal] = useState<string | null>(null)

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
      {/* KPI row — derives from live usage; 0 until runs are recorded */}
      {(() => {
        const totalRuns = data.drivers.reduce((sum, d) => sum + (d.runs ?? 0), 0)
        return (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <AutomationsKpiCard label="Total runs this month" value={totalRuns} icon={Activity} tone="blue" />
            <AutomationsKpiCard label="AI credits used" value={0} icon={Zap} tone="violet" />
            <AutomationsKpiCard label="Webhook volume" value={0} icon={Webhook} tone="emerald" />
            <AutomationsKpiCard label="Active plan quotas" value={data.quotas.length} icon={ShieldCheck} tone="slate" />
          </div>
        )
      })()}

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Usage detail — honest until execution history exists */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Usage trends" />
              <div className="p-6 text-sm text-slate-400">
                Daily usage trends appear here once your automations start running.
              </div>
            </Card>
            <Card>
              <CardHeader title="Usage by automation type" />
              <div className="p-6 text-sm text-slate-400">
                A breakdown by automation type appears here once runs are recorded.
              </div>
            </Card>
            <Card>
              <CardHeader title="Usage by module" />
              <div className="p-6 text-sm text-slate-400">
                Per-module usage appears here once your automations start running.
              </div>
            </Card>
            <Card>
              <CardHeader title="Governance posture" />
              <div className="p-4 space-y-1.5 text-sm">
                {[
                  ["Review-first policy", "Available"],
                  ["Dangerous-action guardrails", "Available"],
                  ["Publish permissions", "Available"],
                  ["Environment controls", "Available"],
                  ["Audit logging", "Available"],
                  ["Data retention", "Available"],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5 text-slate-600"><CheckCircle2 className="h-4 w-4 text-slate-400" />{l}</span><span className="text-xs font-medium text-slate-500">{v}</span></div>
                ))}
              </div>
            </Card>
          </div>

          {/* Governance moved to Workspace Settings → Automation Governance */}
          <Card className="border-slate-200 bg-slate-50/60">
            <div className="flex items-start gap-3 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200">
                <Lock className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900">Automation governance</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Review-first policy, publish permissions, dangerous-action guardrails and audit
                  retention are managed in Workspace Settings.
                </p>
                <Link
                  href="/property-manager/workspace-settings/automations"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                >
                  Open Automation Governance →
                </Link>
              </div>
            </div>
          </Card>

          {/* Plan limits table */}
          <Card>
            <CardHeader title="Plan limits & workspace quotas" action={<button onClick={() => setModal("quotas")} className="text-xs font-medium text-blue-600 hover:underline">Configure quotas</button>} />
            {loading ? <div className="h-40 animate-pulse bg-slate-100" /> : data.quotas.length === 0 ? (
              <div className="p-6 text-sm text-slate-400">Plan limits and workspace quotas appear here once configured for your workspace.</div>
            ) : (
              <AutomationsDataTable columns={quotaCols} rows={data.quotas} pageSize={5} total={data.quotas.length} />
            )}
          </Card>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Cost forecast" action={<button onClick={() => toast("Billing & usage")} className="text-xs font-medium text-blue-600 hover:underline">View billing</button>} />
            <div className="p-4 text-sm text-slate-400">
              Estimated automation spend appears here once metered usage is recorded for this billing cycle.
            </div>
          </Card>
          <Card>
            <CardHeader title="Top usage drivers" />
            {data.drivers.length === 0 ? (
              <div className="p-4 text-sm text-slate-400">The automations driving the most runs appear here once usage is recorded.</div>
            ) : (
              <div className="p-3 space-y-1">
                {data.drivers.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                    <span className="text-slate-700">{d.name}</span>
                    <span className="text-xs text-slate-500">{d.runs.toLocaleString()} · {d.share}%</span>
                  </div>
                ))}
              </div>
            )}
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
