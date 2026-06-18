"use client"

/* ──────────────────────────────────────────────────────────────────────────
   TeamProductivity — manifest image 27 (Team Insights: Coverage + Team
   Productivity). Coverage map + gaps, per-worker productivity leaderboard,
   completion time, route efficiency, overdue evidence and a coverage heatmap.
   Rendered in the Insights "Team Productivity" tab for team plans.
─────────────────────────────────────────────────────────────────────────── */

import { useState } from "react"
import { MapPin, TrendingUp, Download, AlertTriangle, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierCard, SupplierButton, SupplierBanner } from "@/components/supplier-workspace/ui"
import { moneyPence } from "@/components/supplier-workspace/format"

interface WorkerProd { id: string; name: string; initials: string; jobs: number; revenuePence: number; avgCompletionH: number; routeEff: number; overdueEvidence: number; slaPct: number }
const WORKERS: WorkerProd[] = [
  { id: "w1", name: "Jake Foster", initials: "JF", jobs: 38, revenuePence: 4210000, avgCompletionH: 3.2, routeEff: 92, overdueEvidence: 1, slaPct: 96 },
  { id: "w2", name: "Mike Thompson", initials: "MT", jobs: 29, revenuePence: 3180000, avgCompletionH: 4.1, routeEff: 84, overdueEvidence: 2, slaPct: 90 },
  { id: "w3", name: "Emma Collins", initials: "EC", jobs: 24, revenuePence: 2740000, avgCompletionH: 3.8, routeEff: 88, overdueEvidence: 0, slaPct: 94 },
  { id: "w4", name: "Sarah Ahmed", initials: "SA", jobs: 17, revenuePence: 1810000, avgCompletionH: 4.6, routeEff: 79, overdueEvidence: 1, slaPct: 88 },
]

const AREAS = [
  { name: "Manchester N", demand: "High", covered: true, jobs: 42 },
  { name: "Manchester C", demand: "High", covered: true, jobs: 38 },
  { name: "Manchester S", demand: "Medium", covered: false, jobs: 19 },
  { name: "Stockport", demand: "Medium", covered: true, jobs: 14 },
  { name: "Bolton", demand: "Low", covered: false, jobs: 6 },
]

function heat(v: number) { return v >= 90 ? "bg-emerald-500" : v >= 80 ? "bg-emerald-400" : v >= 70 ? "bg-amber-400" : "bg-red-400" }

export function TeamProductivity() {
  const [toast, setToast] = useState<string | null>(null)
  const maxRev = WORKERS[0].revenuePence

  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <Mini label="Coverage gaps" value="2" tone="red" />
          <Mini label="Jobs / worker" value="27" tone="blue" />
          <Mini label="Avg completion" value="3.9h" tone="slate" />
          <Mini label="Route efficiency" value="86%" tone="emerald" />
        </div>
        <SupplierButton variant="outline" onClick={() => setToast("Productivity report exported.")}><Download className="w-4 h-4" /> Export</SupplierButton>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          {/* Coverage map */}
          <SupplierCard className="p-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Coverage &amp; demand</h2>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4">
              <div className="relative aspect-[16/10] rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                <span className="absolute left-[28%] top-[30%] w-16 h-16 rounded-full bg-emerald-400/30 ring-2 ring-emerald-400" />
                <span className="absolute left-[48%] top-[48%] w-14 h-14 rounded-full bg-emerald-400/30 ring-2 ring-emerald-400" />
                <span className="absolute left-[62%] top-[68%] w-12 h-12 rounded-full bg-red-400/20 ring-2 ring-red-400 border-dashed" />
                <span className="absolute left-[30%] top-[36%] text-[10px] font-semibold text-slate-600">Manchester</span>
              </div>
              <ul className="space-y-1.5">
                {AREAS.map((a) => (
                  <li key={a.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5"><span className={cn("w-2 h-2 rounded-full", a.covered ? "bg-emerald-500" : "bg-red-500")} /><span className="text-slate-700">{a.name}</span></span>
                    <span className="text-[11px] text-slate-400">{a.demand} · {a.jobs}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> 2 high/medium-demand areas uncovered — consider expanding coverage.</p>
          </SupplierCard>

          {/* Worker productivity table */}
          <SupplierCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[620px]">
                <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60"><th className="px-4 py-3 font-semibold">Worker</th><th className="px-4 py-3 font-semibold text-right">Jobs</th><th className="px-4 py-3 font-semibold text-right">Revenue</th><th className="px-4 py-3 font-semibold text-right">Avg time</th><th className="px-4 py-3 font-semibold text-right">Route eff.</th><th className="px-4 py-3 font-semibold text-right">SLA</th><th className="px-4 py-3 font-semibold text-right">Overdue ev.</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {WORKERS.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 flex items-center justify-center">{w.initials}</span><span className="font-semibold text-slate-800">{w.name}</span></span></td>
                      <td className="px-4 py-3 text-right text-slate-700">{w.jobs}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{moneyPence(w.revenuePence)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{w.avgCompletionH}h</td>
                      <td className="px-4 py-3 text-right"><span className={cn("font-semibold", w.routeEff >= 85 ? "text-emerald-600" : "text-amber-600")}>{w.routeEff}%</span></td>
                      <td className="px-4 py-3 text-right text-slate-600">{w.slaPct}%</td>
                      <td className="px-4 py-3 text-right">{w.overdueEvidence > 0 ? <span className="text-red-600 font-semibold">{w.overdueEvidence}</span> : <span className="text-emerald-600">0</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SupplierCard>
        </div>

        {/* Leaderboard + recommendations */}
        <div className="space-y-4">
          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Revenue leaderboard</h2>
            <div className="space-y-2.5">
              {WORKERS.map((w, i) => (
                <div key={w.id} className="flex items-center gap-2.5">
                  <span className="text-xs text-slate-400 w-4">{i + 1}</span>
                  <span className="w-7 h-7 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 flex items-center justify-center shrink-0">{w.initials}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between"><p className="text-[12px] font-medium text-slate-700 truncate">{w.name.split(" ")[0]}</p><span className="text-[11px] font-bold text-slate-900">{moneyPence(w.revenuePence)}</span></div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1"><div className={cn("h-full rounded-full", heat(w.slaPct))} style={{ width: `${(w.revenuePence / maxRev) * 100}%` }} /></div>
                  </div>
                </div>
              ))}
            </div>
          </SupplierCard>
          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Recommendations</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><TrendingUp className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />Add coverage in Manchester S to capture 19 unserved jobs/mo.</li>
              <li className="flex gap-2"><MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />Sarah's route efficiency is below target — review scheduling.</li>
            </ul>
            <button onClick={() => setToast("Opening coverage planner…")} className="mt-3 text-[12px] font-semibold text-blue-600 inline-flex items-center gap-0.5">Adjust coverage <ChevronRight className="w-3.5 h-3.5" /></button>
          </SupplierCard>
        </div>
      </div>
    </div>
  )
}

function Mini({ label, value, tone }: { label: string; value: string; tone: "blue" | "emerald" | "red" | "slate" }) {
  const c = tone === "blue" ? "text-[#2563EB]" : tone === "emerald" ? "text-emerald-600" : tone === "red" ? "text-red-600" : "text-slate-900"
  return <SupplierCard className="p-3.5"><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span><p className={cn("text-lg font-bold mt-1", c)}>{value}</p></SupplierCard>
}
