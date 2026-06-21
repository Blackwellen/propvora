"use client"

import { CircleDot, History } from "lucide-react"
import { actionLabel } from "@/lib/automation/catalogue"
import { StatusChip, relativeTime } from "@/app/(app)/app/automations/_lib/ui"
import type { RunWithRule } from "@/app/(app)/app/automations/_lib/useAutomations"

export interface AutomationsActivityFeedProps {
  runs: RunWithRule[]
  loading: boolean
}

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  )
}

function EmptyActivity() {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-slate-400 shadow-sm">
        <History className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-slate-800">No activity yet</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Run your rules to start building an activity history.
      </p>
    </div>
  )
}

/**
 * Timeline list of automation run events sorted newest-first.
 * Each row shows the run summary, rule name, action type, time, and status chip.
 * Errors are shown inline in red.
 */
export default function AutomationsActivityFeed({ runs, loading }: AutomationsActivityFeedProps) {
  if (loading) return <SkeletonRows />
  if (runs.length === 0) return <EmptyActivity />

  return (
    <div className="relative space-y-1 pl-2">
      {runs.map((run) => (
        <div
          key={run.id}
          className="relative flex gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50"
        >
          <div className="flex flex-col items-center">
            <CircleDot className="h-3.5 w-3.5 text-slate-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm text-slate-800">
                {run.context?.summary ?? "Rule match"}
              </span>
              <StatusChip status={run.status} />
            </div>
            <div className="mt-0.5 text-xs text-slate-400">
              {run.rule?.name} -{" "}
              {actionLabel(run.action?.action_type ?? run.rule?.action_type ?? "")} -{" "}
              {relativeTime(run.triggered_at)}
              {run.error ? (
                <span className="ml-1 text-red-500">— {run.error}</span>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
