"use client"

/* ──────────────────────────────────────────────────────────────────────────
   Team schedule views — Team Capacity (manifest image 11) and Emergency Rota /
   Out-of-Hours (image 12). Rendered inside the Schedule tab hub for team plans.
   Actions are typed stubs (toast + audit TODO).
─────────────────────────────────────────────────────────────────────────── */

import { useState } from "react"
import {
  Users, AlertTriangle, Clock, Zap, MapPin, CheckCircle2, ShieldAlert, ArrowRightLeft, BellRing,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierCard, SupplierButton, SupplierBanner } from "@/components/supplier-workspace/ui"
import { SCHEDULE_WORKERS, ROTA_SHIFTS, type RotaShift } from "@/features/supplier/team/data/schedule"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]

function loadColor(v: number): string {
  if (v >= 90) return "bg-red-500"
  if (v >= 70) return "bg-amber-400"
  if (v >= 40) return "bg-emerald-400"
  if (v > 0) return "bg-emerald-200"
  return "bg-slate-100"
}

export function TeamScheduleCapacity() {
  const [toast, setToast] = useState<string | null>(null)
  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini label="Team utilisation" value="74%" tone="blue" />
        <Mini label="Available now" value="2" tone="emerald" />
        <Mini label="Overbooked" value="1" tone="red" />
        <Mini label="Jobs this week" value="58" tone="slate" />
      </div>
      <SupplierCard className="p-5 overflow-x-auto">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Team capacity — this week</h2>
        <div className="min-w-[480px]">
          <div className="grid grid-cols-[140px_repeat(5,1fr)] gap-1 mb-1">
            <span />
            {DAYS.map((d) => <span key={d} className="text-[11px] text-slate-400 text-center">{d}</span>)}
          </div>
          {SCHEDULE_WORKERS.map((w) => (
            <div key={w.id} className="grid grid-cols-[140px_repeat(5,1fr)] gap-1 mb-1 items-center">
              <div className="flex items-center gap-2 min-w-0"><span className="w-6 h-6 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 flex items-center justify-center shrink-0">{w.initials}</span><span className="text-[12px] font-medium text-slate-700 truncate">{w.name.split(" ")[0]}</span></div>
              {w.load.map((v, i) => <div key={i} className={cn("h-7 rounded flex items-center justify-center text-[10px] font-semibold text-white/90", loadColor(v))}>{v > 0 ? `${v}%` : ""}</div>)}
            </div>
          ))}
        </div>
      </SupplierCard>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SCHEDULE_WORKERS.map((w) => (
          <SupplierCard key={w.id} className="p-4 flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-slate-100 text-xs font-semibold text-slate-600 flex items-center justify-center">{w.initials}</span>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800">{w.name}</p><p className="text-xs text-slate-400">{w.trade} · {w.jobsThisWeek} jobs this week</p></div>
            <SupplierButton size="sm" variant="outline" onClick={() => setToast(`Opening ${w.name}'s schedule…`)}>Assign</SupplierButton>
          </SupplierCard>
        ))}
      </div>
    </div>
  )
}

