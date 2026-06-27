"use client"

import React from "react"
import type { RunStatus } from "@/lib/automation/types"

const STATUS_META: Record<RunStatus, { label: string; cls: string; dot: string }> = {
  pending_review: { label: "Pending review", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  approved: { label: "Approved", cls: "bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--color-brand-100)]", dot: "bg-[var(--brand)]" },
  executed: { label: "Executed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  skipped: { label: "Skipped", cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  failed: { label: "Failed", cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
}

export function StatusChip({ status }: { status: RunStatus }) {
  const m = STATUS_META[status] ?? STATUS_META.pending_review
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

export function Chip({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "blue" | "violet" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    blue: "bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--color-brand-100)]",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  }
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{children}</span>
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}
