"use client"

import React, { useMemo, useState } from "react"
import {
  CalendarDays, List, Table2, Map as MapIcon, Clock, AlertTriangle, CheckCircle2,
  Car, KeyRound, Bell, Package, MapPin, ArrowUpDown, Phone,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  SupplierCard, SupplierEmptyState, SupplierStatusBadge, SupplierButton, type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { SupplierViewSwitcher } from "@/components/supplier-workspace/views"
import { shortDate } from "@/components/supplier-workspace/format"
import type { SupplierJob } from "../data/types"
import { StatRow, ChecklistItem, StaticMap, PanelSection, CountPill, useToast, ToastHost } from "./primitives"

type ViewId = "calendar" | "agenda" | "table" | "map"

function dayKey(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "—"
}
function timeOf(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

export function ScheduledTab({ jobs }: { jobs: SupplierJob[] }) {
  const [view, setView] = useState<ViewId>("agenda")
  const [selectedId, setSelectedId] = useState<string | null>(jobs[0]?.id ?? null)
  const { toasts, push } = useToast()

  const selected = useMemo(() => jobs.find((j) => j.id === selectedId) ?? jobs[0] ?? null, [jobs, selectedId])

  const kpis: SupplierKpi[] = useMemo(() => {
    const today = new Date().toDateString()
    const weekEnd = Date.now() + 7 * 86_400_000
    const dueToday = jobs.filter((j) => j.appointmentAt && new Date(j.appointmentAt).toDateString() === today).length
    const dueWeek = jobs.filter((j) => j.appointmentAt && new Date(j.appointmentAt).getTime() <= weekEnd).length
    const unconfirmed = jobs.filter((j) => !j.appointmentConfirmed).length
    const conflicts = jobs.filter((j) => j.rescheduleRisk === "high").length
    return [
      { label: "Scheduled jobs", value: jobs.length, icon: CalendarDays },
      { label: "Due today", value: dueToday, icon: Clock },
      { label: "Due this week", value: dueWeek, icon: CalendarDays },
      { label: "Unconfirmed", value: unconfirmed, icon: AlertTriangle },
      { label: "Route conflicts", value: conflicts, icon: ArrowUpDown },
    ]
  }, [jobs])

  // Day strip
  const dayStrip = useMemo(() => {
    const map = new Map<string, { count: number; mins: number }>()
    for (const j of jobs) {
      const k = dayKey(j.appointmentAt)
      const prev = map.get(k) ?? { count: 0, mins: 0 }
      const dur = j.appointmentAt && j.appointmentEndAt ? (new Date(j.appointmentEndAt).getTime() - new Date(j.appointmentAt).getTime()) / 60000 : 0
      map.set(k, { count: prev.count + 1, mins: prev.mins + dur })
    }
    return Array.from(map.entries()).filter(([k]) => k !== "—").sort()
  }, [jobs])

  if (jobs.length === 0) {
    return (
      <SupplierCard className="p-2">
        <SupplierEmptyState icon={CalendarDays} title="Nothing scheduled" description="Upcoming appointments and their routing appear here once you confirm a job's date." />
      </SupplierCard>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <SupplierCard key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{k.label}</span>
              {k.icon && <k.icon className="w-4 h-4 text-slate-400" />}
            </div>
            <p className="text-xl font-bold text-slate-900 mt-1">{k.value}</p>
          </SupplierCard>
        ))}
      </div>

      {/* Day strip */}
      <SupplierCard className="p-3">
        <div className="flex gap-2 overflow-x-auto">
          {dayStrip.map(([day, info]) => (
            <div key={day} className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-center min-w-[92px]">
              <p className="text-[11px] text-slate-400">{shortDate(day)}</p>
              <p className="text-lg font-bold text-slate-900">{info.count}</p>
              <p className="text-[11px] text-slate-500">{Math.round(info.mins / 60 * 10) / 10}h</p>
            </div>
          ))}
        </div>
      </SupplierCard>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">Upcoming appointments</p>
        <SupplierViewSwitcher<ViewId>
          value={view}
          onChange={setView}
          options={[
            { key: "calendar", label: "Calendar", icon: CalendarDays },
            { key: "agenda", label: "Agenda", icon: List },
            { key: "table", label: "Table", icon: Table2 },
            { key: "map", label: "Map route", icon: MapIcon },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        <div className="min-w-0">
          {view === "map" ? (
            <SupplierCard className="p-4">
              <StaticMap label="Day route" className="h-[360px]" markers={jobs.map((j) => ({ id: j.id, address: `${j.address.line1}, ${j.address.postcode}`, label: j.address.line1, sublabel: j.address.postcode, color: j.appointmentConfirmed ? "#2563EB" : "#F59E0B" }))} />
            </SupplierCard>
          ) : view === "calendar" ? (
            <SupplierCard className="p-4 space-y-3">
              {dayStrip.map(([day]) => (
                <div key={day}>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">{shortDate(day)}</p>
                  <div className="space-y-1.5">
                    {jobs.filter((j) => dayKey(j.appointmentAt) === day).map((j) => (
                      <button key={j.id} onClick={() => setSelectedId(j.id)} className={cn("flex items-center gap-2 w-full text-left rounded-lg border px-3 py-2 hover:bg-slate-50", selected?.id === j.id ? "border-[var(--color-brand-300)] bg-[var(--brand-soft)]/40" : "border-slate-200")}>
                        <span className="text-xs font-semibold text-slate-700 w-12">{timeOf(j.appointmentAt)}</span>
                        <span className="text-sm text-slate-800 flex-1 truncate">{j.title}</span>
                        <SupplierStatusBadge tone={j.appointmentConfirmed ? "emerald" : "amber"}>{j.appointmentConfirmed ? "Confirmed" : "Unconfirmed"}</SupplierStatusBadge>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </SupplierCard>
          ) : view === "table" ? (
            <SupplierCard className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60 text-left">
                    <Th>Appointment</Th><Th>Travel</Th><Th>Access</Th><Th>Confirmation</Th><Th>Materials</Th><Th>Reminder</Th><Th>Risk</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((j) => (
                    <tr key={j.id} onClick={() => setSelectedId(j.id)} className={cn("cursor-pointer hover:bg-slate-50/60", selected?.id === j.id ? "bg-[var(--brand-soft)]/40" : "")}>
                      <Td>
                        <p className="font-semibold text-slate-800">{shortDate(j.appointmentAt)} · {timeOf(j.appointmentAt)}</p>
                        <p className="text-xs text-slate-400">{j.address.line1}, {j.address.postcode}</p>
                      </Td>
                      <Td className="text-xs text-slate-600">{j.travelMins != null ? `${j.travelMins}m · ${j.travelMiles}mi` : "—"}</Td>
                      <Td className="text-xs text-slate-600">{j.keySafeCode ? `Key safe ${j.keySafeCode}` : "See notes"}</Td>
                      <Td><SupplierStatusBadge tone={j.appointmentConfirmed ? "emerald" : "amber"}>{j.appointmentConfirmed ? "Confirmed" : "Unconfirmed"}</SupplierStatusBadge></Td>
                      <Td><SupplierStatusBadge tone={j.materials.every((m) => m.status === "ready" || m.status === "used") ? "emerald" : "amber"}>{j.materials.length === 0 ? "None" : j.materials.every((m) => m.status === "ready" || m.status === "used") ? "Ready" : "Pending"}</SupplierStatusBadge></Td>
                      <Td className="text-xs text-slate-600">{j.reminderSent ? "Sent" : j.reminderScheduledAt ? `Scheduled ${shortDate(j.reminderScheduledAt)}` : "—"}</Td>
                      <Td><SupplierStatusBadge tone={j.rescheduleRisk === "high" ? "red" : j.rescheduleRisk === "medium" ? "amber" : "emerald"}>{j.rescheduleRisk[0].toUpperCase() + j.rescheduleRisk.slice(1)}</SupplierStatusBadge></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SupplierCard>
          ) : (
            <div className="space-y-2">
              {jobs.map((j) => (
                <button key={j.id} onClick={() => setSelectedId(j.id)} className="text-left w-full">
                  <SupplierCard className={cn("p-4 transition-all hover:shadow-md", selected?.id === j.id ? "ring-2 ring-[var(--brand)]/40" : "")}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{j.title}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{j.address.line1}, {j.address.postcode}</p>
                      </div>
                      <SupplierStatusBadge tone={j.appointmentConfirmed ? "emerald" : "amber"}>{j.appointmentConfirmed ? "Confirmed" : "Unconfirmed"}</SupplierStatusBadge>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <span className="flex items-center gap-1 text-slate-600"><Clock className="w-3 h-3 text-slate-400" />{shortDate(j.appointmentAt)} {timeOf(j.appointmentAt)}</span>
                      <span className="flex items-center gap-1 text-slate-600"><Car className="w-3 h-3 text-slate-400" />{j.travelMins != null ? `${j.travelMins}m · ${j.travelMiles}mi` : "—"}</span>
                      <span className="flex items-center gap-1 text-slate-600"><Bell className="w-3 h-3 text-slate-400" />{j.reminderSent ? "Reminder sent" : "Reminder scheduled"}</span>
                    </div>
                  </SupplierCard>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        {selected && (
          <SupplierCard className="p-4 lg:sticky lg:top-4 self-start space-y-4 h-max">
            <div>
              <p className="text-sm font-bold text-slate-900">{selected.title}</p>
              <p className="text-xs text-slate-400">{shortDate(selected.appointmentAt)} · {timeOf(selected.appointmentAt)}</p>
            </div>

            <PanelSection title="Job prep checklist">
              <div className="rounded-xl border border-slate-100 px-3 py-1">
                <ChecklistItem label="Appointment confirmed" done={selected.appointmentConfirmed} />
                <ChecklistItem label="Access details on hand" done={!!selected.keySafeCode || !!selected.accessNotes} />
                <ChecklistItem label="Parts & materials ready" done={selected.materials.length === 0 || selected.materials.every((m) => m.status === "ready" || m.status === "used")} />
                <ChecklistItem label="Reminder sent to customer" done={selected.reminderSent} />
                <ChecklistItem label="Route planned" done={selected.travelMins != null} />
              </div>
            </PanelSection>

            <PanelSection title="Customer contact">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-0.5">
                <StatRow label="Customer" value={selected.customerName} />
                <StatRow label="Phone" value={selected.customerPhone ?? "—"} />
                {selected.keySafeCode && <StatRow label="Key safe" value={<span className="font-mono">{selected.keySafeCode}</span>} />}
              </div>
              {selected.customerPhone && (
                <a href={`tel:${selected.customerPhone}`} className="mt-2 inline-flex items-center justify-center gap-1.5 h-10 w-full rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
                  <Phone className="w-4 h-4" /> Call customer
                </a>
              )}
            </PanelSection>

            <PanelSection title="Materials">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-600"><Package className="w-3.5 h-3.5 text-slate-400" /> Ready</span>
                <CountPill done={selected.materials.filter((m) => m.status === "ready" || m.status === "used").length} total={selected.materials.length} tone="amber" />
              </div>
            </PanelSection>

            <PanelSection title="Route & location">
              <StaticMap label={`${selected.address.line1}`} className="h-32" markers={[{ id: selected.id, address: `${selected.address.line1}, ${selected.address.postcode}`, label: selected.address.line1, sublabel: selected.address.postcode, color: "#2563EB" }]} />
            </PanelSection>

            <PanelSection title="Route optimisation" action={<KeyRound className="w-3.5 h-3.5 text-slate-300" />}>
              <div className="rounded-xl border border-[var(--color-brand-100)] bg-[var(--brand-soft)]/50 p-3">
                <p className="text-xs text-slate-600">Reorder today's stops to cut travel time.</p>
                <SupplierButton size="sm" variant="outline" className="w-full mt-2" onClick={() => push("blue", "Route reordered — est. 22 mins saved. (TODO: persist)")}>
                  <ArrowUpDown className="w-3.5 h-3.5" /> Optimise route
                </SupplierButton>
              </div>
            </PanelSection>

            <div className="grid grid-cols-2 gap-2">
              <SupplierButton size="sm" onClick={() => push("emerald", selected.appointmentConfirmed ? "Already confirmed." : "Confirmation requested. (TODO)")}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirm
              </SupplierButton>
              <SupplierButton size="sm" variant="outline" onClick={() => push("blue", "Reminder sent. (TODO)")}>
                <Bell className="w-3.5 h-3.5" /> Send reminder
              </SupplierButton>
            </div>
          </SupplierCard>
        )}
      </div>

      <ToastHost toasts={toasts} />
    </div>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400", className)}>{children}</th>
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5 align-middle", className)}>{children}</td>
}
