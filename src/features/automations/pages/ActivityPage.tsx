"use client"

import { useMemo, useState } from "react"
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Pause,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
  Zap,
} from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AutomationsKpiCard from "../components/AutomationsKpiCard"
import { Btn, Card, CardHeader } from "../components/primitives"
import { useAutomationActivity } from "../data/hooks"
import type { ActivityItem } from "../data/types"

function exportActivityCsv(rows: ActivityItem[]) {
  const header = ["Kind", "Event", "At"]
  const csv = [
    header.join(","),
    ...rows.map((r) => [r.kind, `"${(r.text ?? "").replace(/"/g, '""')}"`, r.at].join(",")),
  ].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `automation-activity-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const KIND_ICON: Record<ActivityItem["kind"], typeof Activity> = {
  run_completed: CheckCircle2,
  action_executed: Play,
  approval_required: ShieldCheck,
  error: AlertCircle,
  paused: Pause,
}

const KIND_TONE: Record<ActivityItem["kind"], string> = {
  run_completed: "text-emerald-600",
  action_executed: "text-[var(--brand)]",
  approval_required: "text-amber-600",
  error: "text-red-600",
  paused: "text-slate-500",
}

const KIND_BG: Record<ActivityItem["kind"], string> = {
  run_completed: "bg-emerald-50",
  action_executed: "bg-[var(--brand-soft)]",
  approval_required: "bg-amber-50",
  error: "bg-red-50",
  paused: "bg-slate-100",
}

const KIND_LABEL: Record<ActivityItem["kind"], string> = {
  run_completed: "Run completed",
  action_executed: "Action executed",
  approval_required: "Approval required",
  error: "Error",
  paused: "Paused",
}

const FILTER_TABS = [
  { id: "all", label: "All events" },
  { id: "run_completed", label: "Runs" },
  { id: "action_executed", label: "Actions" },
  { id: "approval_required", label: "Approvals" },
  { id: "error", label: "Errors" },
  { id: "paused", label: "Paused" },
]

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [query, setQuery] = useState("")
  const { data: events, loading, reload } = useAutomationActivity()

  const filtered = useMemo(() => {
    return events.filter((a) => {
      if (activeTab !== "all" && a.kind !== activeTab) return false
      if (query && !a.text.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [events, activeTab, query])

  const runCount = events.filter((a) => a.kind === "run_completed").length
  const actionCount = events.filter((a) => a.kind === "action_executed").length
  const approvalCount = events.filter((a) => a.kind === "approval_required").length
  const errorCount = events.filter((a) => a.kind === "error").length

  const actions = (
    <>
      <Btn icon={RefreshCw} onClick={() => reload()}>Refresh</Btn>
      <Btn icon={Download} disabled={events.length === 0} onClick={() => exportActivityCsv(events)}>Export log</Btn>
    </>
  )

  return (
    <AutomationsModuleShell
      title="Activity"
      subtitle="Full audit feed of all automation events: runs, actions executed, approvals, errors, and status changes."
      icon={Activity}
      actions={actions}
    >
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AutomationsKpiCard label="Runs completed" value={runCount} icon={CheckCircle2} tone="emerald" />
        <AutomationsKpiCard label="Actions executed" value={actionCount} icon={Play} tone="blue" />
        <AutomationsKpiCard label="Approvals pending" value={approvalCount} icon={ShieldCheck} tone="amber" />
        <AutomationsKpiCard label="Errors" value={errorCount} icon={XCircle} tone="red" />
      </div>

      {/* Search + filter row */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activity…"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[var(--color-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-400)]/30"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 pb-0">
          {FILTER_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`border-b-2 px-3.5 py-2.5 text-sm transition ${activeTab === t.id ? "border-[var(--brand)] font-semibold text-[var(--brand)]" : "border-transparent font-medium text-slate-500 hover:text-slate-800"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity feed */}
      <Card className="mt-4">
        <CardHeader
          title={`Activity feed${filtered.length !== events.length ? ` (${filtered.length} matching)` : ` (${events.length} events)`}`}
          action={
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              Live updates
            </span>
          }
        />
        {loading ? (
          <div className="h-48 animate-pulse bg-slate-100" />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Zap className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">{events.length === 0 ? "No automation activity yet" : "No activity events match your filter"}</p>
            <p className="text-xs text-slate-400">{events.length === 0 ? "Runs, approvals and errors appear here as your automations execute." : "Try a different filter or clear the search"}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((a) => {
              const Icon = KIND_ICON[a.kind]
              return (
                <div key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
                  <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${KIND_BG[a.kind]}`}>
                    <Icon className={`h-3.5 w-3.5 ${KIND_TONE[a.kind]}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold uppercase tracking-wide ${KIND_TONE[a.kind]}`}>
                        {KIND_LABEL[a.kind]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-700">{a.text}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{a.at}</span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

    </AutomationsModuleShell>
  )
}
