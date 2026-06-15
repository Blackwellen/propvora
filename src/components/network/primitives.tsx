"use client"

import { cn } from "@/lib/utils"
import { Network, Inbox, Lock } from "lucide-react"
import type { RelationshipStatus, ActivitySeverity } from "@/lib/network/types"

/* Shared presentational primitives for the partner-network + activity surfaces.
   No `dark:` classes anywhere. */

export function NetworkKpiCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[12.5px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-[12px] text-slate-400">{hint}</p>}
    </div>
  )
}

const STATUS_META: Record<RelationshipStatus, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  ended: { label: "Ended", cls: "bg-slate-100 text-slate-500 border-slate-200" },
}

export function RelationshipStatusBadge({ status }: { status: RelationshipStatus }) {
  const m = STATUS_META[status] ?? STATUS_META.active
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11.5px] font-medium",
        m.cls
      )}
    >
      {m.label}
    </span>
  )
}

const SEVERITY_DOT: Record<ActivitySeverity, string> = {
  info: "bg-sky-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-rose-500",
}

export function SeverityDot({ severity }: { severity: ActivitySeverity }) {
  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", SEVERITY_DOT[severity])}
      aria-hidden
    />
  )
}

export function NetworkEmptyState({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Inbox className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{body}</p>
    </div>
  )
}

export function NetworkLockedState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Lock className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">Sign in to view your network</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>
    </div>
  )
}

export function NetworkSectionIcon() {
  return <Network className="h-5 w-5 text-slate-500" />
}

export function fmtWhen(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export function fmtRelative(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  const diff = Date.now() - d.getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days}d ago`
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}
