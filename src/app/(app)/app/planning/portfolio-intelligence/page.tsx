"use client"

import React, { useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Building2,
  Star,
  BarChart2,
  TrendingDown,
  Shield,
  AlertTriangle,
} from "lucide-react"
import { PlanningPageShell } from "@/components/planning/PlanningPageShell"
import { KpiCard, ProfileTag, RiskPill } from "@/components/planning/shared"
import { useWorkspace } from "@/providers/AuthProvider"
import { usePlanningSets } from "@/hooks/usePlanningsets"
import type { PlanningSet } from "@/types/database"

function money(n: number): string {
  return `£${Math.round(n).toLocaleString()}`
}
function riskLevel(score: number): "Low" | "Medium" | "High" {
  if (score < 30) return "Low"
  if (score < 60) return "Medium"
  return "High"
}

function SetTile({ set, onClick }: { set: PlanningSet; onClick: () => void }) {
  return (
    <button onClick={onClick} className="bg-white rounded-xl border border-[#E2E8F0] p-3.5 text-left hover:shadow-md hover:border-slate-300 transition-all w-full">
      <p className="text-[12.5px] font-bold text-slate-900 truncate">{set.title}</p>
      <div className="mt-1.5"><ProfileTag profileKey={set.operation_profile} size="sm" /></div>
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-[11px] text-slate-400">Net yield</span>
        <span className="text-[12.5px] font-bold text-slate-800">{set.net_yield > 0 ? `${set.net_yield.toFixed(1)}%` : "—"}</span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[11px] text-slate-400">Net / mo</span>
        <span className="text-[12px] font-semibold text-slate-700">{set.net_monthly_income > 0 ? money(set.net_monthly_income) : "—"}</span>
      </div>
    </button>
  )
}

export default function PortfolioIntelligencePage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { data: sets = [], isLoading } = usePlanningSets(workspace?.id)

  // Tier by net yield
  const { stars, avgs, unders } = useMemo(() => {
    const withYield = sets.filter((s) => s.net_yield > 0)
    return {
      stars: withYield.filter((s) => s.net_yield >= 7),
      avgs: withYield.filter((s) => s.net_yield >= 4 && s.net_yield < 7),
      unders: withYield.filter((s) => s.net_yield < 4),
    }
  }, [sets])

  const open = (id: string) => router.push(`/property-manager/planning/sets/${id}/overview`)

  // Health: blend of avg net yield + share of low-risk sets
  const netVals = sets.filter((s) => s.net_yield > 0)
  const avgNet = netVals.length ? netVals.reduce((a, s) => a + s.net_yield, 0) / netVals.length : 0
  const lowRiskShare = sets.length ? sets.filter((s) => s.risk_score < 30).length / sets.length : 0
  const healthScore = Math.round(Math.min(100, avgNet * 8 + lowRiskShare * 40))

  // Risk distribution
  const riskDist = [
    { label: "Low Risk", count: sets.filter((s) => s.risk_score < 30).length, color: "#16A34A" },
    { label: "Medium Risk", count: sets.filter((s) => s.risk_score >= 30 && s.risk_score < 60).length, color: "#D97706" },
    { label: "High Risk", count: sets.filter((s) => s.risk_score >= 60).length, color: "#DC2626" },
  ]
  const totalUpfront = sets.reduce((a, s) => a + Math.max(s.upfront_cash_required, 0), 0)

  return (
    <PlanningPageShell
      title="Portfolio Intelligence"
      subtitle="Performance and risk analytics across your planning sets."
      badge={{ label: "PI", colour: "#2563EB" }}
    >
      {/* KPI Row — live */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Total Sets" value={isLoading ? "—" : String(sets.length)} icon={Building2} iconColour="#2563EB" />
        <KpiCard label="Star Performers" value={isLoading ? "—" : String(stars.length)} subtitle="net yield ≥ 7%" icon={Star} iconColour="#F59E0B" />
        <KpiCard label="Average" value={isLoading ? "—" : String(avgs.length)} subtitle="4–7% net yield" icon={BarChart2} iconColour="#64748B" />
        <KpiCard label="Underperformers" value={isLoading ? "—" : String(unders.length)} subtitle="under 4%" icon={TrendingDown} iconColour="#EF4444" />
        <KpiCard label="Health Score" value={isLoading ? "—" : netVals.length ? `${healthScore}/100` : "—"} icon={Shield} iconColour="#10B981" />
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-[13px] text-slate-400">Loading portfolio data…</div>
      ) : sets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-slate-700">No portfolio data yet</p>
          <p className="text-[12.5px] text-slate-400 mt-1 max-w-sm mx-auto">Create planning sets to benchmark performance and risk across your pipeline.</p>
          <Link href="/property-manager/planning/wizard" className="inline-flex items-center gap-2 mt-4 h-9 px-5 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors">New Planning Set</Link>
        </div>
      ) : (
        <>
          {/* Performance Heat Map */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-5">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-[14px] font-semibold text-slate-900">Performance Tiers</h2>
              <p className="text-[12px] text-slate-500 mt-0.5">Sets grouped by net yield ({netVals.length} with yield data)</p>
            </div>
            <div className="p-5 space-y-5">
              {netVals.length === 0 && (
                <p className="text-[12.5px] text-slate-400">No sets have a property value yet, so net yields read 0%. Add property values in set assumptions to tier performance.</p>
              )}
              {([
                { title: "Star Performers", icon: Star, colour: "#F59E0B", items: stars },
                { title: "Average Performers", icon: BarChart2, colour: "#64748B", items: avgs },
                { title: "Underperformers", icon: AlertTriangle, colour: "#EF4444", items: unders },
              ] as { title: string; icon: React.ElementType; colour: string; items: PlanningSet[] }[]).filter((g) => g.items.length > 0).map((group) => (
                <div key={group.title}>
                  <div className="flex items-center gap-2 mb-3">
                    <group.icon className="w-3.5 h-3.5" style={{ color: group.colour }} />
                    <span className="text-[12px] font-bold" style={{ color: group.colour }}>{group.title} ({group.items.length})</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {group.items.map((s) => <SetTile key={s.id} set={s} onClick={() => open(s.id)} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk distribution + capital */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-[14px] font-semibold text-slate-900">Risk Distribution</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">Across all {sets.length} planning set{sets.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="p-5 space-y-4">
                {riskDist.map((r) => {
                  const pct = sets.length ? Math.round((r.count / sets.length) * 100) : 0
                  return (
                    <div key={r.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                          <span className="text-[12.5px] font-semibold text-slate-700">{r.label}</span>
                        </div>
                        <span className="text-[12.5px] font-bold text-slate-800">{r.count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ background: r.color, width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-[14px] font-semibold text-slate-900">Highest Risk Sets</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">Combined upfront across pipeline: {money(totalUpfront)}</p>
              </div>
              <div className="p-2">
                {[...sets].sort((a, b) => b.risk_score - a.risk_score).slice(0, 6).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => open(s.id)}
                    className="flex items-center gap-3 px-3 py-2.5 w-full text-left hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-slate-800 truncate">{s.title}</p>
                      <p className="text-[11px] text-slate-400">{s.net_yield > 0 ? `${s.net_yield.toFixed(1)}% net yield` : "No yield data"}</p>
                    </div>
                    <RiskPill level={riskLevel(s.risk_score)} size="sm" />
                    <span className="text-[12px] font-bold text-slate-700 w-7 text-right shrink-0">{s.risk_score}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </PlanningPageShell>
  )
}
