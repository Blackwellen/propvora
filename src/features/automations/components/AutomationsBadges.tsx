"use client"

import { ShieldCheck } from "lucide-react"

/* ── Status badge ── */
type StatusTone = "live" | "review" | "paused" | "draft" | "failed" | "success" | "skipped" | "active" | "resolved" | "muted"

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  live: { label: "Live", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  active: { label: "Active", cls: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
  review: { label: "Review", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  paused: { label: "Paused", cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  failed: { label: "Failed", cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  success: { label: "Success", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  skipped: { label: "Skipped", cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  resolved: { label: "Resolved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  muted: { label: "Muted", cls: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-400" },
}

export function AutomationsStatusBadge({ status, label }: { status: StatusTone | string; label?: string }) {
  const m = STATUS_META[status] ?? { label: label ?? status, cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {label ?? m.label}
    </span>
  )
}

/* ── Risk badge ── */
export type RiskLevel = "low" | "medium" | "high" | "critical"
const RISK_META: Record<RiskLevel, { label: string; cls: string }> = {
  low: { label: "Low", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  medium: { label: "Medium", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  high: { label: "High", cls: "bg-red-50 text-red-700 border-red-200" },
  critical: { label: "Critical", cls: "bg-red-100 text-red-800 border-red-300" },
}
export function AutomationsRiskBadge({ level }: { level: RiskLevel }) {
  const m = RISK_META[level] ?? RISK_META.low
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${m.cls}`}>
      {m.label}
    </span>
  )
}

/* ── Review-first badge ── */
export function AutomationsReviewFirstBadge({ yes = true }: { yes?: boolean }) {
  if (!yes) {
    return (
      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
        No
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      <ShieldCheck className="h-3 w-3" /> Review-first
    </span>
  )
}
