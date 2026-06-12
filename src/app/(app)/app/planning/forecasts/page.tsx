"use client"

import React, { useState } from "react"
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from "recharts"
import {
  TrendingUp,
  BarChart2,
  PoundSterling,
  CheckCircle2,
  Star,
  Sparkles,
  Info,
  RefreshCw,
  Download,
  ArrowLeftRight,
  SlidersHorizontal,
} from "lucide-react"
import { PlanningPageShell } from "@/components/planning/PlanningPageShell"
import { KpiCard, RiskPill, ProfileTag } from "@/components/planning/shared"
import { cn } from "@/lib/utils"

/* ─── Demo data ─────────────────────────────────────────────────────────────── */

const MONTHLY_CASHFLOW = [
  { month: "Jan '24", gross: 3800, costs: 2600, financing: 800, net: 400 },
  { month: "Feb '24", gross: 4200, costs: 2700, financing: 800, net: 700 },
  { month: "Mar '24", gross: 4600, costs: 2800, financing: 800, net: 1000 },
  { month: "Apr '24", gross: 5100, costs: 2900, financing: 800, net: 1400 },
  { month: "May '24", gross: 5800, costs: 3000, financing: 800, net: 2000 },
  { month: "Jun '24", gross: 6500, costs: 3100, financing: 800, net: 2600 },
  { month: "Jul '24", gross: 7200, costs: 3100, financing: 800, net: 3300 },
  { month: "Aug '24", gross: 7800, costs: 3200, financing: 800, net: 3800 },
  { month: "Sep '24", gross: 7000, costs: 3100, financing: 800, net: 3100 },
  { month: "Oct '24", gross: 6400, costs: 3000, financing: 800, net: 2600 },
  { month: "Nov '24", gross: 5900, costs: 2900, financing: 800, net: 2200 },
  { month: "Dec '24", gross: 5400, costs: 2800, financing: 800, net: 1800 },
  { month: "Jan '25", gross: 5600, costs: 2900, financing: 800, net: 1900 },
  { month: "Feb '25", gross: 6100, costs: 3000, financing: 800, net: 2300 },
  { month: "Mar '25", gross: 6800, costs: 3100, financing: 800, net: 2900 },
  { month: "Apr '25", gross: 7400, costs: 3200, financing: 800, net: 3400 },
  { month: "May '25", gross: 8200, costs: 3200, financing: 800, net: 4200 },
  { month: "Jun '25", gross: 9100, costs: 3300, financing: 800, net: 5000 },
  { month: "Jul '25", gross: 9800, costs: 3400, financing: 800, net: 5600 },
  { month: "Aug '25", gross: 10200, costs: 3500, financing: 800, net: 5900 },
  { month: "Sep '25", gross: 9400, costs: 3400, financing: 800, net: 5200 },
  { month: "Oct '25", gross: 8600, costs: 3300, financing: 800, net: 4500 },
  { month: "Nov '25", gross: 7800, costs: 3200, financing: 800, net: 3800 },
  { month: "Dec '25", gross: 7200, costs: 3100, financing: 800, net: 3300 },
]

const CUMULATIVE_DATA = MONTHLY_CASHFLOW.map((m, i) => ({
  ...m,
  cumulative:
    MONTHLY_CASHFLOW.slice(0, i + 1).reduce((acc, x) => acc + x.net, 0) - 45000,
}))

const ANNUAL_DATA = [
  { year: "FY 24", income: 210000, opCosts: 110000, financing: 9600, net: 90400 },
  { year: "FY 25", income: 245000, opCosts: 118000, financing: 9600, net: 117400 },
  { year: "FY 26", income: 285000, opCosts: 126000, financing: 9600, net: 149400 },
  { year: "FY 27", income: 315000, opCosts: 134000, financing: 9600, net: 171400 },
]

