"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader, SupplierCard, SupplierLoadingState, SupplierStatusBadge,
  toneForStatus, humaniseStatus,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import type { SupplierAssignmentRow } from "@/components/supplier-workspace/types"

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function SupplierCalendarPage() {
  const jobs = useSupplierApi<SupplierAssignmentRow[]>(
    useSupplierApiUrl("/api/supplier/jobs", { side: "supplier" }),
    { select: (j) => (j as { items?: SupplierAssignmentRow[] }).items ?? [] }
  )
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })

  const scheduledByDay = useMemo(() => {
    const map = new Map<string, SupplierAssignmentRow[]>()
    for (const j of jobs.data ?? []) {
      if (!j.scheduled_for) continue
      const key = ymd(new Date(j.scheduled_for))
      const arr = map.get(key) ?? []
      arr.push(j); map.set(key, arr)
    }
    return map
  }, [jobs.data])

  const grid = useMemo(() => {
    const year = cursor.getFullYear(), month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const startOffset = (first.getDay() + 6) % 7 // Mon-first
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [cursor])

  const todayKey = ymd(new Date())
  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
  const upcoming = (jobs.data ?? [])
    .filter((j) => j.scheduled_for && new Date(j.scheduled_for).getTime() >= Date.now() - 86400000)
    .sort((a, b) => new Date(a.scheduled_for!).getTime() - new Date(b.scheduled_for!).getTime())
    .slice(0, 6)

  return (
    <div className="space-y-5">
      <MobileTopBar title="Calendar" subtitle="Scheduled jobs" />
      <SupplierPageHeader title="Calendar" subtitle="Your scheduled jobs at a glance. Manage working hours under Availability." />

      {jobs.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={6} /></SupplierCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-4">
          <SupplierCard className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-slate-500" />
                <h2 className="text-base font-semibold text-slate-900">{monthLabel}</h2>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Previous month"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => { const d = new Date(); d.setDate(1); setCursor(d) }} className="px-2.5 h-8 rounded-lg hover:bg-slate-100 text-[13px] font-semibold text-slate-600">Today</button>
                <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Next month"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((d) => <div key={d} className="text-center text-[11px] font-semibold text-slate-400 py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((date, i) => {
                if (!date) return <div key={i} className="aspect-square" />
                const key = ymd(date)
                const dayJobs = scheduledByDay.get(key) ?? []
                const isToday = key === todayKey
                return (
                  <div key={i} className={cn("aspect-square rounded-lg border p-1 flex flex-col", isToday ? "border-[#2563EB] bg-blue-50/40" : "border-slate-100")}>
                    <span className={cn("text-[11px] font-semibold", isToday ? "text-[#2563EB]" : "text-slate-500")}>{date.getDate()}</span>
                    <div className="flex-1 flex flex-col gap-0.5 mt-0.5 overflow-hidden">
                      {dayJobs.slice(0, 2).map((j) => (
                        <Link key={j.id} href={`/supplier/jobs/${j.id}`} className="text-[9px] leading-tight font-medium px-1 py-0.5 rounded bg-[#0D1B2A] text-white truncate hover:bg-[#1E3A5F]">
                          {j.id.slice(0, 6)}
                        </Link>
                      ))}
                      {dayJobs.length > 2 && <span className="text-[9px] text-slate-400 px-1">+{dayJobs.length - 2}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </SupplierCard>

          <SupplierCard className="p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-3">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-400 py-3">No scheduled jobs yet. Accepted jobs with a date appear here and on the calendar.</p>
            ) : (
              <ul className="space-y-2.5">
                {upcoming.map((j) => (
                  <li key={j.id}>
                    <Link href={`/supplier/jobs/${j.id}`} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50">
                      <div className="w-11 shrink-0 text-center rounded-lg bg-blue-50 py-1">
                        <p className="text-[9px] font-bold text-blue-600 leading-none uppercase">{new Date(j.scheduled_for!).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">Job {j.id.slice(0, 8)}</p>
                        <p className="text-xs text-slate-400">{new Date(j.scheduled_for!).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <SupplierStatusBadge tone={toneForStatus(j.status)}>{humaniseStatus(j.status)}</SupplierStatusBadge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/supplier/availability" className="mt-4 inline-flex text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]">Set working hours →</Link>
          </SupplierCard>
        </div>
      )}
    </div>
  )
}
