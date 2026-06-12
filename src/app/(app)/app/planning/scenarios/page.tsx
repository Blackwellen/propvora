"use client"

import React, { useState } from "react"
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
  ChevronRight,
  Sparkles,
  Plus,
  Download,
  SplitSquareHorizontal,
} from "lucide-react"
import { PlanningPageShell } from "@/components/planning/PlanningPageShell"
import { KpiCard } from "@/components/planning/shared"
import { cn } from "@/lib/utils"

/* ─── Types & Demo data ─────────────────────────────────────────────────────── */

const DEMO_PLANNING_SETS_TABS = [
  { id: "1", label: "12-Room HMO — Nottingham" },
  { id: "2", label: "SA — Manchester Piccadilly" },
  { id: "3", label: "SA — Manchester Piccadilly (copy)" },
  { id: "4", label: "Student Let — Sheffield" },
  { id: "5", label: "Holiday Let — Lake District" },
]

interface ScenarioCard {
  type: "base" | "optimistic" | "conservative" | "stress"
  label: string
  net: number
  occupancy: number
  totalCosts: number
  annualCashflow: number
  breakeven: number
  score: number
  scoreLabel: string
  scoreColour: string
  assumptions: string
  colour: string
  bgColour: string
}

const SCENARIOS: ScenarioCard[] = [
  {
    type: "base",
    label: "Base Case",
    net: 2100,
    occupancy: 90,
    totalCosts: 3300,
    annualCashflow: 25200,
    breakeven: 19,
    score: 28,
    scoreLabel: "Healthy",
    scoreColour: "#10B981",
    assumptions: "90% occupancy, rents at £450/room",
    colour: "#2563EB",
    bgColour: "#EFF6FF",
  },
  {
    type: "optimistic",
    label: "Optimistic",
    net: 2580,
    occupancy: 95,
    totalCosts: 3240,
    annualCashflow: 30960,
    breakeven: 16,
    score: 20,
    scoreLabel: "Healthy",
    scoreColour: "#10B981",
    assumptions: "95% occupancy, rents +£25/room, costs stable",
    colour: "#10B981",
    bgColour: "#ECFDF5",
  },
  {
    type: "conservative",
    label: "Conservative",
    net: 1440,
    occupancy: 85,
    totalCosts: 3420,
    annualCashflow: 17280,
    breakeven: 27,
    score: 42,
    scoreLabel: "Watch",
    scoreColour: "#F59E0B",
    assumptions: "80% occupancy, costs +10%, no rent uplift",
    colour: "#F59E0B",
    bgColour: "#FFFBEB",
  },
  {
    type: "stress",
    label: "Stress Case",
    net: 580,
    occupancy: 65,
    totalCosts: 3740,
    annualCashflow: 6960,
    breakeven: 66,
    score: 65,
    scoreLabel: "At Risk",
    scoreColour: "#EF4444",
    assumptions: "65% occupancy, costs +20%, market rent fall",
    colour: "#EF4444",
    bgColour: "#FFF1F2",
  },
]

const COMPARISON_DATA = SCENARIOS.map((s) => ({
  name: s.label,
  net: s.net,
  colour: s.colour,
}))

const DELTA_DATA = [
  { name: "Optimistic",    delta: 480 },
  { name: "Conservative",  delta: -660 },
  { name: "Stress Case",   delta: -1520 },
]

const WATERFALL_DATA = [
  { name: "Base Case",        value: 2100,  fill: "#2563EB" },
  { name: "Rent Impact",      value: -430,  fill: "#EF4444" },
  { name: "Occupancy Impact", value: -990,  fill: "#EF4444" },
  { name: "Cost Inflation",   value: -200,  fill: "#F59E0B" },
  { name: "Other",            value: 100,   fill: "#10B981" },
  { name: "Stress Case",      value: 580,   fill: "#EF4444" },
]

