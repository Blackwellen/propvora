"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Activity,
  ArrowUpRight,
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
import { Btn, Card, CardHeader, useToast } from "../components/primitives"
import { useAutomationUsageLimits } from "../data/hooks"
import type { PlanQuotaRow } from "../data/types"

type UsageTab = "Usage & Limits" | "Admin Controls"
const USAGE_TABS: UsageTab[] = ["Usage & Limits", "Admin Controls"]

function exportUsageCsv(drivers: { name: string; runs?: number; errorRate?: number }[]) {
  const header = ["Automation Name", "Runs", "Error Rate"]
  const rows = drivers.map((d) => [`"${d.name.replace(/"/g, '""')}"`, d.runs ?? 0, d.errorRate ?? 0])
  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `automation-usage-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function UsageLimitsPage() {
  const toast = useToast()
  const router = useRouter()
  const { data, loading } = useAutomationUsageLimits()
  const [activeTab, setActiveTab] = useState<UsageTab>("Usage & Limits")

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
    { key: "actions", header: "Actions", render: () => <button onClick={() => router.push("/property-manager/workspace/billing")} className="text-xs font-medium text-blue-600 hover:underline">Manage plan</button> },
  ]

  const actions = (
    <>
      {activeTab === "Usage & Limits" && (
        <>
          <Btn icon={Sliders} onClick={() => setActiveTab("Admin Controls")}>Admin controls</Btn>
          <Btn icon={CreditCard} onClick={() => router.push("/property-manager/workspace/billing")}>View billing</Btn>
          <Btn icon={Download} onClick={() => exportUsageCsv(data.drivers)}>Export usage</Btn>
        </>
      )}
      {activeTab === "Admin Controls" && (
        <Btn icon={Lock} onClick={() => router.push("/property-manager/workspace-settings/automations")}>
          Open Governance Settings
        </Btn>
      )}
    </>
  )

  return (
    <AutomationsModuleShell
      title="Usage & Limits"
      subtitle="Govern automation usage, enforce policies, and maintain operational guardrails."
      icon={Gauge}
      actions={actions}
    >
      {/* Sub-tab strip */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {USAGE_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm transition ${activeTab === t ? "border-blue-600 font-semibold text-blue-700" : "border-transparent font-medium text-slate-500 hover:text-slate-800"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Usage & Limits tab ── */}
      {activeTab === "Usage & Limits" && (
        <>
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
                      <div key={l} className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <CheckCircle2 className="h-4 w-4 text-slate-400" />{l}
                        </span>
                        <span className="text-xs font-medium text-slate-500">{v}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Governance cross-reference card */}
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
                    <div className="mt-2 flex flex-wrap gap-3">
                      <Link
                        href="/property-manager/workspace-settings/automations"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Open Automation Governance →
                      </Link>
                      <button
                        onClick={() => setActiveTab("Admin Controls")}
                        className="text-xs font-semibold text-slate-600 hover:underline"
                      >
                        View admin controls →
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Plan limits table */}
              <Card>
                <CardHeader title="Plan limits & workspace quotas" action={<button onClick={() => router.push("/property-manager/workspace/billing")} className="text-xs font-medium text-blue-600 hover:underline">Manage plan</button>} />
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
                <CardHeader title="Cost forecast" action={<button onClick={() => router.push("/property-manager/workspace/billing")} className="text-xs font-medium text-blue-600 hover:underline">View billing</button>} />
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
        </>
      )}

      {/* ── Admin Controls tab ── */}
      {activeTab === "Admin Controls" && (
        <div className="mt-4 space-y-5">
          {/* Banner explaining where controls live */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Governance settings live in Workspace Settings</p>
              <p className="mt-0.5 text-xs text-blue-700">
                Safety policies, publish permissions, dangerous-action guardrails, and audit retention are all
                configured in Workspace Settings → Automation Governance so they apply workspace-wide
                and aren&apos;t lost when browsing the Automations module.
              </p>
              <Link
                href="/property-manager/workspace-settings/automations"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
              >
                Open Automation Governance <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Governance summary — read-only view from this surface */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                icon: ShieldCheck,
                label: "Review-first policy",
                description: "New automations require human approval before any external action runs.",
                setting: "Enabled by default",
                href: "/property-manager/workspace-settings/automations",
              },
              {
                icon: Zap,
                label: "Dangerous-action guardrails",
                description: "Irreversible actions (deletes, payments, notices) are held for explicit approval.",
                setting: "Enabled by default",
                href: "/property-manager/workspace-settings/automations",
              },
              {
                icon: Lock,
                label: "Publish permissions",
                description: "Controls which roles can move a draft automation live.",
                setting: "Owners & Admins only",
                href: "/property-manager/workspace-settings/automations",
              },
              {
                icon: Sliders,
                label: "Environment separation",
                description: "Dry-run executions are kept isolated from live actions.",
                setting: "Configurable",
                href: "/property-manager/workspace-settings/automations",
              },
              {
                icon: Database,
                label: "Audit log retention",
                description: "How long automation run logs and approval decisions are retained.",
                setting: "1 year by default",
                href: "/property-manager/workspace-settings/automations",
              },
            ].map(({ icon: Icon, label, description, setting, href }) => (
              <Link
                key={label}
                href={href}
                className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold text-slate-900">{label}</p>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-slate-600" />
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />{setting}
                  </span>
                </div>
              </Link>
            ))}

            {/* Related controls */}
            <Link
              href="/property-manager/workspace-settings/roles"
              className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <Users className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-slate-900">Roles &amp; Permissions</p>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-slate-600" />
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">Define what each role can do across automations.</p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </AutomationsModuleShell>
  )
}
