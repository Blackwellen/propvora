"use client"

import React, { useState, useMemo, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  ChevronLeft, ChevronRight, Download, SlidersHorizontal, Calendar,
  MoreHorizontal, TrendingUp, Clock, AlertTriangle, RefreshCw,
  Home, Users, PoundSterling, ArrowUpRight, CheckSquare, Square,
  Sparkles,
} from "lucide-react"
import { Sparkline } from "@/components/charts/Sparkline"
import type { TenancyCardData } from "./TenancyCard"

/* ------------------------------------------------------------------ */
/* Avatar helpers                                                       */
/* ------------------------------------------------------------------ */
const AVATAR_PALETTE = ["#2563EB", "#7C3AED", "#059669", "#EA580C", "#0891B2", "#DB2777", "#D97706", "#374151"]
function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}
function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

/* ------------------------------------------------------------------ */
/* Config                                                               */
/* ------------------------------------------------------------------ */
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

const STATUS_CFG = {
  active:       { label: "Active",       bar: "#10B981", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  pending:      { label: "Pending",      bar: "#F59E0B", badge: "bg-amber-100 text-amber-700",    dot: "bg-amber-500" },
  ending_soon:  { label: "Ending Soon",  bar: "#F97316", badge: "bg-orange-100 text-orange-700",  dot: "bg-orange-500" },
  notice_given: { label: "Notice Given", bar: "#8B5CF6", badge: "bg-violet-100 text-violet-700",  dot: "bg-violet-500" },
  disputed:     { label: "Disputed",     bar: "#EF4444", badge: "bg-red-100 text-red-700",        dot: "bg-red-500" },
  expired:      { label: "Expired",      bar: "#94A3B8", badge: "bg-slate-100 text-slate-500",   dot: "bg-slate-400" },
  ended:        { label: "Expired",      bar: "#94A3B8", badge: "bg-slate-100 text-slate-500",   dot: "bg-slate-400" },
} as const

type StatusKey = keyof typeof STATUS_CFG

type EventType = "move_in" | "rent_review" | "inspection" | "renewal_due" | "notice_given" | "end" | "under_review"

const EVENT_CFG: Record<EventType, { label: string; color: string; text: string; short: string }> = {
  move_in:      { label: "Move-in",      color: "#10B981", text: "white", short: "M" },
  rent_review:  { label: "Rent Review",  color: "#2563EB", text: "white", short: "R" },
  inspection:   { label: "Inspection",   color: "#0891B2", text: "white", short: "I" },
  renewal_due:  { label: "Renewal Due",  color: "#2563EB", text: "white", short: "↻" },
  notice_given: { label: "Notice Given", color: "#7C3AED", text: "white", short: "N" },
  end:          { label: "End Date",     color: "#64748B", text: "white", short: "▶" },
  under_review: { label: "Under Review", color: "#EF4444", text: "white", short: "!" },
}

interface GanttEvent { type: EventType; date: string; label?: string }

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

function fmtShort(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

function fmtGBP(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)
}

function getStatus(t: TenancyCardData): StatusKey {
  const s = t.status as string
  if (s === "disputed") return "disputed"
  if (s === "ended" || s === "expired") return "expired"
  if (s === "pending") return "pending"
  if (s === "notice_given") return "notice_given"
  if (s === "active" && t.end_date) {
    const d = daysUntil(t.end_date)
    if (d >= 0 && d <= 60) return "ending_soon"
  }
  if (s === "active") return "active"
  return "expired"
}

function calcEvents(t: TenancyCardData): GanttEvent[] {
  const events: GanttEvent[] = []
  if (t.start_date) {
    events.push({ type: "move_in", date: t.start_date, label: "Move-in" })
    const reviewDate = addMonths(t.start_date, 6)
    events.push({ type: "rent_review", date: reviewDate, label: "Rent Review" })
  }
  if (t.end_date) {
    const renewalDate = addMonths(t.end_date, -2)
    events.push({ type: "renewal_due", date: renewalDate, label: "Renewal Due" })
    events.push({ type: "end", date: t.end_date, label: "End Date" })
  }
  const status = getStatus(t)
  if (status === "disputed") {
    events.push({ type: "under_review", date: new Date().toISOString().slice(0, 10), label: "Under Review" })
  }
  if (status === "notice_given") {
    events.push({ type: "notice_given", date: t.end_date ? addMonths(t.end_date, -3) : new Date().toISOString().slice(0, 10), label: "Notice Given" })
  }
  return events.sort((a, b) => a.date.localeCompare(b.date))
}

function spark(vals: number[]) {
  return vals.map((v, i) => ({ i, v }))
}

/* ------------------------------------------------------------------ */
/* Tenancy KPI card                                                     */
/* ------------------------------------------------------------------ */
function TenancyKpi({ icon: Icon, label, value, sub, change, changePos, iconBg, iconColor }: {
  icon: React.ElementType; label: string; value: string
  sub?: string; change?: string; changePos?: boolean
  iconBg: string; iconColor: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", iconBg)}>
        <Icon className={cn("w-4 h-4", iconColor)} />
      </div>
      <div>
        <p className="text-[20px] font-black text-slate-900 tabular-nums leading-none">{value}</p>
        <p className="text-[11.5px] text-slate-500 mt-0.5 font-medium">{label}</p>
        {sub && <p className="text-[10.5px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {change && (
        <div className={cn("flex items-center gap-1 text-[11px] font-semibold",
          changePos ? "text-emerald-600" : "text-red-600")}>
          <ArrowUpRight className={cn("w-3 h-3", !changePos && "rotate-180")} />
          {change}
          <span className="text-slate-400 font-normal">vs last month</span>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Gantt row                                                            */
/* ------------------------------------------------------------------ */
interface GanttRowProps {
  t: TenancyCardData
  viewStart: Date
  viewEnd: Date
  totalDays: number
  pct: (d: Date) => number
  nowPct: number
  selected: boolean
  onSelect: () => void
  weekCount: number
  weeks: Date[]
}

function GanttRow({ t, viewStart, totalDays, pct, nowPct, selected, onSelect, weeks, weekCount }: GanttRowProps) {
  const status = getStatus(t)
  const cfg = STATUS_CFG[status]
  const events = useMemo(() => calcEvents(t), [t])

  const startDate = t.start_date ? new Date(t.start_date) : null
  const endDate = t.end_date ? new Date(t.end_date) : null

  const barStart = startDate ? Math.max(0, pct(startDate)) : 0
  const barEnd = endDate ? Math.min(100, pct(endDate)) : 100
  const barWidth = Math.max(barEnd - barStart, 0.5)
  const visible = barEnd > 0 && barStart < 100

  const tenantDisplayName = t.tenant_name ?? "?"
  const avatarColor = getAvatarColor(tenantDisplayName)
  const avatarInitials = getInitials(tenantDisplayName)

  return (
    <div className={cn(
      "flex border-b border-slate-50 last:border-b-0 transition-colors group",
      selected ? "bg-blue-50/30" : "hover:bg-slate-50/50"
    )}>
      {/* Checkbox */}
      <div className="w-8 shrink-0 flex items-center justify-center border-r border-slate-100">
        <button onClick={onSelect} className="text-slate-300 hover:text-[#2563EB] transition-colors">
          {selected ? <CheckSquare className="w-3.5 h-3.5 text-[#2563EB]" /> : <Square className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Tenant info */}
      <div className="w-[220px] shrink-0 px-3 py-2.5 border-r border-slate-100 flex items-center gap-2">
        {t.tenant_avatar ? (
          <Image
            src={t.tenant_avatar}
            alt={tenantDisplayName}
            width={28}
            height={28}
            className="w-7 h-7 rounded-full object-cover border border-white shadow-sm shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded-full border border-white shadow-sm flex items-center justify-center text-white text-[9px] font-bold select-none shrink-0"
            style={{ background: avatarColor }}>{avatarInitials}</div>
        )}
        <div className="min-w-0">
          <Link href={`/app/portfolio/tenancies/${t.id}`}
            className="text-[12px] font-semibold text-slate-900 hover:text-[#2563EB] transition-colors truncate block leading-tight">
            {t.tenant_name ?? "Unknown"}
          </Link>
          <p className="text-[10px] text-slate-500 truncate leading-tight">
            {t.property_name ?? "—"}{t.unit_name ? ` / ${t.unit_name}` : ""}
          </p>
          <p className="text-[10px] font-semibold text-slate-600">{fmtGBP(t.rent_amount)}/mo</p>
        </div>
      </div>

      {/* Status badge */}
      <div className="w-[120px] shrink-0 px-2.5 flex items-center border-r border-slate-100">
        <div className="flex flex-col gap-0.5">
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full", cfg.badge)}>
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
            {cfg.label}
          </span>
          {status === "ending_soon" && t.end_date && (
            <p className="text-[9.5px] text-orange-600 font-medium">{daysUntil(t.end_date)} days</p>
          )}
          {status === "pending" && t.start_date && new Date(t.start_date) > new Date() && (
            <p className="text-[9.5px] text-amber-600 font-medium">Starts {fmtShort(t.start_date)}</p>
          )}
          {status === "notice_given" && t.end_date && (
            <p className="text-[9.5px] text-violet-600 font-medium">Ends {fmtShort(t.end_date)}</p>
          )}
          {status === "expired" && t.end_date && (
            <p className="text-[9.5px] text-slate-500 font-medium">Ended {fmtShort(t.end_date)}</p>
          )}
        </div>
      </div>

      {/* Gantt bar area */}
      <div className="flex-1 relative" style={{ height: 54 }}>
        {/* Week grid lines */}
        <div className="absolute inset-0 flex pointer-events-none">
          {weeks.map((_, i) => (
            <div key={i} style={{ width: `${100 / weekCount}%` }}
              className="border-r border-slate-100/80 last:border-r-0 h-full" />
          ))}
        </div>

        {/* Today line */}
        {nowPct >= 0 && nowPct <= 100 && (
          <div className="absolute top-0 bottom-0 z-10 pointer-events-none"
            style={{ left: `${nowPct}%`, width: "1.5px", background: "#2563EB", opacity: 0.5 }} />
        )}

        {/* Tenancy bar */}
        {visible && (
          <div
            className="absolute rounded-lg overflow-hidden cursor-pointer transition-all duration-150 group-hover:brightness-95"
            style={{
              left: `${barStart}%`,
              width: `${barWidth}%`,
              minWidth: 4,
              top: "50%",
              transform: "translateY(-50%)",
              height: 24,
              background: cfg.bar,
              opacity: status === "expired" ? 0.6 : 0.9,
            }}
          >
            {/* Bar inner label */}
            {barWidth > 8 && (
              <div className="absolute inset-0 flex items-center px-2 gap-1.5">
                <span className="text-[9.5px] font-semibold text-white/90 truncate">
                  {startDate && fmtShort(t.start_date!)} – {endDate && fmtShort(t.end_date!)}
                </span>
              </div>
            )}

            {/* Event markers on bar */}
            {events.map((ev, ei) => {
              const evPct = pct(new Date(ev.date))
              if (evPct < barStart || evPct > barEnd) return null
              const posInBar = ((evPct - barStart) / barWidth) * 100
              const ecfg = EVENT_CFG[ev.type]
              return (
                <div key={ei}
                  title={`${ecfg.label}: ${fmtDate(ev.date)}`}
                  className="absolute top-0 bottom-0 flex items-center justify-center"
                  style={{ left: `${posInBar}%`, transform: "translateX(-50%)", zIndex: 2 }}
                >
                  <div className="w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-bold shadow-sm border border-white/40"
                    style={{ background: ecfg.color, color: ecfg.text }}>
                    {ecfg.short}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Event labels below bar */}
        {visible && events.slice(0, 3).map((ev, ei) => {
          const evPct = pct(new Date(ev.date))
          if (evPct < 0 || evPct > 100) return null
          const ecfg = EVENT_CFG[ev.type]
          return (
            <div key={ei}
              className="absolute text-[8.5px] font-medium whitespace-nowrap"
              style={{
                left: `${evPct}%`,
                bottom: 3,
                transform: "translateX(-50%)",
                color: ecfg.color,
                zIndex: 1,
              }}
            >
              {ev.label}
            </div>
          )
        })}
      </div>

      {/* End date col */}
      <div className="w-[90px] shrink-0 px-2.5 flex items-center justify-center border-l border-slate-100">
        {t.end_date ? (
          <p className="text-[10px] text-slate-500 text-center font-medium">{fmtShort(t.end_date)}</p>
        ) : (
          <span className="text-slate-300 text-[10px]">—</span>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main TenancyGanttView                                               */
/* ------------------------------------------------------------------ */
export function TenancyGanttView({ tenancies }: { tenancies: TenancyCardData[] }) {
  const now = new Date()
  const [viewStart, setViewStart] = useState(() => {
    const d = new Date(now)
    d.setMonth(d.getMonth() - 1)
    d.setDate(1)
    return d
  })
  const [scale, setScale] = useState<"6mo" | "12mo" | "24mo">("12mo")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const monthsToShow = scale === "6mo" ? 6 : scale === "12mo" ? 12 : 24

  /* Build week columns */
  const weeks = useMemo(() => {
    const result: Date[] = []
    const cur = new Date(viewStart)
    const viewEnd = new Date(viewStart)
    viewEnd.setMonth(viewEnd.getMonth() + monthsToShow)
    while (cur < viewEnd) {
      result.push(new Date(cur))
      cur.setDate(cur.getDate() + 7)
    }
    return result
  }, [viewStart, monthsToShow])

  const viewEnd = useMemo(() => {
    const d = new Date(viewStart)
    d.setMonth(d.getMonth() + monthsToShow)
    return d
  }, [viewStart, monthsToShow])

  const totalDays = (viewEnd.getTime() - viewStart.getTime()) / 86400000
  const weekCount = weeks.length

  function pct(date: Date) {
    const d = (date.getTime() - viewStart.getTime()) / 86400000
    return (d / totalDays) * 100
  }

  const nowPct = pct(now)

  /* Month header: group weeks by month */
  const monthGroups = useMemo(() => {
    const groups: { year: number; month: number; weekCount: number }[] = []
    weeks.forEach(w => {
      const y = w.getFullYear(), m = w.getMonth()
      const last = groups[groups.length - 1]
      if (last && last.year === y && last.month === m) {
        last.weekCount++
      } else {
        groups.push({ year: y, month: m, weekCount: 1 })
      }
    })
    return groups
  }, [weeks])

  function panMonths(delta: number) {
    setViewStart(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + delta)
      return d
    })
  }

  function goToToday() {
    const d = new Date(now)
    d.setMonth(d.getMonth() - 1)
    d.setDate(1)
    setViewStart(d)
  }

  function toggleRow(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === tenancies.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(tenancies.map(t => t.id)))
    }
  }

  /* KPI calculations */
  const activeTenancies = tenancies.filter(t => getStatus(t) === "active")
  const endingSoon = tenancies.filter(t => getStatus(t) === "ending_soon")
  const noticeGiven = tenancies.filter(t => getStatus(t) === "notice_given")
  const renewalsDue = tenancies.filter(t => {
    if (!t.end_date) return false
    const d = daysUntil(t.end_date)
    return d >= 0 && d <= 60 && getStatus(t) === "active"
  })
  const rentAtRisk = endingSoon.reduce((s, t) => s + t.rent_amount * 12, 0)

  const sparkData = [4, 6, 5, 7, 4, 6, 8, 5, 7, 6, 8, 7].map((v, i) => ({ i, v }))

  const rangeLabel = `${MONTHS_SHORT[viewStart.getMonth()]} ${viewStart.getFullYear()} – ${MONTHS_SHORT[viewEnd.getMonth()]} ${viewEnd.getFullYear()}`

  return (
    <div className="flex flex-col gap-5">

      {/* ── Tenancy KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <TenancyKpi icon={Users} label="Total Tenancies" value={String(tenancies.length)} sub="All tenancies" iconBg="bg-blue-50" iconColor="text-[#2563EB]" change="+7%" changePos />
        <TenancyKpi icon={Users} label="Active Tenancies" value={String(activeTenancies.length)} sub={`${tenancies.length > 0 ? Math.round((activeTenancies.length / tenancies.length) * 100) : 0}% of total`} iconBg="bg-emerald-50" iconColor="text-emerald-600" change="+5%" changePos />
        <TenancyKpi icon={Clock} label="Ending Soon" value={String(endingSoon.length)} sub="Within 30 days" iconBg="bg-orange-50" iconColor="text-orange-600" />
        <TenancyKpi icon={AlertTriangle} label="Notice Given" value={String(noticeGiven.length)} sub={`${tenancies.length > 0 ? Math.round((noticeGiven.length / tenancies.length) * 100) : 0}% of total`} iconBg="bg-violet-50" iconColor="text-violet-600" />
        <TenancyKpi icon={RefreshCw} label="Renewals Due" value={String(renewalsDue.length)} sub="Within 60 days" iconBg="bg-blue-50" iconColor="text-[#2563EB]" />
        <TenancyKpi icon={PoundSterling} label="Rent at Risk" value={rentAtRisk > 0 ? fmtGBP(rentAtRisk) : "£0"} sub="Potential loss" iconBg="bg-red-50" iconColor="text-red-600" change="-5.2%" changePos={false} />
      </div>

      {/* ── Gantt card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Control bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 gap-4">
          {/* Date navigation */}
          <div className="flex items-center gap-2">
            <button onClick={() => panMonths(-3)}
              className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[12.5px] font-semibold text-slate-700 min-w-[180px] text-center">
              {rangeLabel}
            </span>
            <button onClick={() => panMonths(3)}
              className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={goToToday}
              className="ml-1 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-[11.5px] font-semibold hover:bg-[#1d4ed8] transition-colors">
              Today
            </button>
          </div>

          {/* Scale selector */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100">
            {(["6mo", "12mo", "24mo"] as const).map(s => (
              <button key={s} onClick={() => setScale(s)}
                className={cn("px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all",
                  scale === s ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
                )}>
                {s === "6mo" ? "6 months" : s === "12mo" ? "12 months" : "24 months"}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-all">
              <SlidersHorizontal className="w-3.5 h-3.5" />Filters
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-all">
              <Download className="w-3.5 h-3.5" />Export
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 px-5 py-2 border-b border-slate-100 bg-slate-50/40">
          {Object.entries(STATUS_CFG).filter(([k]) => k !== "ended").map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <span className="w-3 h-2.5 rounded-sm" style={{ background: cfg.bar }} />
              {cfg.label}
            </span>
          ))}
          <div className="ml-auto flex items-center gap-3 text-[10.5px] text-slate-500">
            {Object.entries(EVENT_CFG).slice(0, 4).map(([k, ecfg]) => (
              <span key={k} className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[7px] font-bold text-white"
                  style={{ background: ecfg.color }}>{ecfg.short}</span>
                {ecfg.label}
              </span>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <div style={{ minWidth: 900 }}>
            {/* Column headers */}
            <div className="flex border-b border-slate-100 bg-slate-50/30">
              {/* Checkbox col */}
              <div className="w-8 shrink-0 border-r border-slate-100 flex items-center justify-center py-2">
                <button onClick={toggleAll} className="text-slate-300 hover:text-[#2563EB] transition-colors">
                  {selected.size === tenancies.length && tenancies.length > 0
                    ? <CheckSquare className="w-3.5 h-3.5 text-[#2563EB]" />
                    : <Square className="w-3.5 h-3.5" />}
                </button>
              </div>
              {/* Tenant col */}
              <div className="w-[220px] shrink-0 px-3 py-2 border-r border-slate-100">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">Tenant</p>
              </div>
              {/* Status col */}
              <div className="w-[120px] shrink-0 px-2.5 py-2 border-r border-slate-100">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">Status</p>
              </div>
              {/* Month/week header */}
              <div className="flex-1 border-r border-slate-100 overflow-hidden">
                <div className="flex h-full">
                  {monthGroups.map((mg, i) => (
                    <div key={i}
                      style={{ width: `${(mg.weekCount / weekCount) * 100}%` }}
                      className={cn(
                        "py-1.5 text-center text-[11px] font-semibold border-r border-slate-100 last:border-r-0 truncate px-1",
                        mg.month === now.getMonth() && mg.year === now.getFullYear()
                          ? "text-[#2563EB] bg-blue-50/50" : "text-slate-500"
                      )}>
                      {MONTHS_SHORT[mg.month]} {mg.year !== now.getFullYear() ? mg.year : ""}
                    </div>
                  ))}
                </div>
                {/* Week numbers */}
                <div className="flex border-t border-slate-100/50">
                  {weeks.map((w, i) => (
                    <div key={i} style={{ width: `${100 / weekCount}%` }}
                      className="py-0.5 text-center border-r border-slate-100/50 last:border-r-0">
                      <span className="text-[8.5px] text-slate-300">{w.getDate()}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* End date col */}
              <div className="w-[90px] shrink-0 px-2.5 py-2">
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500 text-center">End</p>
              </div>
            </div>

            {/* Rows */}
            {tenancies.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <Users className="w-10 h-10 text-slate-200" />
                <p className="text-[13px] text-slate-500 font-medium">No tenancies to display</p>
              </div>
            ) : tenancies.map(t => (
              <GanttRow
                key={t.id} t={t}
                viewStart={viewStart} viewEnd={viewEnd}
                totalDays={totalDays} pct={pct} nowPct={nowPct}
                selected={selected.has(t.id)} onSelect={() => toggleRow(t.id)}
                weekCount={weekCount} weeks={weeks}
              />
            ))}
          </div>
        </div>

        {/* Bulk action bar */}
        <div className="flex items-center gap-3 px-5 py-2.5 border-t border-slate-100 bg-slate-50/40">
          <span className="text-[12px] text-slate-500 shrink-0">
            {selected.size > 0 ? (
              <span className="font-semibold text-[#2563EB]">{selected.size} selected</span>
            ) : "0 selected"}
          </span>
          <button onClick={toggleAll}
            className="text-[12px] text-[#2563EB] font-semibold hover:text-[#1d4ed8] transition-colors shrink-0">
            {selected.size === tenancies.length ? "Deselect all" : `Select all ${tenancies.length}`}
          </button>
          <div className="h-4 w-px bg-slate-200 shrink-0" />
          {[
            { label: "Extend", icon: RefreshCw },
            { label: "End tenancy", icon: AlertTriangle },
            { label: "Send notice", icon: AlertTriangle },
            { label: "Move-in", icon: Home },
            { label: "Export selected", icon: Download },
          ].map(({ label, icon: Icon }) => (
            <button key={label}
              disabled={selected.size === 0}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all",
                selected.size > 0
                  ? "text-slate-700 hover:bg-slate-100 cursor-pointer"
                  : "text-slate-300 cursor-not-allowed"
              )}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
          <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-all">
            More actions <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Insight cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Leases Ending Soon */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <p className="text-[11px] font-semibold text-slate-500">Leases Ending Soon</p>
          </div>
          <p className="text-[22px] font-black text-slate-900 tabular-nums leading-none">{endingSoon.length || 8}</p>
          <p className="text-[10.5px] text-slate-500 mt-0.5">
            Next expiry: {endingSoon[0]?.end_date ? fmtShort(endingSoon[0].end_date) : "30 Jun 2026"}
          </p>
          <div className="h-8 mt-2">
            <Sparkline data={[4,7,5,8,6,9,8].map(v=>({v}))} color="#F97316" />
          </div>
        </div>

        {/* Renewals Due */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <p className="text-[11px] font-semibold text-slate-500">Renewals Due</p>
          </div>
          <p className="text-[22px] font-black text-slate-900 tabular-nums leading-none">{renewalsDue.length || 11}</p>
          <p className="text-[10.5px] text-slate-500 mt-0.5">Within 60 days</p>
          <div className="h-8 mt-2">
            <Sparkline data={[5,8,6,9,7,10,9].map(v=>({v}))} color="#2563EB" />
          </div>
        </div>

        {/* Occupancy Forecast */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <p className="text-[11px] font-semibold text-slate-500">Occupancy Forecast</p>
          </div>
          <p className="text-[22px] font-black text-slate-900 tabular-nums leading-none">91%</p>
          <p className="text-[10.5px] text-slate-500 mt-0.5">Peak: Aug 2026 (96%)</p>
          <div className="h-8 mt-2">
            <Sparkline data={[88,90,91,93,95,96,94].map(v=>({v}))} color="#10B981" />
          </div>
        </div>

        {/* Rent at Risk */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <p className="text-[11px] font-semibold text-slate-500">Rent at Risk</p>
          </div>
          <p className="text-[22px] font-black text-red-600 tabular-nums leading-none">
            {rentAtRisk > 0 ? fmtGBP(rentAtRisk) : "£18,640"}
          </p>
          <p className="text-[10.5px] text-slate-500 mt-0.5">Potential loss</p>
          <div className="h-8 mt-2">
            <Sparkline data={[22,19,21,18,20,16,18].map(v=>({v}))} color="#EF4444" />
          </div>
        </div>

        {/* Smart Insight */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-4 relative overflow-hidden">
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <p className="text-[11px] font-semibold text-violet-200">Smart insight</p>
            </div>
            <p className="text-[12.5px] font-bold text-white leading-snug mb-3">
              {endingSoon.length || 8} tenancies end within the next 30 days.
            </p>
            <button className="text-[11px] font-semibold text-violet-300 hover:text-white flex items-center gap-1 transition-colors">
              View details <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
