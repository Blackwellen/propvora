"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, CheckCircle2, CircleAlert, LockKeyhole, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { fmtMoney } from "./primitives"
import type { BookingRow, BookableListing } from "./server"
import {
  BOOKING_FEATURE_FLAGS,
  BOOKING_LIFECYCLE,
  BOOKING_MODULES,
  SECTION_WORKFLOWS,
  buildBookingOpsSnapshot,
  type BookingSectionKey,
} from "./module"

interface Props {
  bookings: BookingRow[]
  listings: BookableListing[]
  activeSection?: BookingSectionKey
  compact?: boolean
}

const PHASE_LABEL = {
  live: "Live",
  foundation: "Foundation",
  ops: "Ops",
  legal: "Legal",
}

function MiniMetric({
  label,
  value,
  icon: Icon,
  tone = "blue",
}: {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: "blue" | "emerald" | "amber" | "red" | "violet"
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    violet: "bg-violet-50 text-violet-700",
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className={cn("w-9 h-9 rounded-lg flex items-center justify-center", tones[tone])}>
          <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="text-lg font-bold text-slate-900 tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  )
}

export function BookingModuleNav({
  activeSection = "dashboard",
}: {
  activeSection?: BookingSectionKey
}) {
  const pathname = usePathname()

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Booking Management</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-px bg-slate-100">
        {BOOKING_MODULES.map((item) => {
          const Icon = item.icon
          const active =
            item.key === activeSection ||
            (item.href === "/property-manager/bookings" ? pathname === item.href : pathname.startsWith(item.href))
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "min-h-[98px] bg-white p-4 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
                active && "bg-blue-50/70"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    active ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-500"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    item.phase === "live" && "bg-emerald-50 text-emerald-700",
                    item.phase === "foundation" && "bg-blue-50 text-blue-700",
                    item.phase === "ops" && "bg-amber-50 text-amber-700",
                    item.phase === "legal" && "bg-violet-50 text-violet-700"
                  )}
                >
                  {PHASE_LABEL[item.phase]}
                </span>
              </div>
              <p className="mt-2 text-[13px] font-semibold text-slate-900 leading-tight">{item.label}</p>
              <p className="mt-1 text-[11px] leading-snug text-slate-500 line-clamp-2">{item.summary}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function BookingManagementCanvas({
  bookings,
  listings,
  activeSection = "dashboard",
  compact = false,
}: Props) {
  const snapshot = buildBookingOpsSnapshot(bookings, listings)
  const workflow = SECTION_WORKFLOWS[activeSection]

  return (
    <div className="space-y-5">
      <BookingModuleNav activeSection={activeSection} />

      {!compact && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MiniMetric label="Arrivals today" value={snapshot.arrivalsToday.length} icon={BOOKING_MODULES[1].icon} tone="blue" />
            <MiniMetric label="Departures" value={snapshot.departuresToday.length} icon={BOOKING_MODULES[10].icon} tone="amber" />
            <MiniMetric label="Payment issues" value={snapshot.paymentIssues.length} icon={BOOKING_MODULES[7].icon} tone={snapshot.paymentIssues.length ? "red" : "emerald"} />
            <MiniMetric label="ADR" value={fmtMoney(snapshot.adrPence, snapshot.currency)} icon={BOOKING_MODULES[17].icon} tone="violet" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-5">
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Lifecycle Coverage</h3>
                  <p className="text-xs text-slate-500 mt-0.5">The booking flow now maps the full setup-to-post-stay operating model.</p>
                </div>
                <span className="text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 px-2.5 py-1">
                  10 stages
                </span>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                {BOOKING_LIFECYCLE.map((stage) => {
                  const Icon = stage.icon
                  return (
                    <div key={stage.label} className="rounded-xl border border-slate-100 bg-slate-50/50 px-3.5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-blue-600">
                          <Icon className="w-4 h-4" />
                        </span>
                        <p className="text-[13px] font-semibold text-slate-800">{stage.label}</p>
                      </div>
                      <p className="mt-2 text-[11.5px] leading-snug text-slate-500">{stage.detail}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Readiness Checklist</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Publish blockers are visible before a listing can accept direct bookings.</p>
                </div>
                <div className="p-5 space-y-2.5">
                  {snapshot.readiness.map((item) => (
                    <div key={item.label} className="flex items-start gap-2.5">
                      {item.done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <CircleAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-800">{item.label}</p>
                        {!item.done && item.blocker && <p className="text-[11.5px] text-slate-500">{item.blocker}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Controlled Feature Flags</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Marketplace and escrow stay gated until product, legal and payment review.</p>
                </div>
                <div className="p-5 grid grid-cols-1 gap-2">
                  {BOOKING_FEATURE_FLAGS.map((flag) => (
                    <div key={flag} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                      <LockKeyhole className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[12px] font-mono text-slate-600">{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Section Workflow</h3>
            <p className="text-xs text-slate-500 mt-0.5">Operational scope for this booking management area.</p>
          </div>
          {activeSection !== "dashboard" && (
            <Link href="/property-manager/bookings" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800">
              Command center <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {workflow.map((item) => (
            <div key={item} className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <p className="mt-2 text-[13px] font-medium text-slate-800 leading-snug">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BookingManagementCanvas
