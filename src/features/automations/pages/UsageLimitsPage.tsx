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
        title={
          modal === "limits" ? "Edit usage limits"
          : modal === "quotas" ? "Configure workspace quotas"
          : "Policy controls"
        }
        footer={
          <>
            <Btn variant="outline" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn
              variant="primary"
              onClick={() => {
                setModal(null)
                toast(
                  modal === "limits" ? "Limits updated — changes apply from next billing cycle"
                  : modal === "quotas" ? "Quota configuration saved"
                  : "Policy controls saved"
                )
              }}
            >
              Save changes
            </Btn>
          </>
        }
      >
        {modal === "limits" && (
          <div className="space-y-4 text-sm">
            <p className="text-slate-500">Set the maximum number of automation runs, AI credits, and concurrent executions allowed per month for this workspace.</p>
            {[
              { label: "Monthly run limit", placeholder: "e.g. 10000", hint: "Set to 0 for unlimited (plan permitting)" },
              { label: "AI credit cap", placeholder: "e.g. 500", hint: "Credits consumed by AI Builder and AI-powered nodes" },
              { label: "Max concurrent runs", placeholder: "e.g. 5", hint: "Prevents runaway automations from overwhelming external services" },
            ].map(({ label, placeholder, hint }) => (
              <div key={label}>
                <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
                <input placeholder={placeholder} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>
              </div>
            ))}
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-xs text-amber-800">
              Changes to usage limits take effect at the start of the next billing cycle. Contact support to adjust limits mid-cycle.
            </div>
          </div>
        )}
        {modal === "quotas" && (
          <div className="space-y-4 text-sm">
            <p className="text-slate-500">Configure per-workspace quotas that override the default plan limits. Useful for multi-workspace operators.</p>
            {[
              { label: "Webhook endpoints", placeholder: "e.g. 10" },
              { label: "Active automations", placeholder: "e.g. 50" },
              { label: "Approval queue size", placeholder: "e.g. 200" },
            ].map(({ label, placeholder }) => (
              <div key={label}>
                <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
                <input placeholder={placeholder} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
              </div>
            ))}
            <p className="text-xs text-slate-400">Leave blank to use the plan default. Quota changes are instant.</p>
          </div>
        )}
        {modal === "policy" && (
          <div className="space-y-4 text-sm">
            <p className="text-slate-500">Set workspace-wide safety policies that govern how automations are published and executed.</p>
            {[
              { label: "Review-first by default", hint: "Require a human to approve all automation actions before they execute" },
              { label: "Block dangerous actions", hint: "Prevent automations from triggering payment, deletion or legal notice actions without manual approval" },
              { label: "Restrict publish to admins only", hint: "Only workspace admins and owners can publish automations" },
            ].map(({ label, hint }) => (
              <label key={label} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                <input type="checkbox" className="mt-0.5 rounded border-slate-300" defaultChecked />
                <div><div className="font-medium text-slate-800">{label}</div><div className="mt-0.5 text-[11px] text-slate-400">{hint}</div></div>
              </label>
            ))}
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-800">
              Full governance controls including audit retention and environment rules are in <a href="/property-manager/workspace-settings/automations" className="font-semibold underline">Workspace Settings → Automation Governance</a>.
            </div>
          </div>
        )}
      </Modal>
    </AutomationsModuleShell>
  )
}
