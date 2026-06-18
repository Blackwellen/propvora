"use client"

import React, { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import {
  CalendarOff, CalendarClock, AlertTriangle, CalendarCheck, Plus, Pencil,
  Trash2, Bell, RefreshCcw, Repeat, Tag, CalendarDays, ListChecks, GanttChart, Activity,
} from "lucide-react"
import {
  SupplierCard, SupplierCardHeader, SupplierButton, SupplierLoadingState,
  SupplierPermissionDenied, SupplierStatusBadge,
} from "@/components/supplier-workspace/ui"
import { useScheduleTimeOff } from "../data/hooks"
import type { TimeOffReason } from "../data/types"
import { shortDate } from "@/components/supplier-workspace/format"
import { useScheduleToast, ViewToggle, LegendDot } from "./shared"

const REASON_STYLE: Record<TimeOffReason, { dot: string; tone: "emerald" | "amber" | "sky" | "violet" | "slate" | "blue" }> = {
  annual_leave: { dot: "bg-blue-400", tone: "blue" },
  pm_off: { dot: "bg-violet-400", tone: "violet" },
  personal: { dot: "bg-amber-400", tone: "amber" },
  training: { dot: "bg-emerald-400", tone: "emerald" },
  holiday: { dot: "bg-sky-400", tone: "sky" },
  other: { dot: "bg-slate-400", tone: "slate" },
}
const REASON_LABEL: Record<TimeOffReason, string> = {
  annual_leave: "Annual leave", pm_off: "PM off", personal: "Personal",
  training: "Training", holiday: "Holiday", other: "Other",
}
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function TimeOffTab() {
  const { data, loading, source, denied } = useScheduleTimeOff()
  const { push } = useScheduleToast()
  const [view, setView] = useState("calendar")
  const [autoDecline, setAutoDecline] = useState(data.settings.autoDecline)
  const [notify, setNotify] = useState(data.settings.notifyCustomers)

  const monthCells = useMemo(() => buildMonthGrid(data.blocks), [data.blocks])

  if (loading) return <SupplierLoadingState rows={7} />
  if (denied) return <SupplierPermissionDenied />

  const kpis = [
    { label: "Time off booked", value: `${data.kpis.timeOffBooked} days`, icon: CalendarOff },
    { label: "Upcoming blocked days", value: data.kpis.upcomingBlockedDays, icon: CalendarClock },
    { label: "Affected jobs", value: data.kpis.affectedJobs, icon: AlertTriangle },
    { label: "Available this month", value: `${data.kpis.availableThisMonth} days`, icon: CalendarCheck },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <SupplierCard key={k.label} className="p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{k.label}</span>
              <k.icon className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-2xl font-bold text-slate-900">{k.value}</span>
          </SupplierCard>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewToggle
          options={[
            { key: "calendar", label: "Calendar", icon: CalendarDays },
            { key: "list", label: "List", icon: ListChecks },
            { key: "timeline", label: "Timeline", icon: GanttChart },
            { key: "impact", label: "Impact", icon: Activity },
          ]}
          value={view}
          onChange={(v) => { setView(v); if (v !== "calendar") push(`${v} view`, "info") }}
        />
        <div className="flex items-center gap-2">
          <SupplierButton variant="outline" size="sm" onClick={() => push("Sync calendar (TODO)")}>
            <RefreshCcw className="w-4 h-4" /> Sync calendar
          </SupplierButton>
          <SupplierButton size="sm" onClick={() => push("Add time off — opening editor (TODO)")}>
            <Plus className="w-4 h-4" /> Add time off
          </SupplierButton>
        </div>
      </div>

      {source === "seed" && (
        <p className="text-xs text-slate-400">Showing example time off — your real bookings appear here.</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        {/* Calendar / list / timeline / impact */}
        <SupplierCard className="overflow-hidden">
          <SupplierCardHeader
            title={view === "impact" ? "Impact on accepted jobs" : view === "list" ? "All time off" : view === "timeline" ? "Time-off timeline" : "This month"}
          />
          <div className="p-4">
            {view === "impact" ? (
              <ImpactView data={data} push={push} />
            ) : view === "list" || view === "timeline" ? (
              <div className="space-y-2">
                {data.blocks.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                    <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", REASON_STYLE[b.reason].dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{b.title}</p>
                      <p className="text-xs text-slate-400">{shortDate(b.starts_at)} → {shortDate(b.ends_at)} · {b.allDay ? "All day" : "Part day"}</p>
                    </div>
                    {b.affectedJobs > 0 && <SupplierStatusBadge tone="amber">{b.affectedJobs} job{b.affectedJobs > 1 ? "s" : ""}</SupplierStatusBadge>}
                    {b.recurring && <SupplierStatusBadge tone="violet">Recurring</SupplierStatusBadge>}
                    <button onClick={() => push("Edit block (TODO)")} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => push("Block removed")} className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAYS.map((d) => <div key={d} className="text-center text-[10px] font-medium text-slate-400">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {monthCells.map((c, i) => (
                    <div key={i} className={cn("aspect-square rounded-md border p-1 text-[10px]",
                      c.inMonth ? "border-slate-100" : "border-transparent text-slate-300")}>
                      <span className={cn(c.isToday && "font-bold text-blue-600")}>{c.day}</span>
                      {c.reason && <div className={cn("mt-0.5 h-1.5 rounded-full", REASON_STYLE[c.reason].dot)} />}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {(Object.keys(REASON_LABEL) as TimeOffReason[]).slice(0, 5).map((r) => (
                    <LegendDot key={r} color={REASON_STYLE[r].dot} label={REASON_LABEL[r]} />
                  ))}
                </div>
              </>
            )}
          </div>
        </SupplierCard>

        {/* Right column */}
        <div className="space-y-4">
          <SupplierCard>
            <SupplierCardHeader title="Upcoming time off" />
            <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto">
              {data.blocks.map((b) => (
                <div key={b.id} className="flex items-center gap-2 px-4 py-2.5">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", REASON_STYLE[b.reason].dot)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">{b.title}</p>
                    <p className="text-xs text-slate-400">{shortDate(b.starts_at)}</p>
                  </div>
                  <SupplierStatusBadge tone={REASON_STYLE[b.reason].tone}>{REASON_LABEL[b.reason]}</SupplierStatusBadge>
                </div>
              ))}
            </div>
          </SupplierCard>

          <SupplierCard>
            <SupplierCardHeader title="Customer-facing availability" />
            <div className="p-4 grid grid-cols-7 gap-1">
              {DAYS.map((d, i) => (
                <div key={d} className="text-center">
                  <div className="text-[10px] font-medium text-slate-400">{d}</div>
                  <div className={cn("mt-1 h-7 rounded-md flex items-center justify-center text-[10px] font-semibold",
                    i >= 5 ? "bg-slate-100 text-slate-300" : "bg-emerald-100 text-emerald-700")}>
                    {i >= 5 ? "—" : "✓"}
                  </div>
                </div>
              ))}
            </div>
          </SupplierCard>

          <SupplierCard>
            <SupplierCardHeader title="Time-off settings" />
            <div className="p-4 space-y-3">
              <ToggleRow label="Auto-decline during time off" desc="New requests in blocked dates are declined automatically." value={autoDecline}
                onChange={() => { setAutoDecline((v) => !v); push(`Auto-decline ${!autoDecline ? "on" : "off"}`) }} />
              <ToggleRow label="Notify affected customers" desc="Tell customers when a booking overlaps time off." value={notify}
                onChange={() => { setNotify((v) => !v); push(`Notifications ${!notify ? "on" : "off"}`) }} />
            </div>
          </SupplierCard>

          <SupplierCard>
            <SupplierCardHeader title="Recurring time off"
              action={<SupplierButton variant="ghost" size="sm" onClick={() => push("Manage recurring rules (TODO)")}><Repeat className="w-3.5 h-3.5" /> Manage</SupplierButton>} />
            <div className="divide-y divide-slate-50">
              {data.recurringRules.map((r) => (
                <div key={r.id} className="px-4 py-2.5">
                  <p className="text-sm font-medium text-slate-700">{r.label}</p>
                  <p className="text-xs text-slate-400">{r.cadence}</p>
                </div>
              ))}
            </div>
          </SupplierCard>

          <SupplierCard>
            <SupplierCardHeader title="Reason codes"
              action={<SupplierButton variant="ghost" size="sm" onClick={() => push("Manage reason codes (TODO)")}><Tag className="w-3.5 h-3.5" /> Manage</SupplierButton>} />
            <div className="p-4 flex flex-wrap gap-2">
              {data.reasonCounts.map((rc) => (
                <span key={rc.reason} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
                  <span className={cn("w-2 h-2 rounded-full", REASON_STYLE[rc.reason].dot)} />
                  {rc.label}<span className="font-semibold text-slate-500">· {rc.count}/yr</span>
                </span>
              ))}
            </div>
          </SupplierCard>
        </div>
      </div>
    </div>
  )
}

function ImpactView({ data, push }: { data: ReturnType<typeof useScheduleTimeOff>["data"]; push: (m: string) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Affected jobs</p>
        <div className="space-y-2">
          {data.affectedJobs.map((j) => (
            <div key={j.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
              <AlertTriangle className={cn("w-4 h-4 shrink-0", j.action === "conflict" ? "text-red-500" : "text-amber-500")} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{j.jobTitle}</p>
                <p className="text-xs text-slate-400">{j.customerName} · {shortDate(j.date)}</p>
              </div>
              <SupplierStatusBadge tone={j.action === "conflict" ? "red" : "amber"}>{j.action === "conflict" ? "Conflict" : "Reschedule"}</SupplierStatusBadge>
              <SupplierButton variant="outline" size="sm" onClick={() => push("Reschedule (TODO)")}>Resolve</SupplierButton>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Affected requests</p>
        <div className="space-y-2">
          {data.affectedRequests.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                <p className="text-xs text-slate-400">{r.customerName} · {shortDate(r.date)}</p>
              </div>
              <SupplierStatusBadge tone="amber">Pending</SupplierStatusBadge>
            </div>
          ))}
        </div>
      </div>
      <SupplierButton variant="outline" size="sm" onClick={() => push("Notified affected customers")}>
        <Bell className="w-4 h-4" /> Notify affected customers
      </SupplierButton>
    </div>
  )
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      <button onClick={onChange} role="switch" aria-checked={value}
        className={cn("relative w-10 h-6 rounded-full transition-colors shrink-0", value ? "bg-blue-600" : "bg-slate-200")}>
        <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform", value && "translate-x-4")} />
      </button>
    </div>
  )
}

interface MonthCell { day: number; inMonth: boolean; isToday: boolean; reason: TimeOffReason | null }
function buildMonthGrid(blocks: ReturnType<typeof useScheduleTimeOff>["data"]["blocks"]): MonthCell[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const first = new Date(year, month, 1)
  const startDow = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: MonthCell[] = []
  for (let i = 0; i < startDow; i++) cells.push({ day: 0, inMonth: false, isToday: false, reason: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const reason = blocks.find((b) => {
      const s = new Date(b.starts_at); const e = new Date(b.ends_at)
      return date >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) &&
             date <= new Date(e.getFullYear(), e.getMonth(), e.getDate())
    })?.reason ?? null
    cells.push({ day: d, inMonth: true, isToday: d === now.getDate(), reason })
  }
  while (cells.length % 7 !== 0) cells.push({ day: 0, inMonth: false, isToday: false, reason: null })
  return cells
}
