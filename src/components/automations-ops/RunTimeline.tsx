"use client"

import React, { useEffect, useState } from "react"
import { Activity, AlertCircle, ArrowDownToLine, ArrowUpFromLine, ShieldCheck } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { actionLabel } from "@/lib/automation/catalogue"
import { RunStatusPill, StepStatusPill, absoluteTime, relativeTime, OpsSkeleton, OpsEmptyState, UpgradeNotice } from "./ui"

interface RunStep {
  id: string
  step_index: number
  action_type: string
  status: string
  input: Record<string, unknown>
  output: Record<string, unknown>
  error: string | null
  created_at: string
}

interface RunDetail {
  id: string
  workspace_id: string
  definition_id: string | null
  status: string
  trigger_context: Record<string, unknown>
  started_at: string | null
  finished_at: string | null
  error: string | null
  is_dry_run: boolean
  created_at: string
  steps: RunStep[]
}

function JsonBlock({ label, icon: Icon, value }: { label: string; icon: React.ElementType; value: Record<string, unknown> }) {
  const isEmpty = !value || Object.keys(value).length === 0
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60">
      <div className="flex items-center gap-1.5 border-b border-slate-200 px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-400">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <pre className="max-h-48 overflow-auto px-3 py-2 text-[11px] leading-relaxed text-slate-600">
        {isEmpty ? "—" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  )
}

export default function RunTimeline({ runId }: { runId: string }) {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const [run, setRun] = useState<RunDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [upgrade, setUpgrade] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      setUpgrade(null)
      try {
        const params = new URLSearchParams({ runId })
        if (workspaceId) params.set("workspaceId", workspaceId)
        const res = await fetch(`/api/automations/runs?${params.toString()}`, { cache: "no-store" })
        const json = await res.json()
        if (cancelled) return
        if (res.status === 402) { setUpgrade(json.error ?? "Automation isn't on your plan."); return }
        if (!res.ok) { setError(json.error ?? "Couldn't load this run."); return }
        setRun((json.run as RunDetail) ?? null)
      } catch {
        if (!cancelled) setError("Couldn't load this run.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [runId, workspaceId])

  if (upgrade) return <UpgradeNotice message={upgrade} />
  if (loading) return <OpsSkeleton rows={4} />
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50/60 px-4 py-3 text-sm text-red-700">{error}</div>
  if (!run) {
    return <OpsEmptyState icon={Activity} title="Run not found" body="This run may have been removed, or it belongs to another workspace." />
  }

  const steps = [...(run.steps ?? [])].sort((a, b) => a.step_index - b.step_index)

  return (
    <div className="space-y-5">
      {/* Summary card — honest: every field comes straight from the recorded run. */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RunStatusPill status={run.status} />
            {run.is_dry_run && (
              <span className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                <ShieldCheck className="h-3 w-3" /> No side-effects performed
              </span>
            )}
          </div>
          <span className="font-mono text-xs text-slate-400">{run.id}</span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-slate-400">Created</dt><dd className="text-slate-700" title={absoluteTime(run.created_at)}>{relativeTime(run.created_at)}</dd></div>
          <div><dt className="text-xs text-slate-400">Started</dt><dd className="text-slate-700">{run.started_at ? absoluteTime(run.started_at) : "—"}</dd></div>
          <div><dt className="text-xs text-slate-400">Finished</dt><dd className="text-slate-700">{run.finished_at ? absoluteTime(run.finished_at) : "—"}</dd></div>
          <div><dt className="text-xs text-slate-400">Steps</dt><dd className="text-slate-700">{steps.length}</dd></div>
        </dl>
        {run.error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/60 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{run.error}</span>
          </div>
        )}
      </div>

      {/* Trigger context */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">Trigger context</h3>
        <JsonBlock label="trigger_context" icon={ArrowDownToLine} value={run.trigger_context} />
      </div>

      {/* Step timeline */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase text-slate-400">Step timeline</h3>
        {steps.length === 0 ? (
          <OpsEmptyState
            icon={Activity}
            title="No steps recorded"
            body="This run recorded no per-action steps. For a queued run, steps appear once the engine processes it."
          />
        ) : (
          <ol className="relative space-y-4 border-l border-slate-200 pl-5">
            {steps.map((s) => (
              <li key={s.id} className="relative">
                <span className="absolute -left-[27px] grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-semibold text-slate-600 shadow-sm">
                  {s.step_index + 1}
                </span>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">{actionLabel(s.action_type)}</span>
                    <StepStatusPill status={s.status} />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <JsonBlock label="Input" icon={ArrowDownToLine} value={s.input} />
                    <JsonBlock label="Output" icon={ArrowUpFromLine} value={s.output} />
                  </div>
                  {s.error && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/60 px-3 py-2 text-xs text-red-700">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{s.error}</span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
