"use client"

import React from "react"

// Shared presentation helpers for the Automation v2 OPS surfaces (run history,
// webhooks, templates). Status vocabularies mirror the live DB CHECK
// constraints exactly so a pill never invents a state the engine can't record.

// ── Run status (automation_v2_runs.status) ───────────────────────────────────
export type RunStatus = "queued" | "running" | "succeeded" | "failed" | "skipped" | "dry_run"

const RUN_META: Record<RunStatus, { label: string; cls: string; dot: string }> = {
  queued: { label: "Queued", cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  running: { label: "Running", cls: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  succeeded: { label: "Succeeded", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  failed: { label: "Failed", cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  skipped: { label: "Skipped", cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  dry_run: { label: "Dry run", cls: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
}

export function RunStatusPill({ status }: { status: string }) {
  const m = RUN_META[(status as RunStatus)] ?? RUN_META.queued
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

// ── Step status (automation_run_steps.status) ────────────────────────────────
export type StepStatus = "pending" | "succeeded" | "failed" | "skipped" | "simulated"

const STEP_META: Record<StepStatus, { label: string; cls: string; dot: string }> = {
  pending: { label: "Pending", cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-300" },
  succeeded: { label: "Succeeded", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  failed: { label: "Failed", cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  skipped: { label: "Skipped", cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  simulated: { label: "Simulated", cls: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
}

export function StepStatusPill({ status }: { status: string }) {
  const m = STEP_META[(status as StepStatus)] ?? STEP_META.pending
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

// ── Delivery status (automation_webhook_deliveries.status) ───────────────────
const DELIVERY_META: Record<string, { label: string; cls: string }> = {
  accepted: { label: "Accepted", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-700 border-red-200" },
  rate_limited: { label: "Rate limited", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  error: { label: "Error", cls: "bg-red-50 text-red-700 border-red-200" },
}

export function DeliveryStatusPill({ status }: { status: string }) {
  const m = DELIVERY_META[status] ?? { label: status, cls: "bg-slate-100 text-slate-600 border-slate-200" }
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${m.cls}`}>{m.label}</span>
}

// ── helpers ───────────────────────────────────────────────────────────────────
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return "—"
  const diff = Date.now() - t
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function absoluteTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString()
}

export function OpsEmptyState({ icon: Icon, title, body, action }: {
  icon: React.ElementType; title: string; body: string; action?: React.ReactNode
}) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-slate-400 shadow-sm"><Icon className="h-5 w-5" /></span>
      <h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function OpsSkeleton({ rows = 3 }: { rows?: number }) {
  return <div className="space-y-3">{Array.from({ length: rows }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
}

export function UpgradeNotice({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-5 py-4 text-sm text-amber-800">
      {message}
    </div>
  )
}
