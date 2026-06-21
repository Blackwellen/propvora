"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/Button"
import {
  ArrowLeft, Plus, Download, ChevronLeft, ChevronRight, Search,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkspace } from "@/providers/AuthProvider"
import { useTenancies } from "@/hooks/useTenancies"
import { useProperties } from "@/hooks/useProperties"
import { useUnits } from "@/hooks/useUnits"
import { exportCsv, daysUntil } from "@/lib/portfolio/helpers"
import MobileTopBar from "@/components/mobile/MobileTopBar"

/* ------------------------------------------------------------------ */
/* Types & data                                                         */
/* ------------------------------------------------------------------ */
type GanttStatus = "active" | "pending" | "notice" | "upcoming" | "expired"

interface GanttTenancy {
  id: string
  tenantName: string
  propertyName: string
  unitName: string
  startDate: string
  endDate: string
  status: GanttStatus
  rentAmount: number
}

const DEMO: GanttTenancy[] = []

/* ------------------------------------------------------------------ */
/* Status config                                                        */
/* ------------------------------------------------------------------ */
const STATUS_CFG: Record<GanttStatus, { label: string; bar: string; text: string }> = {
  active:   { label: "Active",   bar: "bg-emerald-400",  text: "text-emerald-700" },
  pending:  { label: "Pending",  bar: "bg-amber-400",    text: "text-amber-700" },
  notice:   { label: "Notice",   bar: "bg-red-400",      text: "text-red-700" },
  upcoming: { label: "Upcoming", bar: "bg-blue-300",     text: "text-blue-700" },
  expired:  { label: "Expired",  bar: "bg-slate-300",    text: "text-slate-600" },
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function addMonths(d: Date, n: number): Date {
  const r = new Date(d)
  r.setMonth(r.getMonth() + n)
  r.setDate(1)
  return r
}

function pct(start: Date, end: Date, viewStart: Date, viewEnd: Date): { left: number; width: number } | null {
  const total = viewEnd.getTime() - viewStart.getTime()
  const barStart = Math.max(start.getTime(), viewStart.getTime())
  const barEnd   = Math.min(end.getTime(),   viewEnd.getTime())
  if (barEnd <= barStart) return null
  return {
    left:  ((barStart - viewStart.getTime()) / total) * 100,
    width: ((barEnd   - barStart)           / total) * 100,
  }
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-GB", { month: "short" })
}

function yearLabel(d: Date): string {
  return String(d.getFullYear()).slice(2)
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)
}

