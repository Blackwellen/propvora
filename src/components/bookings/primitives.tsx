"use client"

import Link from "next/link"
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  XCircle,
  Flag,
  CircleDot,
  Lock,
  CalendarRange,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ReservationStatus } from "./server"

/* ──────────────────────────────────────────────────────────────────────────
   Shared booking UI primitives — premium, light-token only (no `dark:`).
   Money is integer pence everywhere; format only at this edge via `fmtMoney`.
─────────────────────────────────────────────────────────────────────────── */

/** Format integer pence → localised currency string. The ONLY money edge. */
export function fmtMoney(pence: number, currency = "GBP", locale = "en-GB"): string {
  const value = (pence ?? 0) / 100
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value)
  }
}

export function fmtDate(iso: string | null, locale = "en-GB"): string {
  if (!iso) return "—"
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(d)
}

export function fmtDateShort(iso: string | null, locale = "en-GB"): string {
  if (!iso) return "—"
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d)
}

// ── Status badge ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ReservationStatus,
  { label: string; bg: string; text: string; dot: string; icon: React.ElementType }
> = {
  hold: { label: "Hold", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", icon: CircleDot },
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", icon: Clock },
  confirmed: { label: "Confirmed", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", icon: CheckCircle2 },
  checked_in: { label: "Checked in", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", icon: CalendarClock },
  checked_out: { label: "Checked out", bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500", icon: CalendarRange },
  completed: { label: "Completed", bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400", icon: Flag },
  cancelled: { label: "Cancelled", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", icon: XCircle },
}

export const STATUS_ORDER: ReservationStatus[] = [
  "hold",
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "completed",
  "cancelled",
]

export function statusMeta(status: ReservationStatus) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
}

export function BookingStatusBadge({
  status,
  size = "md",
}: {
  status: ReservationStatus
  size?: "sm" | "md"
}) {
  const c = statusMeta(status)
  const Icon = c.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        c.bg,
        c.text,
        size === "sm" ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[11px]"
      )}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {c.label}
    </span>
  )
}

// ── Indicative money chip ───────────────────────────────────────────────────

/**
 * Small "indicative" tag for money that hasn't been captured (payments are P5).
 * Keeps us honest: we never imply a charge/refund occurred without a real action.
 */
export function IndicativeTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700",
        className
      )}
      title="Indicative — payment capture lands in a later release"
    >
      <Info className="w-3 h-3" />
      Indicative
    </span>
  )
}

// ── KPI card (matches calendar/money KPI styling) ───────────────────────────

export interface BookingKpi {
  label: string
  value: number | string
  sub?: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}

export function BookingKpiCard({ kpi }: { kpi: BookingKpi }) {
  const Icon = kpi.icon
  return (
    <div className="flex flex-col gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", kpi.iconBg)}>
        <Icon className={cn("w-[18px] h-[18px]", kpi.iconColor)} />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide leading-tight mb-1">
          {kpi.label}
        </p>
        <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{kpi.value}</p>
        {kpi.sub && <p className="text-[11px] text-slate-400 mt-1 leading-tight">{kpi.sub}</p>}
      </div>
    </div>
  )
}

// ── Section shell states ────────────────────────────────────────────────────

/**
 * Entitlement upgrade prompt. Shown (never hidden) when the workspace isn't
 * entitled to booking management. Premium, centred, with a link to plans.
 */
export function BookingUpgradePrompt({
  planName,
  reason,
}: {
  planName: string
  reason?: string | null
}) {
  return (
    <div className="mt-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col items-center text-center py-20 px-6">
        <div className="w-20 h-20 rounded-3xl bg-[#EFF6FF] flex items-center justify-center mb-5">
          <Lock className="w-9 h-9 text-[#2563EB]" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Booking management isn&apos;t on your plan</h3>
        <p className="mt-1.5 max-w-md text-sm text-slate-500 text-pretty">
          {reason ??
            `Your ${planName} plan doesn't include direct booking management yet. Upgrade to publish bookable listings, take reservations and run your stay operations from Propvora.`}
        </p>
        <div className="mt-6 flex items-center gap-2">
          <Link
            href="/app/workspace-settings/subscription"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            View plans
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * "Not ready" state — the booking schema/libs aren't provisioned on this branch
 * yet. Distinct from an empty state: this is a system-readiness signal.
 */
export function BookingNotReady({
  title = "Booking management is being set up",
  description = "The reservations engine is still being provisioned for this workspace. Bookable listings and reservations will appear here as soon as it's ready.",
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col items-center text-center py-16 px-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
          <CalendarClock className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
        <p className="mt-1.5 max-w-md text-sm text-slate-500 text-pretty">{description}</p>
      </div>
    </div>
  )
}

/** Generic premium empty state for the booking surfaces. */
export function BookingEmptyState({
  icon: Icon = CalendarRange,
  title,
  description,
  action,
}: {
  icon?: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-col items-center text-center py-14 px-6">
        <div className="w-14 h-14 rounded-2xl bg-[#F0F7FF] flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-[#2563EB]" />
        </div>
        <h3 className="text-[15px] font-semibold text-slate-700">{title}</h3>
        {description && <p className="mt-1.5 max-w-sm text-sm text-slate-500 text-pretty">{description}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  )
}

// ── Fee breakdown panel ─────────────────────────────────────────────────────

export interface FeeLine {
  label: string
  pence: number
  muted?: boolean
}

export function FeeBreakdownPanel({
  lines,
  totalPence,
  currency,
  amountPaidPence,
}: {
  lines: FeeLine[]
  totalPence: number
  currency: string
  amountPaidPence: number
}) {
  const due = Math.max(0, totalPence - amountPaidPence)
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Price breakdown</h3>
        <IndicativeTag />
      </div>
      <div className="px-5 py-4 space-y-2.5">
        {lines.map((l) => (
          <div key={l.label} className="flex items-center justify-between text-sm">
            <span className={cn(l.muted ? "text-slate-400" : "text-slate-600")}>{l.label}</span>
            <span className={cn("tabular-nums font-medium", l.muted ? "text-slate-400" : "text-slate-700")}>
              {fmtMoney(l.pence, currency)}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100">
          <span className="text-sm font-semibold text-slate-900">Total</span>
          <span className="text-base font-bold text-slate-900 tabular-nums">{fmtMoney(totalPence, currency)}</span>
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-slate-400">Amount captured</span>
          <span className="tabular-nums text-slate-500">{fmtMoney(amountPaidPence, currency)}</span>
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-slate-400">Balance (indicative)</span>
          <span className="tabular-nums text-slate-500">{fmtMoney(due, currency)}</span>
        </div>
      </div>
      <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100">
        <p className="text-[11px] text-slate-400 leading-snug">
          Figures are indicative. No payment, capture or refund has been taken — payment processing arrives in a
          later release.
        </p>
      </div>
    </div>
  )
}
