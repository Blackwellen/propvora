"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { useSectionRouter } from "@/components/sections/SectionBasePath"
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  History,
  LayoutTemplate,
  Play,
  Plus,
  PoundSterling,
  Sparkles,
  TrendingUp,
  Wand2,
  Workflow,
  Zap,
} from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AutomationsKpiCard from "../components/AutomationsKpiCard"
import AutomationsDataTable, { type DataColumn } from "../components/AutomationsDataTable"
import { AutomationsStatusBadge, AutomationsReviewFirstBadge, AutomationsRiskBadge } from "../components/AutomationsBadges"
import AutomationsRightRail from "../components/AutomationsRightRail"
import { Btn, Card, CardHeader, Modal, Toggle, useToast } from "../components/primitives"
import { useAutomationsHome } from "../data/hooks"
import type { AutomationRow } from "../data/types"

type SubTab = "automations" | "inbox" | "activity" | "templates"

interface AutomationUsage {
  runsUsed: number
  runsLimit: number
  runsRemaining: number
  runsUnlimited: boolean
}

export default function HomePage() {
  const router = useSectionRouter()
  const toast = useToast()
  const { automations, reviewQueue, activity } = useAutomationsHome()
  const [tab, setTab] = useState<SubTab>("automations")
  const [automationPlanEnabled, setAutomationPlanEnabled] = useState<boolean | null>(null)
  const [automationUsage, setAutomationUsage] = useState<AutomationUsage | null>(null)

  // Check automation plan eligibility and usage on mount
  useEffect(() => {
    let active = true
    fetch("/api/automations/usage")
      .then((r) => {
        if (r.status === 402) {
          if (active) setAutomationPlanEnabled(false)
          return null
        }
        return r.json()
      })
      .then((d) => {
        if (!active || !d) return
        setAutomationPlanEnabled(true)
        if (d.usage) {
          setAutomationUsage({
            runsUsed: d.usage.runsUsed ?? 0,
            runsLimit: d.usage.runsLimit ?? 0,
            runsRemaining: d.usage.runsRemaining ?? 0,
            runsUnlimited: d.usage.runsUnlimited ?? false,
          })
        }
      })
      .catch(() => {
        if (active) setAutomationPlanEnabled(true) // fail open in the UI
      })
    return () => { active = false }
  }, [])
  const [page, setPage] = useState(1)
  const [newOpen, setNewOpen] = useState(false)
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    () => Object.fromEntries(automations.data.map((a) => [a.id, a.enabled])),
  )

  const rows = automations.data

  // Derive KPI counts from real data (seed fallback keeps these honest)
  const activeCount = rows.filter((a) => a.status === "live" && a.enabled).length
  const pendingReviewCount = reviewQueue.length
  const totalRows = rows.length

  const columns: DataColumn<AutomationRow>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Automation",
        render: (r) => (
          <div className="min-w-[220px]">
            <div className="font-medium text-slate-900">{r.name}</div>
            <div className="text-xs text-slate-400">{r.ref}</div>
          </div>
        ),
      },
      { key: "category", header: "Category", render: (r) => <span className="text-slate-600">{r.category}</span> },
      { key: "trigger", header: "Trigger", render: (r) => <span className="text-slate-600">{r.trigger}</span> },
      { key: "actions", header: "Actions", render: (r) => <span className="text-slate-500">{r.actionsSummary}</span> },
      { key: "status", header: "Status", render: (r) => <AutomationsStatusBadge status={r.status} /> },
      { key: "lastChecked", header: "Last checked", render: (r) => <span className="text-slate-500">{r.lastChecked}</span> },
      {
        key: "owner",
        header: "Owner",
        render: (r) => (
          <span className="inline-flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-violet-100 text-[10px] font-semibold text-violet-700">
              {r.owner.split(" ").map((p) => p[0]).join("")}
            </span>
            <span className="text-slate-600">{r.owner}</span>
          </span>
        ),
      },
      {
        key: "modules",
        header: "Modules",
        render: (r) => (
          <div className="flex flex-wrap gap-1">
            {r.modules.map((m) => (
              <span key={m} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                {m}
              </span>
            ))}
          </div>
        ),
      },
      { key: "frequency", header: "Frequency", render: (r) => <span className="text-slate-500">{r.frequency}</span> },
      { key: "reviewFirst", header: "Review-first", render: (r) => <AutomationsReviewFirstBadge yes={r.reviewFirst} /> },
      {
        key: "enabled",
        header: "Enabled",
        render: (r) => (
          <Toggle
            on={enabled[r.id] ?? r.enabled}
            onChange={(v) => {
              setEnabled((s) => ({ ...s, [r.id]: v }))
              toast(v ? `${r.name} enabled` : `${r.name} paused`)
            }}
            label="Enabled"
          />
        ),
      },
    ],
    [enabled, toast],
  )

  const actions = (
    <>
      <Btn icon={Play} onClick={() => toast("Running enabled automations now…")}>
        Run now
      </Btn>
      <Btn icon={Wand2} variant="violet" onClick={() => router.push("/property-manager/automations/ai-builder")}>
        AI Builder
      </Btn>
      <Btn icon={LayoutTemplate} onClick={() => router.push("/property-manager/automations/canvas")}>
        Canvas
      </Btn>
      <Btn icon={Plus} variant="primary" onClick={() => setNewOpen(true)}>
        New automation
      </Btn>
    </>
  )

  const subTabs: { id: SubTab; label: string; badge?: number }[] = [
    { id: "automations", label: "Automations" },
    { id: "inbox", label: "Review Inbox", badge: reviewQueue.length > 0 ? reviewQueue.length : undefined },
    { id: "activity", label: "Activity" },
    { id: "templates", label: "Templates" },
  ]

  // Plan gate: show upgrade CTA when automations are not on the plan
  if (automationPlanEnabled === false) {
    return (
      <AutomationsModuleShell
        title="Automations"
        subtitle="Review-first portfolio automation that proposes safe, reversible next steps."
        icon={Workflow}
        actions={null}
      >
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-violet-400" />
          </div>
          <div>
            <p className="text-[18px] font-[700] text-slate-900 mb-2">Automations not included on your plan</p>
            <p className="text-[14px] text-slate-500 max-w-[400px]">
              Upgrade to Scale or above to unlock review-first portfolio automation, recipes, the AI Builder and Canvas.
            </p>
          </div>
          <Link
            href="/property-manager/billing"
            className="px-6 py-3 rounded-xl bg-blue-600 text-white text-[14px] font-[600] hover:bg-blue-700 transition-colors"
          >
            Upgrade plan
          </Link>
        </div>
      </AutomationsModuleShell>
    )
  }

  return (
    <AutomationsModuleShell
      title="Automations"
      subtitle="Review-first portfolio automation that proposes safe, reversible next steps."
      icon={Workflow}
      actions={actions}
      showSafetyBanner
    >
      {/* KPI row — 2 rows of 4 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AutomationsKpiCard label="Active automations" value={activeCount} icon={Zap} tone="blue" />
        <AutomationsKpiCard label="Pending review" value={pendingReviewCount} sub="Requires your approval" icon={AlertCircle} tone="amber" />
        <AutomationsKpiCard label="Total automations" value={totalRows} icon={CheckCircle2} tone="emerald" />
        <AutomationsKpiCard label="Runs (recent)" value={automations.source === "live" ? totalRows : 0} sub="Last 200 runs" icon={History} tone="slate" />
        <AutomationsKpiCard label="Approval SLA (≤24h)" value={automations.source === "live" ? "—" : "—"} sub="Requires live data" icon={Clock} tone="violet" />
        <AutomationsKpiCard label="Error rate" value={automations.source === "live" ? "—" : "—"} sub="Requires live data" icon={AlertCircle} tone="red" />
        <AutomationsKpiCard label="Templates available" value={0} sub="Browse Recipes tab" icon={LayoutTemplate} tone="blue" />
        <AutomationsKpiCard label="Automations ROI (est.)" value="—" sub="Requires live data" icon={PoundSterling} tone="emerald" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="space-y-4">
          <div className="flex items-center gap-1 border-b border-slate-200">
            {subTabs.map((s) => (
              <button
                key={s.id}
                onClick={() => setTab(s.id)}
                className={`border-b-2 px-3.5 py-2.5 text-sm transition ${tab === s.id ? "border-blue-600 font-semibold text-blue-700" : "border-transparent font-medium text-slate-500 hover:text-slate-800"}`}
              >
                {s.label}
                {s.badge ? <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{s.badge}</span> : null}
              </button>
            ))}
          </div>

          {tab === "automations" && (
            <AutomationsDataTable
              columns={columns}
              rows={rows}
              page={page}
              pageSize={5}
              total={rows.length}
              onPageChange={setPage}
            />
          )}

          {tab === "inbox" && (
            <Card className="p-4">
              <div className="space-y-2">
                {reviewQueue.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => router.push("/property-manager/automations/approvals")}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3 text-left hover:bg-slate-50"
                  >
                    <span className="text-sm font-medium text-slate-800">{q.title}</span>
                    <span className="flex items-center gap-2">
                      <AutomationsRiskBadge level={q.risk} />
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {tab === "activity" && (
            <Card className="p-2">
              {activity.map((a) => (
                <button
                  key={a.id}
                  onClick={() => router.push("/property-manager/automations/runs-logs")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50"
                >
                  <Activity className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="flex-1 text-sm text-slate-700">{a.text}</span>
                  <span className="text-xs text-slate-400">{a.at}</span>
                </button>
              ))}
            </Card>
          )}

          {tab === "templates" && (
            <Card className="p-6 text-center text-sm text-slate-500">
              <Btn variant="primary" icon={LayoutTemplate} className="mx-auto" onClick={() => router.push("/property-manager/automations/recipes")}>
                Browse template library
              </Btn>
            </Card>
          )}
        </div>

        {/* Right rail */}
        <AutomationsRightRail>
          <Card>
            <CardHeader title={`Review queue (${reviewQueue.length})`} />
            <div className="space-y-1 p-2">
              {reviewQueue.map((q) => (
                <button
                  key={q.id}
                  onClick={() => router.push("/property-manager/automations/approvals")}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-slate-50"
                >
                  <span className="text-sm text-slate-700">{q.title}</span>
                  <AutomationsRiskBadge level={q.risk} />
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Performance snapshot" />
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-semibold text-slate-900">{rows.length}</div>
                  <div className="text-[11px] text-slate-400">Active loaded</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-400">—</div>
                  <div className="text-[11px] text-slate-400">Success rate</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-400">—</div>
                  <div className="text-[11px] text-slate-400">Error rate</div>
                </div>
              </div>
              <div className="mt-2 text-center text-[10px] text-slate-400">Requires live run data</div>
            </div>
          </Card>

          {/* Monthly runs usage meter */}
          {automationUsage && !automationUsage.runsUnlimited && (
            <Card>
              <CardHeader title="Monthly run quota" />
              <div className="p-4">
                <div className="flex items-baseline justify-between text-sm mb-2">
                  <span className="font-semibold text-slate-900">{automationUsage.runsUsed.toLocaleString()}</span>
                  <span className="text-slate-400">/ {automationUsage.runsLimit.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${Math.min(100, (automationUsage.runsUsed / automationUsage.runsLimit) * 100)}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {automationUsage.runsRemaining.toLocaleString()} runs remaining this month
                </div>
                {automationUsage.runsUsed >= automationUsage.runsLimit && (
                  <Link href="/property-manager/billing" className="mt-2 inline-block text-[11px] font-[600] text-amber-600 hover:underline">
                    Limit reached — upgrade plan
                  </Link>
                )}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Top templates" action={<button onClick={() => router.push("/property-manager/automations/recipes")} className="text-xs font-medium text-blue-600 hover:underline">View all</button>} />
            <div className="p-2">
              {[
                "Rent overdue → draft chase",
                "Lease expiry → renewal",
                "New maintenance → triage",
              ].map((name) => (
                <button key={name} onClick={() => router.push("/property-manager/automations/recipes")} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-slate-50">
                  <span className="text-sm text-slate-700">{name}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="border-violet-200 bg-violet-50/40">
            <div className="flex items-start gap-2.5 p-4">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
              <div>
                <h3 className="text-sm font-semibold text-violet-900">AI suggestion</h3>
                <p className="mt-1 text-xs text-violet-800">Auto-approve low-risk supplier invoices under £250 to save ~3h/week.</p>
                <button onClick={() => router.push("/property-manager/automations/ai-builder")} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:underline">
                  Review suggestion <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </Card>
        </AutomationsRightRail>
      </div>

      {/* Recent activity strip */}
      <Card className="mt-5">
        <CardHeader title="Recent activity" action={<TrendingUp className="h-4 w-4 text-slate-400" />} />
        <div className="divide-y divide-slate-100">
          {activity.map((a) => (
            <button key={a.id} onClick={() => router.push("/property-manager/automations/runs-logs")} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-500">
                <Activity className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1 text-sm text-slate-700">{a.text}</span>
              <span className="text-xs text-slate-400">{a.at}</span>
            </button>
          ))}
        </div>
      </Card>

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="New automation"
        footer={
          <>
            <Btn variant="outline" onClick={() => setNewOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={() => { setNewOpen(false); router.push("/property-manager/automations/canvas") }}>Open canvas</Btn>
          </>
        }
      >
        Start from a blank canvas, a recipe, or describe it in the AI Builder. This opens the Canvas
        Builder where your automation is saved as a review-first draft.
      </Modal>
    </AutomationsModuleShell>
  )
}