function getAvatarColor(name: string): string {
  const palette = ["#2563EB", "#7C3AED", "#059669", "#EA580C", "#0891B2", "#DB2777", "#D97706", "#374151"]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

const MONTHS_SHOWN = 10

/* ------------------------------------------------------------------ */
/* Page (matches reference section 11)                                 */
/* ------------------------------------------------------------------ */
/* Derive a Gantt status from live tenancy status + dates. */
function deriveGanttStatus(status: string, startDate: string, endDate: string | null): GanttStatus {
  if (status === "ended" || status === "surrendered") return "expired"
  if (status === "disputed") return "notice"
  if (status === "pending") return "pending"
  const startsInFuture = startDate ? daysUntil(startDate) > 0 : false
  if (startsInFuture) return "upcoming"
  if (endDate && daysUntil(endDate) >= 0 && daysUntil(endDate) <= 60) return "notice"
  return "active"
}

export default function PortfolioTimelinePage() {
  const today = new Date()
  const [viewOffset, setViewOffset] = useState(0)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<GanttStatus | "all">("all")

  const { workspace } = useWorkspace()
  const { data: rawTenancies, isLoading: tenLoading } = useTenancies(workspace?.id)
  const { data: rawProps } = useProperties(workspace?.id)
  const { data: rawUnits } = useUnits(workspace?.id)
  const isLive = !!workspace?.id

  /* Live tenancies → Gantt rows, with seeded demo fallback. */
  const rows: GanttTenancy[] = useMemo(() => {
    if (!isLive) return DEMO
    if (!rawTenancies?.length) return []
    const propName = new Map((rawProps ?? []).map(p => [p.id, p.name]))
    const unitName = new Map((rawUnits ?? []).map(u => [u.id, u.unit_name]))
    return rawTenancies
      .filter(t => t.start_date && t.end_date)
      .map(t => {
        const prop = propName.get(t.property_id) ?? "Property"
        const unit = t.unit_id ? (unitName.get(t.unit_id) ?? "") : ""
        return {
          id: t.id,
          // No contact-name join in scope: label the row by its unit/property.
          tenantName: unit || prop,
          propertyName: prop,
          unitName: unit,
          startDate: t.start_date,
          endDate: t.end_date as string,
          status: deriveGanttStatus(t.status, t.start_date, t.end_date),
          rentAmount: t.rent_amount ?? 0,
        }
      })
  }, [rawTenancies, rawProps, rawUnits, isLive])

  const viewStart = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() - 2 + viewOffset, 1)
    return d
  }, [viewOffset])

  const viewEnd = useMemo(() => {
    const d = addMonths(viewStart, MONTHS_SHOWN)
    return d
  }, [viewStart])

  const months = useMemo(() => Array.from({ length: MONTHS_SHOWN }, (_, i) => addMonths(viewStart, i)), [viewStart])

  const filtered = useMemo(() => {
    let r = [...rows]
    if (search) r = r.filter(t => t.tenantName.toLowerCase().includes(search.toLowerCase()) || t.propertyName.toLowerCase().includes(search.toLowerCase()))
    if (filterStatus !== "all") r = r.filter(t => t.status === filterStatus)
    return r
  }, [rows, search, filterStatus])

  function handleExport() {
    exportCsv(
      filtered.map(t => ({
        label: t.tenantName, property: t.propertyName, unit: t.unitName,
        start_date: t.startDate, end_date: t.endDate, status: t.status, rent_amount: t.rentAmount,
      })),
      `tenancy-timeline-${new Date().toISOString().slice(0, 10)}.csv`,
    )
  }

  const todayPct = useMemo(() => {
    const total = viewEnd.getTime() - viewStart.getTime()
    const offset = today.getTime() - viewStart.getTime()
    if (offset < 0 || offset > total) return null
    return (offset / total) * 100
  }, [viewStart, viewEnd])

  const leftColW = 220

  return (
    <DashboardContainer>
      {/* Mobile top bar */}
      <MobileTopBar
        title="Tenancy Gantt"
        subtitle="Timeline view of tenancies"
        showBack
        backHref="/property-manager/portfolio"
        primaryAction={{ label: "New tenancy", icon: Plus, href: "/property-manager/portfolio/tenancies/new" }}
        overflowActions={[
          { label: "Export CSV", icon: Download, onClick: handleExport },
        ]}
      />

      {/* Desktop header — hidden on phones */}
      <div className="hidden md:block">
      <PageHeader
        title="Tenancy Gantt"
        description="Timeline view of all tenancies and occupancy periods"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" asChild><Link href="/property-manager/portfolio"><ArrowLeft className="w-4 h-4" />Portfolio</Link></Button>
            <Button variant="outline" size="md" onClick={handleExport} disabled={filtered.length === 0}><Download className="w-4 h-4" />Export</Button>
            <Button variant="primary" size="md" asChild><Link href="/property-manager/portfolio/tenancies/new"><Plus className="w-4 h-4" />New tenancy</Link></Button>
          </div>
        }
      />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tenancies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 pr-4 w-52 rounded-xl text-sm bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all shadow-sm"
          />
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["all", "active", "pending", "notice", "upcoming", "expired"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-3 h-8 rounded-lg text-[12px] font-semibold border transition-all",
                filterStatus === s
                  ? s === "all" ? "bg-slate-900 border-slate-900 text-white" : cn(STATUS_CFG[s as GanttStatus]?.bar.replace("bg-", "bg-").replace("400", "100"), "border-current/20", STATUS_CFG[s as GanttStatus]?.text)
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              )}
            >
              {s === "all" ? "All" : STATUS_CFG[s].label}
            </button>
          ))}
        </div>

        {/* Date navigation */}
        <div className="ml-auto flex items-center gap-1 bg-white border border-slate-200 rounded-xl shadow-sm p-1">
          <button onClick={() => setViewOffset(o => o - 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setViewOffset(0)} className="px-3 h-8 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Today</button>
          <button onClick={() => setViewOffset(o => o + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gantt chart — horizontal scroll on small screens keeps the grid intact */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
      <div className="min-w-[640px] md:min-w-0">
        {/* Month header */}
        <div className="flex border-b border-slate-200 bg-slate-50/80">
          {/* Left col header */}
          <div style={{ width: leftColW, minWidth: leftColW }} className="px-4 py-3 border-r border-slate-200 shrink-0">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tenancy</p>
          </div>

          {/* Month cells */}
          <div className="flex-1 flex">
            {months.map((m, i) => (
              <div key={i} className="flex-1 py-3 px-2 border-r border-slate-100 last:border-0 text-center">
                <p className="text-[11px] font-bold text-slate-700">{monthLabel(m)}</p>
                <p className="text-[10px] text-slate-500">{yearLabel(m)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        {isLive && tenLoading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex">
                <div style={{ width: leftColW, minWidth: leftColW }} className="px-4 py-3 border-r border-slate-100">
                  <div className="h-9 rounded-lg bg-slate-100 animate-pulse" />
                </div>
                <div className="flex-1 h-14 flex items-center px-4"><div className="h-8 w-1/2 rounded-full bg-slate-100 animate-pulse" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <Calendar className="w-9 h-9 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              {rows.length === 0 ? "No tenancies with start and end dates yet" : "No tenancies match"}
            </p>
            {rows.length === 0 && (
              <Button variant="primary" size="sm" asChild>
                <Link href="/property-manager/portfolio/tenancies/new"><Plus className="w-4 h-4" />Create tenancy</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((t) => {
              const start = new Date(t.startDate)
              const end   = new Date(t.endDate)
              const pos   = pct(start, end, viewStart, viewEnd)
              const cfg   = STATUS_CFG[t.status]

              return (
                <div key={t.id} className="flex hover:bg-slate-50/60 transition-colors group">
                  {/* Left info col */}
                  <div style={{ width: leftColW, minWidth: leftColW }} className="px-4 py-3 border-r border-slate-100 flex items-center gap-3 shrink-0">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm shrink-0 flex items-center justify-center text-white text-[11px] font-bold select-none"
                      style={{ background: getAvatarColor(t.tenantName) }}
                    >
                      {getInitials(t.tenantName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-slate-900 truncate">{t.tenantName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{t.propertyName}</p>
                    </div>
                  </div>

                  {/* Bar area */}
                  <div className="flex-1 relative h-14">
                    {/* Month grid lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {months.map((_, i) => <div key={i} className="flex-1 border-r border-slate-100 last:border-0" />)}
                    </div>

                    {/* Today line */}
                    {todayPct != null && (
                      <div className="absolute top-0 bottom-0 w-px bg-[#2563EB] z-10" style={{ left: `${todayPct}%` }}>
                        <div className="absolute -top-px -left-1.5 w-3 h-3 rounded-full bg-[#2563EB]" />
                      </div>
                    )}

                    {/* Tenancy bar */}
                    {pos && (
                      <div
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 h-8 rounded-full flex items-center px-3 shadow-sm transition-all",
                          cfg.bar,
                          "group-hover:brightness-95"
                        )}
                        style={{ left: `${pos.left}%`, width: `${Math.max(pos.width, 1.5)}%` }}
                        title={`${t.tenantName}: ${t.startDate} → ${t.endDate}`}
                      >
                        {pos.width > 12 && (
                          <span className="text-[10px] font-bold text-white truncate">
                            {new Date(t.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – {new Date(t.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Legend + summary footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/60 flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            {(["active", "pending", "notice", "upcoming", "expired"] as GanttStatus[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <div className={cn("w-3 h-3 rounded-full", STATUS_CFG[s].bar)} />
                {STATUS_CFG[s].label}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <div className="w-px h-3 bg-[#2563EB]" />
            Today
          </div>
        </div>
      </div>
      </div>
    </DashboardContainer>
  )
}
