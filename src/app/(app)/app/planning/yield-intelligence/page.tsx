"use client"

import React, { useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  AlertTriangle,
  Building2,
  BarChart2,
  ArrowUpRight,
} from "lucide-react"
import { PlanningPageShell } from "@/components/planning/PlanningPageShell"
import { KpiCard, ProfileTag } from "@/components/planning/shared"
import { useWorkspace } from "@/providers/AuthProvider"
import { usePlanningSets } from "@/hooks/usePlanningsets"
import type { PlanningSet } from "@/types/database"
import { cn } from "@/lib/utils"

function money(n: number): string {
  return `£${Math.round(n).toLocaleString()}`
}

function YieldBadge({ value }: { value: number }) {
  if (value <= 0) return <span className="text-[11px] text-slate-400">—</span>
  const cls =
    value >= 8 ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
    value >= 5 ? "text-[var(--brand)] bg-[var(--brand-soft)] border-[var(--color-brand-100)]" :
    value >= 3 ? "text-amber-700 bg-amber-50 border-amber-200" :
                 "text-red-700 bg-red-50 border-red-200"
  return <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap", cls)}>{value.toFixed(1)}%</span>
}

export default function YieldIntelligencePage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { data: sets = [], isLoading } = usePlanningSets(workspace?.id)

  // Only sets with a meaningful yield basis
  const withYield = useMemo(() => sets.filter((s) => s.gross_yield > 0 || s.net_yield > 0), [sets])

  const grossVals = withYield.filter((s) => s.gross_yield > 0)
  const netVals = withYield.filter((s) => s.net_yield > 0)
  const avgGross = grossVals.length ? grossVals.reduce((a, s) => a + s.gross_yield, 0) / grossVals.length : 0
  const avgNet = netVals.length ? netVals.reduce((a, s) => a + s.net_yield, 0) / netVals.length : 0
  const best = [...netVals].sort((a, b) => b.net_yield - a.net_yield)[0] as PlanningSet | undefined
  const worst = [...netVals].sort((a, b) => a.net_yield - b.net_yield)[0] as PlanningSet | undefined
  const totalNetMonthly = sets.reduce((a, s) => a + Math.max(s.net_monthly_income, 0), 0)

  const ranked = useMemo(() => [...sets].sort((a, b) => b.net_yield - a.net_yield), [sets])

  return (
    <PlanningPageShell
      title="Yield Intelligence"
      subtitle="Gross and net yield analysis derived from your planning sets."
      badge={{ label: "YI", colour: "#7C3AED" }}
    >
      {/* KPI Row — live */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Avg Gross Yield" value={isLoading ? "—" : avgGross > 0 ? `${avgGross.toFixed(1)}%` : "—"} subtitle="across sets" icon={TrendingUp} iconColour="#10B981" />
        <KpiCard label="Avg Net Yield" value={isLoading ? "—" : avgNet > 0 ? `${avgNet.toFixed(1)}%` : "—"} subtitle="after costs" icon={TrendingDown} iconColour="#2563EB" />
        <KpiCard label="Best Net Yield" value={isLoading ? "—" : best ? `${best.net_yield.toFixed(1)}%` : "—"} subtitle={best?.title?.slice(0, 22)} icon={Trophy} iconColour="#F59E0B" />
        <KpiCard label="Lowest Net Yield" value={isLoading ? "—" : worst ? `${worst.net_yield.toFixed(1)}%` : "—"} subtitle={worst?.title?.slice(0, 22)} icon={AlertTriangle} iconColour="#EF4444" />
        <KpiCard label="Combined Net/mo" value={isLoading ? "—" : totalNetMonthly > 0 ? money(totalNetMonthly) : "—"} subtitle={`${sets.length} set${sets.length !== 1 ? "s" : ""}`} icon={Building2} iconColour="#7C3AED" />
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-[13px] text-slate-400">Loading yield data…</div>
      ) : sets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BarChart2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-slate-700">No yield data yet</p>
          <p className="text-[12.5px] text-slate-400 mt-1 max-w-sm mx-auto">Create planning sets with income and property value to see gross and net yields here.</p>
          <Link href="/property-manager/planning/wizard" className="inline-flex items-center gap-2 mt-4 h-9 px-5 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors">New Planning Set</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-[14px] font-semibold text-slate-900">Yield Table</h2>
            <p className="text-[12px] text-slate-500 mt-0.5">Live yield metrics across all planning sets</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  {["Planning Set", "Profile", "Gross/mo", "Net/mo", "Upfront", "Gross Yield", "Net Yield", "ROI", ""].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranked.map((s, i) => (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/property-manager/planning/sets/${s.id}/overview`)}
                    className={cn("border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer", i % 2 !== 0 && "bg-slate-50/20")}
                  >
                    <td className="px-3 py-2.5 font-medium text-slate-800 text-[12px] max-w-[200px] truncate">{s.title}</td>
                    <td className="px-3 py-2.5"><ProfileTag profileKey={s.operation_profile} size="sm" /></td>
                    <td className="px-3 py-2.5 text-[12px] text-slate-600 whitespace-nowrap">{s.gross_monthly_income > 0 ? money(s.gross_monthly_income) : "—"}</td>
                    <td className="px-3 py-2.5 text-[12px] font-semibold text-slate-800 whitespace-nowrap">{s.net_monthly_income > 0 ? money(s.net_monthly_income) : "—"}</td>
                    <td className="px-3 py-2.5 text-[12px] text-slate-600 whitespace-nowrap">{s.upfront_cash_required > 0 ? money(s.upfront_cash_required) : "—"}</td>
                    <td className="px-3 py-2.5"><YieldBadge value={s.gross_yield} /></td>
                    <td className="px-3 py-2.5"><YieldBadge value={s.net_yield} /></td>
                    <td className="px-3 py-2.5 text-[12px] text-slate-600 whitespace-nowrap">{s.roi > 0 ? `${s.roi.toFixed(1)}%` : "—"}</td>
                    <td className="px-3 py-2.5">
                      <ArrowUpRight className="w-4 h-4 text-slate-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {withYield.length === 0 && (
            <div className="px-5 py-4 bg-amber-50 border-t border-amber-100 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-[12px] text-amber-900">No sets have a property value yet, so yields read 0%. Add a property/purchase value in a set&apos;s assumptions to compute gross and net yield.</p>
            </div>
          )}
        </div>
      )}
    </PlanningPageShell>
  )
}
