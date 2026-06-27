"use client"

// Dry-run preview panel. Shows the simulated trigger → condition → action steps
// returned by /api/automations/dry-run, clearly labelled as a preview where
// NOTHING was executed.

import React from "react"
import { Play, Zap, Filter, Sparkles, Info, AlertCircle } from "lucide-react"
import type { DryRunResponse, DryRunStep } from "./types"
import { PreviewPill } from "./shared"

const KIND_META: Record<DryRunStep["kind"], { icon: React.ElementType; cls: string; ring: string }> = {
  trigger: { icon: Zap, cls: "bg-[var(--brand-soft)] text-[var(--brand)]", ring: "border-[var(--color-brand-100)]" },
  condition: { icon: Filter, cls: "bg-amber-50 text-amber-600", ring: "border-amber-200" },
  action: { icon: Sparkles, cls: "bg-violet-50 text-violet-600", ring: "border-violet-200" },
}

export default function DryRunPanel({
  result,
  loading,
  onRun,
  canRun,
}: {
  result: DryRunResponse | null
  loading: boolean
  onRun: () => void
  canRun: boolean
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white"><Play className="h-4 w-4" /></span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Dry-run preview</h3>
            <p className="text-xs text-slate-500">See what would happen — without changing anything.</p>
          </div>
        </div>
        <button
          onClick={onRun}
          disabled={!canRun || loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <Play className="h-4 w-4" /> {loading ? "Previewing…" : "Run preview"}
        </button>
      </div>

      {result?.error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {result.error}
        </div>
      )}

      {result?.ok && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <PreviewPill />
            <span className="text-xs text-slate-500">
              About <span className="font-semibold text-slate-700">{result.estimatedMatches}</span> record(s) would be checked.
            </span>
          </div>

          <ol className="relative space-y-2 pl-1">
            {result.steps.map((s, i) => {
              const meta = KIND_META[s.kind]
              return (
                <li key={i} className={`rounded-xl border ${meta.ring} bg-white p-3`}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${meta.cls}`}>
                      <meta.icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-800">{s.label}</div>
                      {s.detail && <div className="mt-0.5 text-xs text-slate-500">{s.detail}</div>}
                      <div className="mt-1 inline-flex rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        {s.outcome}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>

          {result.notes && result.notes.length > 0 && (
            <div className="space-y-1 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5">
              {result.notes.map((n, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-slate-500">
                  <Info className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" /> {n}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/40 px-3 py-4 text-center text-xs text-slate-400">
          Run a preview to simulate this automation. It reads your data read-only and never executes the action.
        </p>
      )}
    </div>
  )
}
