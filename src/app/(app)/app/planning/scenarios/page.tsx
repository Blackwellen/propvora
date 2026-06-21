"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Clock,
  ShieldCheck,
  ChevronDown,
  FolderOpen,
} from "lucide-react"
import { PlanningPageShell } from "@/components/planning/PlanningPageShell"
import { KpiCard } from "@/components/planning/shared"
import { useWorkspace } from "@/providers/AuthProvider"
import { usePlanningSets } from "@/hooks/usePlanningsets"
import type { PlanningSet } from "@/types/database"
import { cn } from "@/lib/utils"

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function money(n: number): string {
  return `£${Math.round(n).toLocaleString()}`
}

interface ScenarioCard {
  type: "base" | "optimistic" | "conservative" | "stress"
  label: string
  net: number
  occupancy: number
  totalCosts: number
  annualCashflow: number
  breakeven: number
  assumptions: string
  colour: string
  bgColour: string
}

// Derive 4 scenarios from a real planning set's live figures.
// Base = the set as modelled; the others apply transparent income/cost multipliers.
function buildScenarios(set: PlanningSet): ScenarioCard[] {
  const baseNet = Math.max(set.net_monthly_income, 0)
  const baseCosts = Math.max(set.total_monthly_expenses, 0)
  const baseGross = Math.max(set.gross_monthly_income, baseNet + baseCosts)
  const baseBreakeven = set.breakeven_month > 0 ? set.breakeven_month : 0

  const variants: { type: ScenarioCard["type"]; label: string; occ: number; incomeMult: number; costMult: number; colour: string; bgColour: string; note: string }[] = [
    { type: "base", label: "Base Case", occ: 90, incomeMult: 1, costMult: 1, colour: "#2563EB", bgColour: "#EFF6FF", note: "Current modelled assumptions" },
    { type: "optimistic", label: "Optimistic", occ: 95, incomeMult: 1.1, costMult: 0.98, colour: "#10B981", bgColour: "#ECFDF5", note: "+10% income, costs -2%" },
    { type: "conservative", label: "Conservative", occ: 80, incomeMult: 0.92, costMult: 1.1, colour: "#F59E0B", bgColour: "#FFFBEB", note: "-8% income, costs +10%" },
    { type: "stress", label: "Stress Case", occ: 65, incomeMult: 0.78, costMult: 1.2, colour: "#EF4444", bgColour: "#FFF1F2", note: "-22% income, costs +20%" },
  ]

  return variants.map((v) => {
    const gross = baseGross * v.incomeMult
    const costs = baseCosts * v.costMult
    const net = Math.round(gross - costs)
    const breakeven = baseBreakeven > 0 && net > 0 ? Math.round(baseBreakeven * (baseNet > 0 ? baseNet / net : 1)) : 0
    return {
      type: v.type,
      label: v.label,
      net,
      occupancy: v.occ,
      totalCosts: Math.round(costs),
      annualCashflow: net * 12,
      breakeven,
      assumptions: v.note,
      colour: v.colour,
      bgColour: v.bgColour,
    }
  })
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export default function ScenariosPage() {
  const { workspace } = useWorkspace()
  const { data: sets = [], isLoading } = usePlanningSets(workspace?.id)

  const [activeSetId, setActiveSetId] = useState<string | null>(null)
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null)

  const activeSet = useMemo(
    () => sets.find((s) => s.id === activeSetId) ?? sets[0] ?? null,
    [sets, activeSetId]
  )

  const scenarios = useMemo(() => (activeSet ? buildScenarios(activeSet) : []), [activeSet])

  const base = scenarios.find((s) => s.type === "base")
  const best = scenarios.length ? [...scenarios].sort((a, b) => b.net - a.net)[0] : undefined
  const worst = scenarios.length ? [...scenarios].sort((a, b) => a.net - b.net)[0] : undefined
  const spread = best && worst ? best.net - worst.net : 0
  const breakevens = scenarios.map((s) => s.breakeven).filter((b) => b > 0)
  const breakevenRange = breakevens.length
    ? `${Math.min(...breakevens)} – ${Math.max(...breakevens)} months`
    : "—"

  const comparisonData = scenarios.map((s) => ({ name: s.label, net: s.net, colour: s.colour }))
  const deltaData = scenarios
    .filter((s) => s.type !== "base")
    .map((s) => ({ name: s.label, delta: base ? s.net - base.net : 0 }))
  const maxAbsDelta = Math.max(1, ...deltaData.map((d) => Math.abs(d.delta)))

  const comparisonRows = base
    ? [
        { metric: "Net Income/mo", get: (s: ScenarioCard) => money(s.net) },
        { metric: "Total Costs/mo", get: (s: ScenarioCard) => money(s.totalCosts) },
        { metric: "Annual Cashflow", get: (s: ScenarioCard) => money(s.annualCashflow) },
        { metric: "Breakeven (months)", get: (s: ScenarioCard) => (s.breakeven > 0 ? String(s.breakeven) : "—") },
        { metric: "Occupancy", get: (s: ScenarioCard) => `${s.occupancy}%` },
      ]
    : []

  return (
    <PlanningPageShell
      title="Scenarios"
      subtitle="Stress-test your planning sets across multiple outcomes to make confident decisions."
    >
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Best Case Outcome" value={isLoading ? "—" : best ? `${money(best.net)}/mo` : "—"} subtitle={best?.label} icon={TrendingUp} iconColour="#10B981" />
        <KpiCard label="Downside Outcome" value={isLoading ? "—" : worst ? `${money(worst.net)}/mo` : "—"} subtitle={worst?.label} icon={TrendingDown} iconColour="#EF4444" />
        <KpiCard label="Variance Spread" value={isLoading ? "—" : spread > 0 ? `${money(spread)}/mo` : "—"} subtitle="Best vs worst case" icon={ArrowLeftRight} iconColour="#7C3AED" />
        <KpiCard label="Breakeven Timing" value={isLoading ? "—" : breakevenRange} subtitle="Range across scenarios" icon={Clock} iconColour="#F59E0B" />
        <KpiCard label="Base Net" value={isLoading ? "—" : base ? `${money(base.net)}/mo` : "—"} subtitle="Current model" icon={ShieldCheck} iconColour="#2563EB" />
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-[13px] text-slate-400">Loading planning sets…</div>
      ) : sets.length === 0 || !activeSet ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-slate-700">No planning sets to model</p>
          <p className="text-[12.5px] text-slate-400 mt-1 max-w-sm mx-auto">
            Create a planning set with income and cost figures to stress-test scenarios against it.
          </p>
          <Link href="/property-manager/planning/wizard" className="inline-flex items-center gap-2 mt-4 h-9 px-5 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors">New Planning Set</Link>
        </div>
      ) : (
        <>
          {/* Plan selector tabs (live sets) */}
          <div className="flex items-center gap-2 mb-5 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1">
            {sets.map((s) => (
              <button
                key={s.id}
                onClick={() => { setActiveSetId(s.id); setExpandedScenario(null) }}
                className={cn(
                  "px-4 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap transition-all shrink-0 border",
                  activeSet.id === s.id
                    ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                )}
              >
                {s.title}
              </button>
            ))}
          </div>

          {base && base.net === 0 && base.totalCosts === 0 && (
            <div className="mb-5 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-[12.5px] text-amber-800">
              This set has no income or cost figures yet, so scenarios read £0. Add income and expenses in the set to model outcomes.
            </div>
          )}

          {/* Four scenario cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {scenarios.map((scenario) => (
              <div
                key={scenario.type}
                style={{ borderColor: scenario.colour + "40", background: scenario.bgColour }}
                className="rounded-2xl border-2 p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[14px] font-bold text-slate-900">{scenario.label}</h3>
                </div>

                <p style={{ color: scenario.colour }} className="text-[26px] font-bold leading-none mb-1">
                  {money(scenario.net)}
                </p>
                <p className="text-[11.5px] text-slate-500 mb-4">{scenario.assumptions}</p>

                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  {[
                    { label: "Occupancy", value: `${scenario.occupancy}%` },
                    { label: "Total Costs/mo", value: money(scenario.totalCosts) },
                    { label: "Annual", value: `£${(scenario.annualCashflow / 1000).toFixed(0)}k` },
                  ].map((m) => (
                    <div key={m.label} className="bg-white/70 rounded-xl p-2">
                      <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">{m.label}</p>
                      <p className="text-[12px] font-bold text-slate-800 mt-0.5">{m.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[12px] text-slate-500 mb-3">
                  <span>Breakeven</span>
                  <span className="font-bold text-slate-800">{scenario.breakeven > 0 ? `${scenario.breakeven} months` : "—"}</span>
                </div>

                <button
                  onClick={() => setExpandedScenario(expandedScenario === scenario.type ? null : scenario.type)}
                  className="w-full h-8 rounded-xl border text-[12.5px] font-medium hover:bg-white/50 transition-colors flex items-center justify-center gap-1.5"
                  style={{ borderColor: scenario.colour + "33", color: scenario.colour }}
                >
                  View details
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expandedScenario === scenario.type && "rotate-180")} />
                </button>

                {expandedScenario === scenario.type && (
                  <div className="mt-3 pt-3 border-t space-y-1.5" style={{ borderColor: scenario.colour + "20" }}>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-slate-500">Monthly net margin</span>
                      <span className="font-bold" style={{ color: scenario.colour }}>
                        {scenario.net + scenario.totalCosts > 0 ? Math.round((scenario.net / (scenario.net + scenario.totalCosts)) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-slate-500">24-month total</span>
                      <span className="font-bold text-slate-800">{money(scenario.annualCashflow * 2)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            {/* Scenario comparison bar chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-[13.5px] font-bold text-slate-900 mb-1">Scenario Comparison (Net per Month)</h3>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(Number(v) / 1000).toFixed(1)}k`} />
                    <Tooltip formatter={(v) => `£${Number(v).toLocaleString()}/mo`} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                    <Bar dataKey="net" name="Net/mo" radius={[6, 6, 0, 0]}>
                      {comparisonData.map((entry, index) => (
                        <Cell key={index} fill={entry.colour} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Delta vs Base */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-[13.5px] font-bold text-slate-900 mb-3">Delta vs Base Case (per month)</h3>
              <div className="space-y-3 mt-4">
                {deltaData.map((d) => {
                  const isPos = d.delta >= 0
                  const pct = (Math.abs(d.delta) / maxAbsDelta) * 100
                  return (
                    <div key={d.name} className="flex items-center gap-3">
                      <span className="text-[12px] font-medium text-slate-600 w-28 shrink-0">{d.name}</span>
                      <div className="flex-1 flex items-center">
                        {!isPos && (
                          <div className="flex justify-end" style={{ width: `${pct}%`, minWidth: 40 }}>
                            <div className="h-8 rounded-l-xl w-full flex items-center justify-end pr-2" style={{ background: "rgba(239, 68, 68, 0.19)" }}>
                              <span className="text-[12px] font-bold text-red-600 whitespace-nowrap">{money(d.delta)}/mo</span>
                            </div>
                          </div>
                        )}
                        <div className="w-px h-8 bg-slate-200 shrink-0" />
                        {isPos && (
                          <div style={{ width: `${pct}%`, minWidth: 40 }}>
                            <div className="h-8 rounded-r-xl flex items-center pl-2" style={{ background: "rgba(16, 185, 129, 0.19)" }}>
                              <span className="text-[12px] font-bold text-emerald-600 whitespace-nowrap">+{money(d.delta)}/mo</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-[14px] font-bold text-slate-900">Scenario Comparison Table</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">METRIC</th>
                    {scenarios.map((s) => (
                      <th key={s.type} style={{ color: s.colour }} className="text-right text-[10.5px] font-semibold uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                        {s.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.metric} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3 text-[13px] font-semibold text-slate-700 whitespace-nowrap">{row.metric}</td>
                      {scenarios.map((s) => (
                        <td key={s.type} style={{ color: s.colour }} className="px-4 py-3 text-right text-[13px] font-bold whitespace-nowrap">
                          {row.get(s)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </PlanningPageShell>
  )
}
