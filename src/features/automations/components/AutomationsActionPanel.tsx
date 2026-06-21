"use client"

import { AlertCircle, Check, ChevronRight, Inbox, X as XIcon } from "lucide-react"
import { actionLabel } from "@/lib/automation/catalogue"
import { relativeTime } from "@/app/(app)/app/automations/_lib/ui"
import type { RunWithRule } from "@/app/(app)/app/automations/_lib/useAutomations"

export interface AutomationsActionPanelProps {
  runs: RunWithRule[]
  loading: boolean
  busy: string | null
  onApprove: (id: string) => void
  onSkip: (id: string) => void
}

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  )
}

function EmptyInbox() {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-slate-400 shadow-sm">
        <Inbox className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-slate-800">Nothing to review</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        When a rule matches a record, the proposed action lands here for your approval.
      </p>
    </div>
  )
}

/**
 * Review inbox panel — lists pending-review runs for human approval.
 * Approve executes the proposed action; Skip discards without acting.
 */
export default function AutomationsActionPanel({
  runs,
  loading,
  busy,
  onApprove,
  onSkip,
}: AutomationsActionPanelProps) {
  if (loading) return <SkeletonRows />
  if (runs.length === 0) return <EmptyInbox />

  return (
    <div className="space-y-3">
      {runs.map((run) => {
        const payload = run.action?.payload as Record<string, unknown> | undefined
        return (
          <div key={run.id} className="rounded-xl border border-amber-200 bg-amber-50/30 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900">
                    {run.context?.summary ?? "Rule match"}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-medium text-slate-600">{run.rule?.name}</span>
                    <ChevronRight className="h-3 w-3 text-slate-300" />
                    <span>
                      Proposes: {actionLabel(run.action?.action_type ?? run.rule?.action_type ?? "")}
                    </span>
                    <span className="text-slate-400">- {relativeTime(run.triggered_at)}</span>
                  </div>
                  {payload && (
                    <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                      <span className="font-medium text-slate-700">
                        {String(
                          payload.title ?? payload.subject ?? payload.reason ?? "Action"
                        )}
                      </span>
                      {payload.body ? (
                        <div className="mt-0.5 text-slate-500">{String(payload.body)}</div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => onSkip(run.id)}
                  disabled={busy === run.id}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <XIcon className="h-3.5 w-3.5" /> Skip
                </button>
                <button
                  onClick={() => onApprove(run.id)}
                  disabled={busy === run.id}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" /> {busy === run.id ? "…" : "Approve"}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
