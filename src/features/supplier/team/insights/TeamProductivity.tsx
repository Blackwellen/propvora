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
const WORKERS: WorkerProd[] = []

const AREAS: { name: string; demand: string; covered: boolean; jobs: number }[] = []

function heat(v: number) { return v >= 90 ? "bg-emerald-500" : v >= 80 ? "bg-emerald-400" : v >= 70 ? "bg-amber-400" : "bg-red-400" }

export function TeamProductivity() {
  const [toast, setToast] = useState<string | null>(null)
  const maxRev = WORKERS[0]?.revenuePence ?? 1

  return (
    <div className="space-y-4">
      {toast && <SupplierBanner tone="emerald" onDismiss={() => setToast(null)}>{toast}</SupplierBanner>}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <Mini label="Coverage gaps" value={String(AREAS.filter((a) => !a.covered).length)} tone="red" />
          <Mini label="Jobs / worker" value={WORKERS.length > 0 ? String(Math.round(WORKERS.reduce((s, w) => s + w.jobs, 0) / WORKERS.length)) : "—"} tone="blue" />
          <Mini label="Avg completion" value={WORKERS.length > 0 ? `${(WORKERS.reduce((s, w) => s + w.avgCompletionH, 0) / WORKERS.length).toFixed(1)}h` : "—"} tone="slate" />
          <Mini label="Route efficiency" value={WORKERS.length > 0 ? `${Math.round(WORKERS.reduce((s, w) => s + w.routeEff, 0) / WORKERS.length)}%` : "—"} tone="emerald" />
        </div>
        <SupplierButton variant="outline" onClick={() => setToast("Productivity report exported.")}><Download className="w-4 h-4" /> Export</SupplierButton>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          {/* Coverage map */}
          <SupplierCard className="p-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Coverage &amp; demand</h2>
            {AREAS.length === 0 ? (
              <div className="py-8 text-center">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No coverage areas configured</p>
                <p className="text-xs text-slate-400 mt-1">Add your service areas to track coverage and demand.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4">
                <div className="relative aspect-[16/10] rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden flex items-center justify-center">
                  <p className="text-xs text-slate-400">Coverage map — {AREAS.length} area{AREAS.length === 1 ? "" : "s"}</p>
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
            )}
            {AREAS.filter((a) => !a.covered).length > 0 && (
              <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {AREAS.filter((a) => !a.covered).length} area{AREAS.filter((a) => !a.covered).length === 1 ? "" : "s"} uncovered — consider expanding coverage.</p>
            )}
          </SupplierCard>

          {/* Worker productivity table */}
          <SupplierCard className="p-0 overflow-hidden">
            {WORKERS.length === 0 ? (
              <div className="p-10 text-center"><TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-sm font-semibold text-slate-700">No productivity data yet</p><p className="text-xs text-slate-400 mt-1">Worker performance data will appear here as jobs are completed.</p></div>
            ) : (
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
            )}
          </SupplierCard>
        </div>

        {/* Leaderboard + recommendations */}
        <div className="space-y-4">
          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Revenue leaderboard</h2>
            {WORKERS.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No data yet.</p>}
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
            {WORKERS.length === 0 && AREAS.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Recommendations appear once workers and coverage areas are configured.</p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-600">
                {AREAS.filter((a) => !a.covered).length > 0 && (
                  <li className="flex gap-2"><TrendingUp className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{AREAS.filter((a) => !a.covered).length} uncovered area{AREAS.filter((a) => !a.covered).length === 1 ? "" : "s"} — consider expanding your coverage.</li>
                )}
                <li className="flex gap-2"><MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />Review worker route efficiency regularly to optimise scheduling.</li>
              </ul>
            )}
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
