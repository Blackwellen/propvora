"use client"

import React, { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import {
  CalendarDays, Clock, AlertTriangle, MapPin, Plus, Ban, RefreshCw,
  RefreshCcw, ExternalLink, Phone, User, Route, ListChecks, ChevronRight,
} from "lucide-react"
import {
  SupplierCard, SupplierCardHeader, SupplierButton,
  SupplierStatusBadge, SupplierLoadingState,
  SupplierPermissionDenied, type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { useScheduleCalendar } from "../data/hooks"
import type { ScheduleEvent } from "../data/types"
import { useScheduleToast, ViewToggle, LegendDot, MapPlaceholder } from "./shared"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
const GRID_START = 7 * 60
const GRID_END = 21 * 60
const PX_PER_MIN = 0.85

const KIND_STYLES: Record<ScheduleEvent["kind"], string> = {
  job: "bg-blue-50 border-blue-300 text-blue-800",
  visit: "bg-violet-50 border-violet-300 text-violet-800",
  travel: "bg-slate-100 border-slate-300 text-slate-500",
  blocked: "bg-amber-50 border-amber-300 text-amber-800",
  time_off: "bg-rose-50 border-rose-300 text-rose-700",
}

function fmtTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function CalendarTab() {
  const { data, loading, denied } = useScheduleCalendar()
  const { push } = useScheduleToast()
  const [view, setView] = useState("week")
  const [rightTab, setRightTab] = useState<"agenda" | "route">("agenda")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = useMemo(
    () => data.events.find((e) => e.id === selectedId) ?? null,
    [data.events, selectedId]
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
        <SupplierLoadingState rows={6} />
      </div>
    )
  }
  if (denied) return <SupplierPermissionDenied />

  const kpis: SupplierKpi[] = [
    { label: "Jobs this week", value: data.kpis.jobsThisWeek, icon: CalendarDays },
    { label: "Free slots", value: data.kpis.freeSlots, icon: Clock, sub: "Bookable" },
    { label: "Conflicts", value: data.kpis.conflicts, icon: AlertTriangle, sub: data.kpis.conflicts > 0 ? "Needs attention" : "All clear" },
    { label: "Site visits", value: data.kpis.siteVisits, icon: MapPin },
    { label: "Out-of-hours jobs", value: data.kpis.outOfHoursJobs, icon: Clock },
  ]

  const agenda = [...data.events]
    .filter((e) => e.kind !== "travel")
    .sort((a, b) => a.day - b.day || a.startMinute - b.startMinute)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <SupplierCard key={k.label} className="p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{k.label}</span>
              {k.icon && <k.icon className="w-4 h-4 text-slate-400" />}
            </div>
            <span className="text-2xl font-bold text-slate-900">{k.value}</span>
            {k.sub && <span className="text-xs text-slate-400">{k.sub}</span>}
          </SupplierCard>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewToggle
          options={[
            { key: "month", label: "Month" },
            { key: "week", label: "Week" },
            { key: "day", label: "Day" },
            { key: "agenda", label: "Agenda" },
            { key: "map", label: "Map route" },
          ]}
          value={view}
          onChange={(v) => { setView(v); if (v !== "week") push(`${v[0].toUpperCase()}${v.slice(1)} view`, "info") }}
        />
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-3 mr-1">
            <LegendDot color="bg-blue-400" label="Job" />
            <LegendDot color="bg-violet-400" label="Visit" />
            <LegendDot color="bg-amber-400" label="Blocked" />
            <LegendDot color="bg-slate-300" label="Travel" />
          </div>
          <SupplierButton variant="outline" size="sm" onClick={() => push("Calendar synced (TODO: connect Google/Outlook)")}>
            <RefreshCcw className="w-4 h-4" /> Sync calendar
          </SupplierButton>
          <SupplierButton size="sm" onClick={() => push("Add availability — opening editor (TODO)")}>
            <Plus className="w-4 h-4" /> Add availability
          </SupplierButton>
        </div>
      </div>

      {data.events.length === 0 && (
        <p className="text-xs text-slate-400">No bookings this week — your jobs and site visits appear here once scheduled.</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        {/* ── Week grid ─────────────────────────────────────────────── */}
        <SupplierCard className="overflow-hidden">
          {view === "map" ? (
            <div className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Route for the week</h3>
              <MapPlaceholder label={data.events.filter((e) => e.kind === "job" || e.kind === "visit").length > 0 ? `Optimised driving route · ${data.events.filter((e) => e.kind === "job" || e.kind === "visit").length} stops` : "No stops scheduled this week"} className="h-[420px]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[680px]">
                {/* Day header row */}
                <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-200">
                  <div className="py-2" />
                  {DAYS.map((d, i) => {
                    const weekend = i >= 5
                    return (
                      <div key={d} className={cn("py-2 text-center text-xs font-semibold border-l border-slate-100", weekend ? "text-slate-400" : "text-slate-600")}>
                        {d}
                        <div className="text-[10px] font-normal text-slate-400">{weekend ? "Out of hours" : "Available"}</div>
                      </div>
                    )
                  })}
                </div>
                {/* Time grid */}
                <div className="relative grid grid-cols-[56px_repeat(7,1fr)]" style={{ height: (GRID_END - GRID_START) * PX_PER_MIN }}>
                  {/* hour labels */}
                  <div className="relative">
                    {HOURS.map((h) => (
                      <div key={h} className="absolute left-0 right-1 text-right text-[10px] text-slate-400 -translate-y-1/2"
                        style={{ top: (h * 60 - GRID_START) * PX_PER_MIN }}>
                        {String(h).padStart(2, "0")}:00
                      </div>
                    ))}
                  </div>
                  {/* day columns */}
                  {DAYS.map((d, dayIdx) => (
                    <div key={d} className="relative border-l border-slate-100">
                      {HOURS.map((h) => (
                        <div key={h} className="absolute left-0 right-0 border-t border-slate-50"
                          style={{ top: (h * 60 - GRID_START) * PX_PER_MIN }} />
                      ))}
                      {data.events
                        .filter((e) => e.day === dayIdx && !e.allDay)
                        .map((e) => {
                          const top = (Math.max(e.startMinute, GRID_START) - GRID_START) * PX_PER_MIN
                          const height = Math.max(18, (Math.min(e.endMinute, GRID_END) - Math.max(e.startMinute, GRID_START)) * PX_PER_MIN)
                          return (
                            <button
                              key={e.id}
                              onClick={() => { setSelectedId(e.id); setRightTab("agenda") }}
                              className={cn(
                                "absolute left-0.5 right-0.5 rounded-md border px-1.5 py-1 text-left text-[10px] leading-tight overflow-hidden transition-shadow hover:shadow-md",
                                KIND_STYLES[e.kind],
                                selectedId === e.id && "ring-2 ring-blue-500",
                                e.conflict && "ring-2 ring-red-400"
                              )}
                              style={{ top, height }}
                            >
                              <div className="flex items-center gap-1">
                                {e.conflict && <AlertTriangle className="w-2.5 h-2.5 text-red-500 shrink-0" />}
                                {e.emergency && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                                <span className="font-semibold truncate">{e.title}</span>
                              </div>
                              {height > 28 && <span className="text-[9px] opacity-80">{fmtTime(e.startMinute)}–{fmtTime(e.endMinute)}</span>}
                            </button>
                          )
                        })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SupplierCard>

        {/* ── Right panel ───────────────────────────────────────────── */}
        <div className="space-y-4">
          <SupplierCard>
            <div className="flex items-center gap-1 border-b border-slate-100 px-3 pt-2">
              {([["agenda", "Agenda", ListChecks], ["route", "Your route", Route]] as const).map(([key, label, Icon]) => (
                <button key={key} onClick={() => setRightTab(key)}
                  className={cn("inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px",
                    rightTab === key ? "text-blue-600 border-blue-600" : "text-slate-500 border-transparent hover:text-slate-700")}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            {rightTab === "agenda" ? (
              <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-50">
                {agenda.map((e) => (
                  <button key={e.id} onClick={() => setSelectedId(e.id)}
                    className={cn("w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3",
                      selectedId === e.id && "bg-blue-50/60")}>
                    <div className="w-10 text-center shrink-0">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">{DAYS[e.day]}</div>
                      <div className="text-xs font-bold text-slate-700">{fmtTime(e.startMinute)}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-slate-800 truncate">{e.title}</span>
                        {e.conflict && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                      </div>
                      {e.customerName && <p className="text-xs text-slate-400 truncate">{e.customerName}</p>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <MapPlaceholder label="Today · 4 stops · 38 mi" className="h-44" />
                <ol className="space-y-2">
                  {agenda.filter((e) => e.day === 0 && e.address).map((e, i) => (
                    <li key={e.id} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="text-slate-700 truncate">{e.address}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </SupplierCard>

          {/* Selected appointment */}
          <SupplierCard>
            <SupplierCardHeader title="Selected appointment" />
            {selected ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">{selected.title}</h4>
                  <SupplierStatusBadge tone={selected.slaRisk === "high" ? "red" : selected.slaRisk === "med" ? "amber" : "emerald"}>
                    {selected.slaRisk === "none" ? "On track" : `SLA risk: ${selected.slaRisk}`}
                  </SupplierStatusBadge>
                </div>
                <dl className="space-y-2 text-sm">
                  <Row icon={Clock} label={`${DAYS[selected.day]} · ${fmtTime(selected.startMinute)}–${fmtTime(selected.endMinute)}`} />
                  {selected.address && <Row icon={MapPin} label={selected.address} />}
                  {selected.customerName && <Row icon={User} label={selected.customerName} />}
                  {selected.customerPhone && <Row icon={Phone} label={selected.customerPhone} />}
                </dl>
                {selected.address && <MapPlaceholder label="Route to next stop" className="h-28" />}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <SupplierButton variant="outline" size="sm" onClick={() => push("Reschedule job (TODO)")}>
                    <RefreshCw className="w-4 h-4" /> Reschedule
                  </SupplierButton>
                  <SupplierButton variant="outline" size="sm" onClick={() => push(`Opening ${selected.jobId ?? "job"} (TODO)`)}>
                    <ExternalLink className="w-4 h-4" /> Open job
                  </SupplierButton>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-slate-400">Select an appointment in the grid or agenda.</div>
            )}
          </SupplierCard>

          {/* Quick actions */}
          <SupplierCard>
            <SupplierCardHeader title="Quick actions" />
            <div className="p-3 grid grid-cols-1 gap-1.5">
              {[
                { label: "Add availability", icon: Plus, fn: () => push("Add availability (TODO)") },
                { label: "Block time", icon: Ban, fn: () => push("Block time (TODO)") },
                { label: "Reschedule job", icon: RefreshCw, fn: () => push("Reschedule job (TODO)") },
                { label: "Sync calendar", icon: RefreshCcw, fn: () => push("Sync calendar (TODO)") },
              ].map((a) => (
                <button key={a.label} onClick={a.fn}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left">
                  <a.icon className="w-4 h-4 text-slate-400" /> {a.label}
                </button>
              ))}
            </div>
          </SupplierCard>
        </div>
      </div>
    </div>
  )
}

function Row({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-start gap-2 text-slate-600">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <span>{label}</span>
    </div>
  )
}