const PLANS_LIST = [
  { id: "1", name: "12-Room HMO — Nottingham",    profileKey: "hmo",                    status: "active",           riskScore: 28, net: 2100 },
  { id: "2", name: "SA — Manchester Piccadilly",  profileKey: "serviced_accommodation", status: "draft",            riskScore: 42, net: 1620 },
  { id: "3", name: "Holiday Let — Lake District", profileKey: "holiday_let",            status: "active",           riskScore: 31, net: 960  },
  { id: "4", name: "R2R Deal — Birmingham",        profileKey: "rent_to_rent",           status: "offer_sent",       riskScore: 35, net: 840  },
  { id: "5", name: "Student Let — Sheffield",      profileKey: "student_let",            status: "conversion_ready", riskScore: 18, net: 680  },
]

const SENSITIVITY: number[][] = [
  [90,  100, 112, 122, 135],
  [81,  90,  101, 110, 122],
  [72,  80,  100, 110, 121],
  [63,  70,  90,  100, 111],
  [54,  60,  79,  89,  100],
]
const SENSITIVITY_ROWS = ["+10%", "+5%", "Base", "-5%", "-10%"]

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export default function ForecastsPage() {
  const [horizon, setHorizon] = useState<"12" | "24">("24")
  const [chartTab, setChartTab] = useState<"chart" | "table" | "comparison">("chart")
  const [selectedPlans, setSelectedPlans] = useState<string[]>(["1", "2", "3", "4", "5"])

  const displayData = horizon === "12" ? MONTHLY_CASHFLOW.slice(0, 12) : MONTHLY_CASHFLOW
  const cumulativeDisplay =
    horizon === "12" ? CUMULATIVE_DATA.slice(0, 12) : CUMULATIVE_DATA

  const visiblePlans = PLANS_LIST.filter((p) => selectedPlans.includes(p.id))

  return (
    <PlanningPageShell
      title="Forecasts"
      subtitle="Financial projections and cashflow analysis across all selected planning sets."
      actions={
        <>
          <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Compare
          </button>
          <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Sync Scenarios
          </button>
        </>
      }
    >
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KpiCard
          label="Combined Monthly"
          value="£5,720"
          subtitle="peak month (Jun)"
          trend={{ value: "8.4% vs last 24m", positive: true }}
          icon={TrendingUp}
          iconColour="#10B981"
        />
        <KpiCard
          label="Best Net Yield"
          value="134%"
          subtitle="R2R Birmingham"
          trend={{ value: "18.2% vs last 24m", positive: true }}
          icon={BarChart2}
          iconColour="#7C3AED"
        />
        <KpiCard
          label="Total Upfront Cash"
          value="£112,500"
          subtitle="across 5 plans"
          trend={{ value: "4.1% vs last 24m", positive: false }}
          icon={PoundSterling}
          iconColour="#2563EB"
        />
        <KpiCard
          label="Profitable Plans"
          value="5 / 5"
          subtitle="all plans profitable"
          icon={CheckCircle2}
          iconColour="#10B981"
        />
        <KpiCard
          label="Best-Performing Profile"
          value="Serviced Accom."
          subtitle="Avg Net Yield 112%"
          icon={Star}
          iconColour="#F59E0B"
        />
        <KpiCard
          label="24-Month Forecast Value"
          value="£148,800"
          subtitle="total net cashflow"
          trend={{ value: "12.7% vs last 24m", positive: true }}
          icon={TrendingUp}
          iconColour="#7C3AED"
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Selected plans chips */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <span className="text-[12.5px] font-semibold text-slate-500">
            Selected Planning Sets ({visiblePlans.length})
          </span>
          {visiblePlans.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 h-7 px-3 rounded-xl bg-slate-100 border border-slate-200 text-[12px] font-medium text-slate-700"
            >
              <ProfileTag profileKey={p.profileKey} size="sm" />
              <span className="max-w-[120px] truncate">
                {p.name.split("—")[0].trim()}
              </span>
              <button
                onClick={() =>
                  setSelectedPlans((prev) => prev.filter((id) => id !== p.id))
                }
                className="ml-1 text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Horizon toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
          {(["12", "24"] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all",
                horizon === h
                  ? "bg-white shadow-sm text-slate-800"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {h} Months
            </button>
          ))}
        </div>

        {/* Chart / Table / Comparison toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
          {(["chart", "table", "comparison"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setChartTab(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all capitalize",
                chartTab === t
                  ? "bg-white shadow-sm text-slate-800"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main section: 2/3 charts + 1/3 sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* A: Combined Monthly Cashflow */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-bold text-slate-900">
                  Combined Monthly Cashflow
                </h3>
                <p className="text-[12px] text-slate-400">
                  Gross income vs costs vs net — all planning sets
                </p>
              </div>
              <select className="h-8 px-3 rounded-xl border border-slate-200 text-[12.5px] text-slate-600 focus:outline-none bg-white">
                <option>24 Months</option>
                <option>12 Months</option>
              </select>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={displayData}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v) => `£${Number(v).toLocaleString()}`}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E2E8F0",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="gross"  name="Gross Income" fill="#DBEAFE" stackId="a" />
                  <Bar dataKey="costs"  name="Total Costs"  fill="#FEE2E2" stackId="b" />
                  <Line
                    type="monotone"
                    dataKey="net"
                    name="Net Cashflow"
                    stroke="#7C3AED"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-6 mt-3 pt-3 border-t border-slate-100">
              {[
                { colour: "#DBEAFE", label: "Gross Income" },
                { colour: "#FEE2E2", label: "Total Costs" },
                { colour: "#7C3AED", label: "Net Cashflow" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ background: l.colour }}
                  />
                  <span className="text-[11px] text-slate-500">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* B: Cumulative Cashflow & Breakeven */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-bold text-slate-900">
                  Cumulative Cashflow & Breakeven
                </h3>
                <p className="text-[12px] text-slate-400">All planning sets combined</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Breakeven</p>
                <p className="text-[13px] font-bold text-emerald-600">Oct &#39;24</p>
              </div>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={cumulativeDisplay}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v) => `£${Number(v).toLocaleString()}`}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E2E8F0",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    name="Cumulative Net"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fill="url(#cumGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* C: Annual Income vs Expenses + Sensitivity Heatmap */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Annual bar chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-[14px] font-bold text-slate-900 mb-1">
                Annual Income vs Expenses
              </h3>
              <p className="text-[12px] text-slate-400 mb-4">All planning sets combined</p>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ANNUAL_DATA}
                    margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(v) => `£${Number(v).toLocaleString()}`}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #E2E8F0",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="income"   name="Income"    fill="#7C3AED" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="opCosts"  name="Op. Costs" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="financing" name="Financing" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Line
                      type="monotone"
                      dataKey="net"
                      name="Net Income"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#10B981" }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sensitivity heatmap */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-[14px] font-bold text-slate-900 mb-1">
                Net Yield Sensitivity
              </h3>
              <p className="text-[12px] text-slate-400 mb-4">
                Best Plan: R2R Birmingham — occupancy vs rent
              </p>
              <div className="text-[11px]">
                {/* Column headers */}
                <div className="grid grid-cols-6 gap-1 mb-1">
                  <div className="text-slate-400 text-[10px] font-semibold text-right pr-2">
                    Occ↓ Rent→
                  </div>
                  {["-10%", "Base", "+10%", "+20%", "+30%"].map((col) => (
                    <div
                      key={col}
                      className="text-center text-[10px] font-semibold text-slate-500"
                    >
                      {col}
                    </div>
                  ))}
                </div>
                {SENSITIVITY.map((row, ri) => (
                  <div key={ri} className="grid grid-cols-6 gap-1 mb-1">
                    <div className="text-[10px] font-semibold text-slate-500 text-right pr-2 flex items-center justify-end">
                      {SENSITIVITY_ROWS[ri]}
                    </div>
                    {row.map((val, ci) => {
                      const isBase = ri === 2 && ci === 1
                      const colour =
                        val >= 120
                          ? "#10B981"
                          : val >= 100
                          ? "#34D399"
                          : val >= 90
                          ? "#FCD34D"
                          : "#FCA5A5"
                      const textColour = val >= 100 ? "#065F46" : "#7F1D1D"
                      return (
                        <div
                          key={ci}
                          style={{
                            background: isBase ? "#DBEAFE" : colour + "40",
                            border: isBase
                              ? "2px solid #2563EB"
                              : "1px solid transparent",
                            color: isBase ? "#1E3A8A" : textColour,
                          }}
                          className="flex items-center justify-center h-9 rounded-xl text-[12px] font-bold"
                        >
                          {val}%
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Net Yield % relative to base case (100%)
              </p>
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-4">
          {/* Plans by Net/Mo */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-slate-900">Plans by Net / Mo</h3>
              <select className="h-7 px-2 text-[11.5px] rounded-lg border border-slate-200 text-slate-600 focus:outline-none bg-white">
                <option>Sort: High to Low</option>
              </select>
            </div>
            <div className="space-y-2">
              {[...PLANS_LIST]
                .sort((a, b) => b.net - a.net)
                .map((plan, i) => (
                  <div
                    key={plan.id}
                    className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0"
                  >
                    <span className="text-[12px] font-bold text-slate-400 w-4 shrink-0">
                      {i + 1}
                    </span>
                    <ProfileTag profileKey={plan.profileKey} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-slate-800 truncate">
                        {plan.name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-bold text-slate-900">
                        £{plan.net.toLocaleString()}/mo
                      </p>
                      <RiskPill
                        level={
                          plan.riskScore < 30
                            ? "Low"
                            : plan.riskScore < 50
                            ? "Medium"
                            : "High"
                        }
                        size="sm"
                      />
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-3.5 h-3.5 rounded accent-[#7C3AED]"
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* Forecast Assumptions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-[14px] font-bold text-slate-900 mb-3">
              Forecast Assumptions
            </h3>
            <p className="text-[12px] text-slate-400 mb-3">
              All forecasts use current assumptions and templates.
            </p>
            {[
              { label: "Income growth",        value: "2.5% p.a." },
              { label: "Operating cost growth", value: "2.0% p.a." },
              { label: "Discount rate",         value: "8.0%" },
              { label: "Tax rate",              value: "19%" },
            ].map((a) => (
              <div
                key={a.label}
                className="flex items-center gap-2 py-2 border-b border-slate-100 last:border-0"
              >
                <div style={{ color: "#10B981" }}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                </div>
                <p className="text-[12.5px] text-slate-700 flex-1">{a.label}</p>
                <span className="text-[12.5px] font-bold text-slate-800">
                  {a.value}
                </span>
              </div>
            ))}
            <button className="mt-3 w-full h-9 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              View AI Assumptions →
            </button>
          </div>

          {/* AI Insight */}
          <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl border border-violet-200/60 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl bg-[#7C3AED] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-[14px] font-bold text-slate-900">AI Insight</h3>
            </div>
            <p className="text-[12.5px] text-slate-600 mb-3">
              Strong forecast outlook with £148.8k total net cashflow over 24 months.
              R2R Birmingham delivers the highest net yield at 134% with robust downside
              resilience.
            </p>
            <button className="w-full h-9 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors">
              Ask AI a question →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom note */}
      <div className="flex items-center gap-2 mt-6 text-[12px] text-slate-400">
        <div style={{ color: "#94A3B8" }}>
          <Info className="w-3.5 h-3.5 shrink-0" />
        </div>
        All figures are forecasts. Actual results may vary. Last updated: 2 minutes ago
        <button className="ml-2 text-slate-400 hover:text-slate-600 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </PlanningPageShell>
  )
}