const RISK_FACTORS = [
  { label: "Occupancy drops to 65%",       severity: "High",   impact: -990 },
  { label: "Costs increase by 20%",         severity: "High",   impact: -670 },
  { label: "Market rent falls by 8%",       severity: "Medium", impact: -430 },
  { label: "Void periods extend",           severity: "Medium", impact: -240 },
  { label: "Maintenance costs rise",        severity: "Low",    impact: -120 },
]

const COMPARISON_TABLE_DATA = [
  { metric: "Net Income/mo",     base: "£2,100", optimistic: "£2,580", conservative: "£1,440", stress: "£580",    bestWorst: "£2,000" },
  { metric: "Total Income/mo",   base: "£5,400", optimistic: "£5,820", conservative: "£4,860", stress: "£4,320",  bestWorst: "£1,500" },
  { metric: "Total Costs/mo",    base: "£3,300", optimistic: "£3,240", conservative: "£3,420", stress: "£3,740",  bestWorst: "£500" },
  { metric: "Annual Cashflow",   base: "£25,200",optimistic: "£30,960",conservative: "£17,280",stress: "£6,960",  bestWorst: "£24,000" },
  { metric: "Breakeven (months)",base: "19",     optimistic: "16",     conservative: "27",     stress: "66",      bestWorst: "50" },
  { metric: "Occupancy",         base: "90%",    optimistic: "95%",    conservative: "80%",    stress: "65%",     bestWorst: "30pp" },
]

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export default function ScenariosPage() {
  const [activePlanTab, setActivePlanTab] = useState("1")
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null)

  return (
    <PlanningPageShell
      title="Scenarios"
      subtitle="Stress-test your planning assumptions across multiple outcomes to make confident decisions."
      actions={
        <>
          <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <SplitSquareHorizontal className="w-3.5 h-3.5" />
            Compare Scenarios
          </button>
          <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add Scenario
          </button>
        </>
      }
    >
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <KpiCard
          label="Best Case Outcome"
          value="£2,580/mo"
          subtitle="Optimistic scenario"
          icon={TrendingUp}
          iconColour="#10B981"
        />
        <KpiCard
          label="Downside Outcome"
          value="£580/mo"
          subtitle="Stress scenario"
          icon={TrendingDown}
          iconColour="#EF4444"
        />
        <KpiCard
          label="Variance Spread"
          value="£2,000/mo"
          subtitle="Best vs worst case"
          icon={ArrowLeftRight}
          iconColour="#7C3AED"
        />
        <KpiCard
          label="Breakeven Timing"
          value="16 – 27 months"
          subtitle="Range across scenarios"
          icon={Clock}
          iconColour="#F59E0B"
        />
        <KpiCard
          label="Scenario Confidence"
          value="High (72%)"
          subtitle="Overall confidence score"
          icon={ShieldCheck}
          iconColour="#10B981"
        />
      </div>

      {/* Plan selector tabs */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1">
        {DEMO_PLANNING_SETS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePlanTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap transition-all shrink-0 border",
              activePlanTab === tab.id
                ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            )}
          >
            {tab.label}
          </button>
        ))}
        <div className="shrink-0">
          <select className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-600 focus:outline-none">
            <option>Scenario Currency: GBP (£)</option>
          </select>
        </div>
      </div>

      {/* Four scenario cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {SCENARIOS.map((scenario) => (
          <div
            key={scenario.type}
            style={{ borderColor: scenario.colour + "40", background: scenario.bgColour }}
            className="rounded-2xl border-2 p-5 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-slate-900">{scenario.label}</h3>
              <span
                style={{
                  background: scenario.scoreColour + "20",
                  color: scenario.scoreColour,
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
              >
                {scenario.scoreLabel} · {scenario.score}
              </span>
            </div>

            <p
              style={{ color: scenario.colour }}
              className="text-[28px] font-bold leading-none mb-1"
            >
              £{scenario.net.toLocaleString()}
            </p>
            <p className="text-[11.5px] text-slate-500 mb-4">{scenario.assumptions}</p>

            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              {[
                { label: "Occupancy",      value: `${scenario.occupancy}%` },
                { label: "Total Costs/mo", value: `£${scenario.totalCosts.toLocaleString()}` },
                { label: "Annual Cashflow",value: `£${(scenario.annualCashflow / 1000).toFixed(0)}k` },
              ].map((m) => (
                <div key={m.label} className="bg-white/70 rounded-xl p-2">
                  <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">
                    {m.label}
                  </p>
                  <p className="text-[12px] font-bold text-slate-800 mt-0.5">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[12px] text-slate-500 mb-3">
              <span>Breakeven</span>
              <span className="font-bold text-slate-800">{scenario.breakeven} months</span>
            </div>

            <button
              onClick={() =>
                setExpandedScenario(
                  expandedScenario === scenario.type ? null : scenario.type
                )
              }
              className="w-full h-8 rounded-xl border text-[12.5px] font-medium hover:bg-white/50 transition-colors flex items-center justify-center gap-1.5"
              style={{ borderColor: scenario.colour + "33", color: scenario.colour }}
            >
              View details
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 transition-transform",
                  expandedScenario === scenario.type && "rotate-180"
                )}
              />
            </button>

            {/* Expanded details */}
            {expandedScenario === scenario.type && (
              <div className="mt-3 pt-3 border-t space-y-1.5" style={{ borderColor: scenario.colour + "20" }}>
                <div className="flex justify-between text-[12px]">
                  <span className="text-slate-500">Monthly net margin</span>
                  <span className="font-bold" style={{ color: scenario.colour }}>
                    {Math.round((scenario.net / (scenario.net + scenario.totalCosts)) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-slate-500">24-month total</span>
                  <span className="font-bold text-slate-800">
                    £{(scenario.annualCashflow * 2).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts row: 2×2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        {/* A: Scenario comparison bar chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-[13.5px] font-bold text-slate-900 mb-1">
            Scenario Comparison (Net per Month)
          </h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={COMPARISON_DATA}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `£${(v / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  formatter={(v) => `£${Number(v).toLocaleString()}/mo`}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #E2E8F0",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="net" name="Net/mo" radius={[6, 6, 0, 0]}>
                  {COMPARISON_DATA.map((entry, index) => (
                    <Cell key={index} fill={entry.colour} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* B: Delta vs Base Case */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-[13.5px] font-bold text-slate-900 mb-3">
            Delta vs Base Case (per month)
          </h3>
          <div className="space-y-3 mt-4">
            {DELTA_DATA.map((d) => {
              const isPos = d.delta > 0
              const maxAbs = 1600
              const pct = (Math.abs(d.delta) / maxAbs) * 100
              return (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-[12px] font-medium text-slate-600 w-28 shrink-0">
                    {d.name}
                  </span>
                  <div className="flex-1 flex items-center">
                    {!isPos && (
                      <div
                        className="flex justify-end"
                        style={{ width: `${pct}%`, minWidth: 40 }}
                      >
                        <div
                          className="h-8 rounded-l-xl w-full flex items-center justify-end pr-2"
                          style={{ background: "#EF444430" }}
                        >
                          <span className="text-[12px] font-bold text-red-600 whitespace-nowrap">
                            £{d.delta.toLocaleString()}/mo
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="w-px h-8 bg-slate-200 shrink-0" />
                    {isPos && (
                      <div style={{ width: `${pct}%`, minWidth: 40 }}>
                        <div
                          className="h-8 rounded-r-xl flex items-center pl-2"
                          style={{ background: "#10B98130" }}
                        >
                          <span className="text-[12px] font-bold text-emerald-600 whitespace-nowrap">
                            +£{d.delta.toLocaleString()}/mo
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* C: Cashflow waterfall */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-[13.5px] font-bold text-slate-900 mb-1">
            Cashflow Waterfall (Base vs Stress)
          </h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={WATERFALL_DATA}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F1F5F9"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `£${(v / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  formatter={(v) => `£${Number(v).toLocaleString()}`}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #E2E8F0",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {WATERFALL_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* D: Top risk factors */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13.5px] font-bold text-slate-900">
              Top Risk Factors (Stress Case)
            </h3>
          </div>
          <div className="space-y-2.5">
            {RISK_FACTORS.map((rf) => {
              const sevColour =
                rf.severity === "High"
                  ? "#EF4444"
                  : rf.severity === "Medium"
                  ? "#F59E0B"
                  : "#10B981"
              return (
                <div key={rf.label} className="flex items-center gap-3">
                  <span
                    style={{
                      background: sevColour + "20",
                      color: sevColour,
                    }}
                    className="text-[10.5px] font-bold px-2 py-0.5 rounded-full w-14 text-center shrink-0"
                  >
                    {rf.severity}
                  </span>
                  <p className="text-[12.5px] text-slate-700 flex-1">{rf.label}</p>
                  <span className="text-[12.5px] font-bold text-red-600 shrink-0">
                    £{rf.impact.toLocaleString()}/mo
                  </span>
                </div>
              )
            })}
          </div>
          <button className="mt-4 w-full text-[12.5px] font-semibold text-[#2563EB] text-center hover:text-blue-700">
            View full risk register →
          </button>
        </div>
      </div>

      {/* Assumptions + AI + Mitigation row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5">
        {/* Key Assumptions & What Changed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-[13.5px] font-bold text-slate-900 mb-3">
            Key Assumptions & What Changed
          </h3>
          {[
            { label: "Base Case",               changes: "Primary assumptions", colour: "#2563EB" },
            { label: "Optimistic vs Base",       changes: "5 changes",           colour: "#10B981" },
            { label: "Conservative vs Base",     changes: "8 changes",           colour: "#F59E0B" },
            { label: "Stress vs Base",           changes: "7 changes",           colour: "#EF4444" },
          ].map((a) => (
            <div
              key={a.label}
              className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: a.colour }}
              />
              <p className="text-[12.5px] font-semibold text-slate-800 flex-1">
                {a.label}
              </p>
              <span className="text-[11.5px] text-slate-400">{a.changes}</span>
              <div style={{ color: "#CBD5E1" }}>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>

        {/* AI Recommendation */}
        <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl border border-violet-200/60 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-xl bg-[#7C3AED] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-[13.5px] font-bold text-slate-900">AI Recommendation</h3>
            <span className="text-[10px] font-bold bg-[#7C3AED] text-white px-1.5 py-0.5 rounded-full">
              Beta
            </span>
          </div>
          <p className="text-[12.5px] text-slate-600 mb-3">
            The <strong>Optimistic</strong> scenario offers the best balance of upside
            (£480/mo) with limited downside risk.
          </p>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[12.5px] text-slate-500">Primary recommendation:</p>
            <span className="bg-[#10B981] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              Optimistic
            </span>
          </div>
          <p className="text-[12px] text-slate-400 mb-3">
            Confidence: <strong>72%</strong>
          </p>
          <button className="w-full text-[12.5px] font-semibold text-[#7C3AED] hover:text-violet-700 text-center">
            View rationale →
          </button>
        </div>

        {/* Risk Mitigation Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-[13.5px] font-bold text-slate-900 mb-3">
            Risk Mitigation Actions
          </h3>
          {[
            {
              label: "Secure guarantors to protect against void periods",
              impact: "High impact",
            },
            {
              label: "Lock in fixed energy contracts to reduce cost risk",
              impact: "High impact",
            },
            {
              label: "Review rent monthly and adjust pricing strategy",
              impact: "Medium impact",
            },
          ].map((action) => (
            <div
              key={action.label}
              className="flex items-start gap-2.5 py-2.5 border-b border-slate-100 last:border-0"
            >
              <div className="w-4 h-4 rounded-full border-2 border-slate-300 mt-0.5 shrink-0" />
              <div>
                <p className="text-[12.5px] text-slate-700">{action.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{action.impact}</p>
              </div>
            </div>
          ))}
          <button className="mt-3 w-full text-[12.5px] font-semibold text-[#2563EB] hover:text-blue-700 text-center">
            View all actions →
          </button>
        </div>
      </div>

      {/* Comparison Table + Confidence + Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* Scenario Comparison Table (2 cols wide) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-[14px] font-bold text-slate-900">
              Scenario Comparison Table
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                    METRIC
                  </th>
                  {(
                    [
                      ["BASE CASE",    "#2563EB"],
                      ["OPTIMISTIC",   "#10B981"],
                      ["CONSERVATIVE", "#F59E0B"],
                      ["STRESS CASE",  "#EF4444"],
                      ["BEST vs WORST","#64748B"],
                    ] as [string, string][]
                  ).map(([h, c]) => (
                    <th
                      key={h}
                      style={{ color: c }}
                      className="text-right text-[10.5px] font-semibold uppercase tracking-wide px-4 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_TABLE_DATA.map((row) => (
                  <tr
                    key={row.metric}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="px-5 py-3 text-[13px] font-semibold text-slate-700">
                      {row.metric}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold text-[#2563EB]">
                      {row.base}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold text-[#10B981]">
                      {row.optimistic}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold text-[#F59E0B]">
                      {row.conservative}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-bold text-[#EF4444]">
                      {row.stress}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-semibold text-slate-500">
                      {row.bestWorst}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Confidence Breakdown + Health Distribution stacked */}
        <div className="space-y-4">
          {/* Confidence Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-[13.5px] font-bold text-slate-900 mb-4">
              Scenario Confidence Breakdown
            </h3>
            <div className="flex items-center gap-4 mb-3">
              <div className="relative w-16 h-16 shrink-0">
                <svg
                  className="w-16 h-16 -rotate-90"
                  viewBox="0 0 36 36"
                  aria-hidden="true"
                >
                  <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="3.5"
                    strokeDasharray="45 55"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="3.5"
                    strokeDasharray="25 75"
                    strokeDashoffset="-45"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="#7C3AED"
                    strokeWidth="3.5"
                    strokeDasharray="20 80"
                    strokeDashoffset="-70"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="3.5"
                    strokeDasharray="10 90"
                    strokeDashoffset="-90"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[14px] font-bold text-slate-900">
                  72%
                </span>
              </div>
              <p className="text-[12.5px] font-bold text-slate-800">Overall</p>
            </div>
            {[
              { label: "Data Quality",     value: "High",   pct: "45%", colour: "#2563EB" },
              { label: "Market Certainty", value: "Medium", pct: "25%", colour: "#F59E0B" },
              { label: "Execution Risk",   value: "Medium", pct: "20%", colour: "#7C3AED" },
              { label: "Cost Certainty",   value: "Low",    pct: "10%", colour: "#F97316" },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-3 py-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: c.colour }}
                />
                <p className="text-[12px] text-slate-600 flex-1">{c.label}</p>
                <span className="text-[11.5px] font-semibold text-slate-500">
                  {c.value}
                </span>
                <span className="text-[11px] text-slate-400">{c.pct}</span>
              </div>
            ))}
          </div>

          {/* Scenario Health Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-[13.5px] font-bold text-slate-900 mb-3">
              Scenario Health Distribution
            </h3>
            {[
              { label: "Healthy (≥ 20)", count: "2 scenarios", pct: "50%", colour: "#10B981" },
              { label: "Watch (10–19)",  count: "1 scenario",  pct: "25%", colour: "#F59E0B" },
              { label: "At Risk (< 10)", count: "1 scenario",  pct: "25%", colour: "#EF4444" },
            ].map((h) => (
              <div
                key={h.label}
                className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: h.colour }}
                />
                <p className="text-[12px] text-slate-700 flex-1">{h.label}</p>
                <span className="text-[12px] text-slate-500">{h.count}</span>
                <span
                  style={{ color: h.colour }}
                  className="text-[13px] font-bold"
                >
                  {h.pct}
                </span>
              </div>
            ))}
            <button className="mt-3 w-full text-[12px] font-semibold text-[#2563EB] hover:text-blue-700 text-center">
              How health scores are calculated →
            </button>
          </div>
        </div>
      </div>
    </PlanningPageShell>
  )
}
