"use client"

// Shared house-style primitives for Orders + Escrow screens.

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { X, ChevronRight, type LucideIcon } from "lucide-react"

// ── KPI card ────────────────────────────────────────────────────────────────
export function KpiCard({
  icon: Icon, iconBg, iconColor, value, label, sub, subColor, href,
}: {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  value: string | number
  label: string
  sub?: string
  subColor?: string
  href?: string
}) {
  const inner = (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow h-full">
      <div className="flex items-start justify-between">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-4.5 h-4.5 w-[18px] h-[18px]", iconColor)} />
        </div>
        {href && <ChevronRight className="w-4 h-4 text-slate-300" />}
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-3 leading-none">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-1.5">{label}</p>
      {sub && <p className={cn("text-[11px] font-semibold mt-1", subColor ?? "text-slate-400")}>{sub}</p>}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

// ── Status badge ────────────────────────────────────────────────────────────
const TONE: Record<string, string> = {
  blue: "bg-[var(--brand-soft)] text-[var(--brand)]",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  violet: "bg-violet-50 text-violet-700",
  slate: "bg-slate-100 text-slate-600",
}
export function StatusBadge({ tone, children }: { tone: keyof typeof TONE | string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap", TONE[tone] ?? TONE.slate)}>
      {children}
    </span>
  )
}

export function toneForSla(s: string) {
  return s === "breached" ? "red" : s === "at_risk" ? "red" : s === "due_soon" ? "amber" : "emerald"
}
export function toneForEvidence(s: string) {
  return s === "approved" ? "emerald" : s === "submitted" ? "blue" : s === "partial" ? "amber" : "red"
}
export function toneForRisk(s: string) {
  return s === "high" ? "red" : s === "medium" ? "amber" : "emerald"
}
export function toneForMilestone(s: string) {
  return s === "completed" ? "emerald" : s === "review" ? "violet" : s === "awaiting_evidence" ? "amber" : s === "in_progress" ? "blue" : "slate"
}
export function toneForEscrowState(s: string) {
  if (["released", "ready_to_release"].includes(s)) return "emerald"
  if (["disputed", "failed"].includes(s)) return "red"
  if (["evidence_pending", "review_pending", "partially_released"].includes(s)) return "amber"
  if (["refunded", "cancelled"].includes(s)) return "slate"
  return "blue"
}
export function humanise(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

// ── Confirm modal (destructive / financial actions) ─────────────────────────
export function ConfirmModal({
  title, message, confirmLabel = "Confirm", tone = "blue", onConfirm, onClose,
  requireReason = false, blocked = false, blockedMessage,
}: {
  title: string
  message: string
  confirmLabel?: string
  tone?: "blue" | "red" | "emerald" | "amber"
  onConfirm: (reason?: string) => void
  onClose: () => void
  requireReason?: boolean
  blocked?: boolean
  blockedMessage?: string
}) {
  const [reason, setReason] = React.useState("")
  const btn = {
    blue: "bg-[var(--brand)] hover:bg-[var(--brand-strong)]",
    red: "bg-red-600 hover:bg-red-700",
    emerald: "bg-emerald-600 hover:bg-emerald-700",
    amber: "bg-amber-600 hover:bg-amber-700",
  }[tone]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-slate-600">{message}</p>
          {blocked && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 font-medium">
              {blockedMessage ?? "This action is blocked."}
            </div>
          )}
          {requireReason && !blocked && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Reason (required)</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={2}
                placeholder="Add a reason for the audit log…"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] resize-none"
              />
            </div>
          )}
        </div>
        <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button
            disabled={blocked || (requireReason && !reason.trim())}
            onClick={() => onConfirm(reason.trim() || undefined)}
            className={cn("px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50", btn)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pager footer ("Showing X to Y of N") ────────────────────────────────────
export function PagerFooter({ shown, total }: { shown: number; total: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
      <span>Showing 1 to {shown} of {total}</span>
      <div className="flex items-center gap-1">
        <button disabled className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-400 disabled:opacity-50">Previous</button>
        <button disabled className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-400 disabled:opacity-50">Next</button>
      </div>
    </div>
  )
}

// ── Filter select ───────────────────────────────────────────────────────────
export function Select({ value, onChange, placeholder, options, humaniseOpt }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: string[]; humaniseOpt?: boolean
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] bg-white">
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{humaniseOpt ? humanise(o) : o}</option>)}
    </select>
  )
}

// ── Source pill (live vs sample) ────────────────────────────────────────────
export function SourcePill({ source }: { source: "live" | "seed" }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
      source === "live" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500")}>
      <span className={cn("w-1.5 h-1.5 rounded-full", source === "live" ? "bg-emerald-500" : "bg-slate-400")} />
      {source === "live" ? "Live data" : "Sample data"}
    </span>
  )
}
