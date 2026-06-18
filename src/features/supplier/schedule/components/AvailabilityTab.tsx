"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import {
  CalendarCheck, Clock, Zap, Timer, CalendarX, Plus, Save, Download,
  Pencil, Settings2, CheckCircle2, Eye, Layers, Grid3x3, Flame,
} from "lucide-react"
import {
  SupplierCard, SupplierCardHeader, SupplierButton, SupplierLoadingState,
  SupplierPermissionDenied, SupplierStatusBadge,
} from "@/components/supplier-workspace/ui"
import { useScheduleAvailability } from "../data/hooks"
import type { AvailabilityBandState } from "../data/types"
import { useScheduleToast, ViewToggle, LegendDot } from "./shared"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const STATE_STYLE: Record<AvailabilityBandState, string> = {
  available: "bg-emerald-100 text-emerald-700 border-emerald-200",
  emergency_only: "bg-amber-100 text-amber-700 border-amber-200",
  unavailable: "bg-slate-50 text-slate-300 border-slate-100",
}
const STATE_LABEL: Record<AvailabilityBandState, string> = {
  available: "Available", emergency_only: "Emergency", unavailable: "—",
}

export function AvailabilityTab() {
  const { data, loading, source, denied } = useScheduleAvailability()
  const { push } = useScheduleToast()
  const [view, setView] = useState("grid")

  if (loading) return <SupplierLoadingState rows={7} />
  if (denied) return <SupplierPermissionDenied />

  const kpis = [
    { label: "Available days", value: `${data.kpis.availableDays}/7`, icon: CalendarCheck },
    { label: "Bookable hours", value: `${data.kpis.bookableHours}h`, icon: Clock },
    { label: "Emergency enabled", value: data.kpis.emergencyEnabled ? "Yes" : "No", icon: Zap },
    { label: "Average response", value: data.kpis.avgResponse, icon: Timer },
    { label: "Next unavailable", value: data.kpis.nextUnavailable, icon: CalendarX },
  ]

  function cellState(day: number, band: string): AvailabilityBandState {
    return data.cells.find((c) => c.day === day && c.band === band)?.state ?? "unavailable"
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <SupplierCard key={k.label} className="p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{k.label}</span>
              <k.icon className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-xl font-bold text-slate-900">{k.value}</span>
          </SupplierCard>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewToggle
          options={[
            { key: "grid", label: "Weekly grid", icon: Grid3x3 },
            { key: "rules", label: "Rule cards", icon: Layers },
            { key: "heatmap", label: "Heatmap", icon: Flame },
            { key: "preview", label: "Public preview", icon: Eye },
          ]}
          value={view}
          onChange={(v) => { setView(v); if (v !== "grid") push(`${v} view`, "info") }}
        />
        <div className="flex items-center gap-2">
          <SupplierButton variant="outline" size="sm" onClick={() => push("Add exception (TODO)")}>
            <Plus className="w-4 h-4" /> Add exception
          </SupplierButton>
          <SupplierButton variant="outline" size="sm" onClick={() => push("Export availability (TODO)")}>
            <Download className="w-4 h-4" /> Export
          </SupplierButton>
          <SupplierButton size="sm" onClick={() => push("Availability saved")}>
            <Save className="w-4 h-4" /> Save availability
          </SupplierButton>
        </div>
      </div>

      {source === "seed" && (
        <p className="text-xs text-slate-400">Showing recommended availability — adjust to match your real working week.</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* Weekly grid / views */}
        <SupplierCard className="overflow-hidden">
          <SupplierCardHeader
            title={view === "preview" ? "Public availability preview" : view === "heatmap" ? "Booking heatmap" : view === "rules" ? "Availability rules" : "Weekly availability"}
            action={<SupplierButton variant="ghost" size="sm" onClick={() => push("Set hours (TODO)")}><Clock className="w-4 h-4" /> Set hours</SupplierButton>}
          />
          <div className="p-4">
            {view === "rules" ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {DAYS.map((d, i) => (
                  <div key={d} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">{d}</span>
                      <SupplierStatusBadge tone={i < 5 ? "emerald" : "slate"}>{i < 5 ? "Working" : "Off"}</SupplierStatusBadge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{i < 5 ? "08:00–17:00 · Emergency 24/7" : i === 5 ? "Emergency only" : "Closed"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[560px] w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="w-28 p-2 text-left text-xs font-medium text-slate-400">Time band</th>
                      {DAYS.map((d) => <th key={d} className="p-2 text-center text-xs font-semibold text-slate-600">{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {data.bands.map((band) => (
                      <tr key={band.key}>
                        <td className="p-2 text-xs font-medium text-slate-500 align-middle">{band.label}</td>
                        {DAYS.map((_, day) => {
                          const st = cellState(day, band.key)
                          const opacity = view === "heatmap" && st === "available" ? "opacity-100" : view === "heatmap" ? "opacity-40" : ""
                          return (
                            <td key={day} className="p-1">
                              <button
                                onClick={() => push(`${DAYS[day]} ${band.label}: toggled (TODO)`)}
                                className={cn("w-full h-9 rounded-md border text-[10px] font-medium transition-colors hover:brightness-95", STATE_STYLE[st], opacity)}>
                                {view === "heatmap" ? "" : STATE_LABEL[st]}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                    <tr>
                      <td className="p-2 text-xs font-medium text-slate-400">Daily capacity</td>
                      {data.daySummaries.map((s) => (
                        <td key={s.day} className="p-1 text-center">
                          <span className="text-[11px] font-semibold text-slate-600">{s.capacityUsed}/{s.capacityMax}</span>
                          <div className="text-[9px] text-slate-400">jobs</div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LegendDot color="bg-emerald-400" label="Available" />
                    <LegendDot color="bg-amber-400" label="Emergency only" />
                    <LegendDot color="bg-slate-200" label="Unavailable" />
                  </div>
                  <span className="text-xs font-medium text-slate-500">Weekly bookable: {data.weeklyBookableHours}h</span>
                </div>
              </div>
            )}
          </div>
        </SupplierCard>

        {/* Right rail */}
        <div className="space-y-4">
          <SupplierCard>
            <SupplierCardHeader title="Availability rules"
              action={<SupplierButton variant="ghost" size="sm" onClick={() => push("Edit rules (TODO)")}><Pencil className="w-3.5 h-3.5" /> Edit</SupplierButton>} />
            <div className="p-4 space-y-2 text-sm">
              <RuleRow label="Recurring hours" value={data.rules.recurringHoursLabel} />
              <RuleRow label="Emergency 24/7" value={data.rules.emergency247 ? "Enabled" : "Off"} />
              <RuleRow label="Response window" value={`${data.rules.responseWindowHours}h`} />
              <RuleRow label="Lead time" value={`${data.rules.leadTimeHours}h`} />
              <RuleRow label="Max jobs/day" value={String(data.rules.maxJobsPerDay)} />
              <RuleRow label="Travel buffer" value={`${data.rules.travelBufferMinutes} min`} />
            </div>
            <div className="px-4 pb-4">
              <SupplierButton variant="outline" size="sm" className="w-full" onClick={() => push("Enable emergency slots (TODO)")}>
                <Zap className="w-4 h-4" /> Enable emergency slots
              </SupplierButton>
            </div>
          </SupplierCard>

          <SupplierCard>
            <SupplierCardHeader title="Service availability"
              action={<SupplierButton variant="ghost" size="sm" onClick={() => push("Manage service availability (TODO)")}><Settings2 className="w-3.5 h-3.5" /> Manage</SupplierButton>} />
            <div className="divide-y divide-slate-50">
              {data.serviceAvailability.map((s) => (
                <div key={s.serviceId} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{s.name}</p>
                    {s.note && <p className="text-xs text-slate-400">{s.note}</p>}
                  </div>
                  <SupplierStatusBadge tone={s.state === "available" ? "emerald" : s.state === "emergency_only" ? "amber" : "slate"}>
                    {STATE_LABEL[s.state]}
                  </SupplierStatusBadge>
                </div>
              ))}
            </div>
          </SupplierCard>

          <SupplierCard className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Instant-book eligible</p>
                <p className="text-xs text-slate-400">Customers can book without a quote.</p>
              </div>
              <SupplierStatusBadge tone="emerald">Eligible</SupplierStatusBadge>
            </div>
          </SupplierCard>

          <SupplierCard>
            <SupplierCardHeader title="Public availability preview" />
            <div className="p-4 grid grid-cols-7 gap-1">
              {DAYS.map((d, i) => (
                <div key={d} className="text-center">
                  <div className="text-[10px] font-medium text-slate-400">{d}</div>
                  <div className={cn("mt-1 h-8 rounded-md flex items-center justify-center text-[10px] font-semibold",
                    i < 5 ? "bg-emerald-100 text-emerald-700" : i === 5 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-300")}>
                    {i < 5 ? "✓" : i === 5 ? "⚡" : "—"}
                  </div>
                </div>
              ))}
            </div>
          </SupplierCard>
        </div>
      </div>
    </div>
  )
}

function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  )
}
