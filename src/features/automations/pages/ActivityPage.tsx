"use client"

import { useMemo, useState } from "react"
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Pause,
  Play,
  Search,
  ShieldCheck,
  XCircle,
  Zap,
} from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AutomationsKpiCard from "../components/AutomationsKpiCard"
import { Btn, Card, CardHeader } from "../components/primitives"
import type { ActivityItem } from "../data/types"

const SEED_ACTIVITY: ActivityItem[] = []

const KIND_ICON: Record<ActivityItem["kind"], typeof Activity> = {
  run_completed: CheckCircle2,
  action_executed: Play,
  approval_required: ShieldCheck,
  error: AlertCircle,
  paused: Pause,
}

const KIND_TONE: Record<ActivityItem["kind"], string> = {
  run_completed: "text-emerald-600",
  action_executed: "text-blue-600",
  approval_required: "text-amber-600",
  error: "text-red-600",
  paused: "text-slate-500",
}

const KIND_BG: Record<ActivityItem["kind"], string> = {
  run_completed: "bg-emerald-50",
  action_executed: "bg-blue-50",
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

  const filtered = useMemo(() => {
    return SEED_ACTIVITY.filter((a) => {
      if (activeTab !== "all" && a.kind !== activeTab) return false
      if (query && !a.text.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [activeTab, query])

  const runCount = SEED_ACTIVITY.filter((a) => a.kind === "run_completed").length
  const actionCount = SEED_ACTIVITY.filter((a) => a.kind === "action_executed").length
  const approvalCount = SEED_ACTIVITY.filter((a) => a.kind === "approval_required").length
  const errorCount = SEED_ACTIVITY.filter((a) => a.kind === "error").length

  const actions = (
    <>
      <Btn icon={Download} onClick={() => {}}>Export log</Btn>
      <Btn icon={Filter} onClick={() => {}}>Filter</Btn>
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
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 pb-0">
          {FILTER_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`border-b-2 px-3.5 py-2.5 text-sm transition ${activeTab === t.id ? "border-blue-600 font-semibold text-blue-700" : "border-transparent font-medium text-slate-500 hover:text-slate-800"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity feed */}
      <Card className="mt-4">
        <CardHeader
          title={`Activity feed${filtered.length !== SEED_ACTIVITY.length ? ` (${filtered.length} matching)` : ` (${SEED_ACTIVITY.length} events)`}`}
          action={
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              Live updates
            </span>
          }
        />
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Zap className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No activity events match your filter</p>
            <p className="text-xs text-slate-400">Try a different filter or clear the search</p>
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

      {/* Info note about seed data */}
      {SEED_ACTIVITY.length > 0 && (
        <p className="mt-3 text-xs text-slate-400">
          Showing recent activity. Connect the automations backend to see live events from your workspace.
        </p>
      )}
    </AutomationsModuleShell>
  )
}