export function TeamEmergencyRota() {
  const [toast, setToast] = useState<string | null>(null)
  const [selected, setSelected] = useState<RotaShift>(ROTA_SHIFTS[2])
  const gaps = ROTA_SHIFTS.filter((s) => s.gap).length

  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini label="On-call now" value="Jake F" tone="blue" />
        <Mini label="Backup ready" value="Yes" tone="emerald" />
        <Mini label="Coverage gaps" value={String(gaps)} tone="red" />
        <Mini label="Avg response SLA" value="42m" tone="slate" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          {/* Rota week */}
          <SupplierCard className="p-4 overflow-x-auto">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">On-call rota</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2 min-w-[640px] lg:min-w-0">
              {ROTA_SHIFTS.map((s) => (
                <button key={s.id} onClick={() => setSelected(s)} className={cn("text-left rounded-xl border p-2.5 transition-all", selected.id === s.id ? "border-[#2563EB] ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300", s.gap && "bg-red-50/40")}>
                  <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-slate-500">{s.day}</span>{s.premium && <Zap className="w-3 h-3 text-amber-500" />}</div>
                  {s.gap ? (
                    <p className="text-[11px] font-semibold text-red-600 mt-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Gap</p>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 mt-1.5"><span className="w-5 h-5 rounded-full bg-blue-100 text-[9px] font-semibold text-blue-700 flex items-center justify-center">{s.onCallInitials}</span><span className="text-[11px] font-medium text-slate-700 truncate">{s.onCall.split(" ")[0]}</span></div>
                      <p className="text-[10px] text-slate-400 mt-1">{s.backup ? `Backup: ${s.backup.split(" ")[0]}` : "No backup"}</p>
                      {s.fatigueRisk && <p className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-0.5"><ShieldAlert className="w-2.5 h-2.5" />Fatigue</p>}
                    </>
                  )}
                </button>
              ))}
            </div>
          </SupplierCard>

          {/* Coverage map + SLA table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <SupplierCard className="p-4">
              <h2 className="text-sm font-semibold text-slate-900 mb-2">Coverage map</h2>
              <div className="relative aspect-[4/3] rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                <span className="absolute left-[30%] top-[35%] w-16 h-16 rounded-full bg-emerald-400/30 ring-2 ring-emerald-400" />
                <span className="absolute left-[55%] top-[55%] w-14 h-14 rounded-full bg-emerald-400/30 ring-2 ring-emerald-400" />
                <span className="absolute left-[68%] top-[28%] w-12 h-12 rounded-full bg-red-400/20 ring-2 ring-red-400 ring-dashed" />
                <span className="absolute left-[33%] top-[40%] text-[10px] font-semibold text-slate-600">Manchester</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2"><span className="text-emerald-600 font-semibold">2 areas covered</span> · <span className="text-red-600 font-semibold">1 gap (South, weekends)</span></p>
            </SupplierCard>

            <SupplierCard className="p-4">
              <h2 className="text-sm font-semibold text-slate-900 mb-2">Response SLA</h2>
              <ul className="divide-y divide-slate-50">
                {ROTA_SHIFTS.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-1.5 text-sm"><span className="text-slate-600">{s.day} · {s.area}</span><span className={cn("text-xs font-semibold", s.gap ? "text-red-600" : "text-slate-700")}>{s.gap ? "Uncovered" : `${s.responseSlaMins}m`}</span></li>
                ))}
              </ul>
            </SupplierCard>
          </div>
        </div>

        {/* Selected shift panel */}
        <SupplierCard className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Selected shift</p>
          <h2 className="text-base font-semibold text-slate-900 mt-1">{selected.day} · {selected.area}</h2>
          {selected.gap ? (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> No on-call cover assigned for this shift.</div>
          ) : (
            <dl className="mt-3 space-y-2 text-sm">
              <Row k="On-call" v={selected.onCall} />
              <Row k="Backup" v={selected.backup ?? "None"} />
              <Row k="Response SLA" v={`${selected.responseSlaMins} min`} />
              <Row k="Premium pay" v={selected.premium ? "Yes" : "No"} />
            </dl>
          )}
          {selected.handover && <p className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2"><span className="font-semibold">Handover:</span> {selected.handover}</p>}
          {selected.fatigueRisk && <p className="mt-2 text-xs text-amber-700 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Fatigue risk — consider a swap.</p>}
          <div className="mt-4 space-y-1.5">
            <SupplierButton className="w-full justify-center" onClick={() => setToast(selected.gap ? "Assigning on-call cover…" : "On-call updated.")}><CheckCircle2 className="w-4 h-4" /> {selected.gap ? "Assign on-call" : "Update on-call"}</SupplierButton>
            <SupplierButton variant="outline" className="w-full justify-center" onClick={() => setToast("Backup added.")}><Users className="w-4 h-4" /> Add backup</SupplierButton>
            <SupplierButton variant="ghost" className="w-full justify-center" onClick={() => setToast("Shift swap requested.")}><ArrowRightLeft className="w-4 h-4" /> Swap shift</SupplierButton>
            <SupplierButton variant="ghost" className="w-full justify-center" onClick={() => setToast("Worker notified.")}><BellRing className="w-4 h-4" /> Notify worker</SupplierButton>
          </div>
        </SupplierCard>
      </div>
    </div>
  )
}

function Mini({ label, value, tone }: { label: string; value: string; tone: "blue" | "emerald" | "red" | "slate" }) {
  const c = tone === "blue" ? "text-[#2563EB]" : tone === "emerald" ? "text-emerald-600" : tone === "red" ? "text-red-600" : "text-slate-900"
  return <SupplierCard className="p-3.5"><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span><p className={cn("text-lg font-bold mt-1", c)}>{value}</p></SupplierCard>
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><dt className="text-slate-500">{k}</dt><dd className="font-semibold text-slate-800">{v}</dd></div>
}
