"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import {
  TrendingUp,
  BarChart2,
  PoundSterling,
  CheckCircle2,
  Star,
  Info,
  FolderOpen,
} from "lucide-react"
import { PlanningPageShell } from "@/components/planning/PlanningPageShell"
import { KpiCard, RiskPill, ProfileTag } from "@/components/planning/shared"
import { useWorkspace } from "@/providers/AuthProvider"
import { usePlanningSets } from "@/hooks/usePlanningsets"
import { getProfileByKey } from "@/lib/planning/profiles"

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function money(n: number): string {
  return `£${Math.round(n).toLocaleString()}`
}
function riskLevel(score: number): "Low" | "Medium" | "High" {
  if (score < 30) return "Low"
  if (score < 50) return "Medium"
  return "High"
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export default function ForecastsPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { data: sets = [], isLoading } = usePlanningSets(workspace?.id)

  // Combined live figures across all sets
  const combinedGross = sets.reduce((a, s) => a + Math.max(s.gross_monthly_income, 0), 0)
  const combinedCosts = sets.reduce((a, s) => a + Math.max(s.total_monthly_expenses, 0), 0)
  const combinedNet = sets.reduce((a, s) => a + Math.max(s.net_monthly_income, 0), 0)
  const totalUpfront = sets.reduce((a, s) => a + Math.max(s.upfront_cash_required, 0), 0)
  const profitablePlans = sets.filter((s) => s.net_monthly_income > 0).length
  const bestSet = [...sets].sort((a, b) => b.net_yield - a.net_yield)[0]
  const annualNet = combinedNet * 12

  // Best-performing profile by avg net yield (live)
  const bestProfile = useMemo(() => {
    const byProfile = new Map<string, { sum: number; n: number }>()
    for (const s of sets) {
      if (s.net_yield <= 0) continue
      const cur = byProfile.get(s.operation_profile) ?? { sum: 0, n: 0 }
      cur.sum += s.net_yield
      cur.n += 1
      byProfile.set(s.operation_profile, cur)
    }
    let top: { key: string; avg: number } | null = null
    for (const [key, v] of byProfile) {
      const avg = v.sum / v.n
      if (!top || avg > top.avg) top = { key, avg }
    }
    return top
  }, [sets])

  // 12-month projection: flat combined net (honest — no fabricated growth curve)
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return months.map((m) => ({ month: m, gross: combinedGross, costs: combinedCosts, net: combinedNet }))
  }, [combinedGross, combinedCosts, combinedNet])

  const cumulativeData = useMemo(() => {
    let acc = -totalUpfront
    return monthlyData.map((m) => {
      acc += m.net
      return { month: m.month, cumulative: Math.round(acc) }
    })
  }, [monthlyData, totalUpfront])

  const rankedPlans = useMemo(() => [...sets].sort((a, b) => b.net_monthly_income - a.net_monthly_income), [sets])

  return (
    <PlanningPageShell
      title="Forecasts"
      subtitle="Financial projections and cashflow analysis across your planning sets."
    >
      {/* KPI strip — live */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KpiCard label="Combined Net/mo" value={isLoading ? "—" : combinedNet > 0 ? money(combinedNet) : "—"} subtitle={`${sets.length} set${sets.length !== 1 ? "s" : ""}`} icon={TrendingUp} iconColour="#10B981" />
        <KpiCard label="Best Net Yield" value={isLoading ? "—" : bestSet && bestSet.net_yield > 0 ? `${bestSet.net_yield.toFixed(1)}%` : "—"} subtitle={bestSet?.title?.slice(0, 18)} icon={BarChart2} iconColour="#7C3AED" />
        <KpiCard label="Total Upfront Cash" value={isLoading ? "—" : totalUpfront > 0 ? money(totalUpfront) : "—"} subtitle="across pipeline" icon={PoundSterling} iconColour="#2563EB" />
        <KpiCard label="Profitable Plans" value={isLoading ? "—" : `${profitablePlans} / ${sets.length}`} subtitle="positive net" icon={CheckCircle2} iconColour="#10B981" />
        <KpiCard label="Best-Performing Profile" value={isLoading ? "—" : bestProfile ? (getProfileByKey(bestProfile.key)?.label ?? bestProfile.key) : "—"} subtitle={bestProfile ? `Avg net yield ${bestProfile.avg.toFixed(1)}%` : undefined} icon={Star} iconColour="#F59E0B" />
        <KpiCard label="12-Month Net Forecast" value={isLoading ? "—" : annualNet > 0 ? money(annualNet) : "—"} subtitle="combined net cashflow" icon={TrendingUp} iconColour="#7C3AED" />
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-[13px] text-slate-400">Loading forecast data…</div>
      ) : sets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-slate-700">No forecast data yet</p>
          <p className="text-[12.5px] text-slate-400 mt-1 max-w-sm mx-auto">Create planning sets with income and cost figures to project combined cashflow here.</p>
          <Link href="/property-manager/planning/wizard" className="inline-flex items-center gap-2 mt-4 h-9 px-5 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors">New Planning Set</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left column charts */}
            <div className="lg:col-span-2 space-y-5">
              {/* Combined Monthly Cashflow */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="mb-4">
                  <h3 className="text-[14px] font-bold text-slate-900">Combined Monthly Cashflow</h3>
                  <p className="text-[12px] text-slate-400">Gross income vs costs vs net — all planning sets (flat projection of current model)</p>
                </div>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(Number(v) / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => `£${Number(v).toLocaleString()}`} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="gross" name="Gross Income" fill="#DBEAFE" stackId="a" />
                      <Bar dataKey="costs" name="Total Costs" fill="#FEE2E2" stackId="b" />
                      <Line type="monotone" dataKey="net" name="Net Cashflow" stroke="#7C3AED" strokeWidth={2.5} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cumulative cashflow & breakeven */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-900">Cumulative Cashflow & Breakeven</h3>
                    <p className="text-[12px] text-slate-400">All sets combined, starting from {money(-totalUpfront)} upfront</p>
                  </div>
                </div>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(Number(v) / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => `£${Number(v).toLocaleString()}`} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                      <Area type="monotone" dataKey="cumulative" name="Cumulative Net" stroke="#10B981" strokeWidth={2.5} fill="url(#cumGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right sidebar — plans by net/mo (live) */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="text-[14px] font-bold text-slate-900 mb-3">Plans by Net / Mo</h3>
                <div className="space-y-2">
                  {rankedPlans.map((plan, i) => (
                    <button
                      key={plan.id}
                      onClick={() => router.push(`/property-manager/planning/sets/${plan.id}/overview`)}
                      className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0 w-full text-left hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <span className="text-[12px] font-bold text-slate-400 w-4 shrink-0">{i + 1}</span>
                      <ProfileTag profileKey={plan.operation_profile} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-slate-800 truncate">{plan.title}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-bold text-slate-900">{plan.net_monthly_income > 0 ? `${money(plan.net_monthly_income)}/mo` : "—"}</p>
                        <RiskPill level={riskLevel(plan.risk_score)} size="sm" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="text-[14px] font-bold text-slate-900 mb-3">Forecast Basis</h3>
                <p className="text-[12px] text-slate-500">
                  Projections use each set&apos;s current modelled income and costs, held flat across 12 months. Refine a set&apos;s assumptions to update its contribution.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-6 text-[12px] text-slate-400">
            <Info className="w-3.5 h-3.5 shrink-0" />
            All figures are forecasts derived from your planning sets. Actual results may vary.
          </div>
        </>
      )}
    </PlanningPageShell>
  )
}
