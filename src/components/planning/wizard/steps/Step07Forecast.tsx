"use client"

import React, { useState, useMemo } from "react"
import {
  TrendingUp,
  Clock,
  Target,
  BarChart2,
  Sparkles,
  ChevronDown,
  Info,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react"
import {
  ComposedChart,
  Bar,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import { cn } from "@/lib/utils"

export default function Step07Forecast() {
  const { state, update } = useWizard()

  const [scenario, setScenario] = useState<"best" | "base" | "worst">("base")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showCumulative, setShowCumulative] = useState(false)

  // ── Base figures ────────────────────────────────────────────────────────────
  const scenarioMultiplier = scenario === "best" ? 1.1 : scenario === "worst" ? 0.85 : 1.0

  const grossMonthly =
    (state.rooms.reduce((s, r) => s + Math.round(r.avgRentPcm * (1 - r.voidPct / 100)), 0) ||
      state.singleMonthlyRent ||
      12000) * scenarioMultiplier

  const totalExpenses =
    (state.expenses.reduce((s, e) => s + e.monthlyAmount, 0) +
      state.bills.reduce((s, b) => s + b.monthlyAmount, 0)) *
    (scenario === "worst" ? 1.15 : scenario === "best" ? 0.97 : 1.0)

  const debtService =
    state.forecastLtvPct > 0
      ? Math.round(
          state.upfrontCosts.reduce((s, c) => s + c.amount, 0) *
            (state.forecastLtvPct / 100) *
            (state.forecastInterestRatePct / 100) /
            12,
        )
      : 0

  const netMonthly = Math.round(grossMonthly - totalExpenses - debtService)
  const annualCashflow = netMonthly * 12
  const totalUpfront = state.upfrontCosts.reduce((s, c) => s + c.amount, 0)
  const grossYield = totalUpfront > 0 ? (grossMonthly * 12) / totalUpfront * 100 : 0
  const netYield = totalUpfront > 0 ? (netMonthly * 12) / totalUpfront * 100 : 0
  const paybackMonths = netMonthly > 0 && totalUpfront > 0 ? totalUpfront / netMonthly : 0

  // ── 36-month chart data ─────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const raw = Array.from({ length: 36 }, (_, i) => {
      const month = i + 1
      const growthFactor = Math.pow(1 + state.forecastRentGrowthPct / 100 / 12, month)
      const costFactor = Math.pow(1 + state.forecastOpCostInflationPct / 100 / 12, month)
      const income = Math.round(grossMonthly * growthFactor)
      const opCosts = Math.round(totalExpenses * costFactor)
      const net = income - opCosts - debtService
      return { label: `M${month}`, income, opCosts, financing: debtService, net, cumulative: 0 }
    })
    return raw.map((d, i, arr) => ({
      ...d,
      cumulative: arr.slice(0, i + 1).reduce((s, x) => s + x.net, 0) - totalUpfront,
    }))
  }, [grossMonthly, totalExpenses, debtService, state.forecastRentGrowthPct, state.forecastOpCostInflationPct, totalUpfront])

  const breakevenMonthIdx = chartData.findIndex(d => d.cumulative >= 0)
  const breakevenMonth = breakevenMonthIdx >= 0 ? breakevenMonthIdx + 1 : paybackMonths

  // ── Year data for yield chart ────────────────────────────────────────────────
  const yearData = [1, 2, 3].map(y => ({
    year: `Year ${y}`,
    yield: netYield * (1 + (y - 1) * state.forecastRentGrowthPct / 100 * 1.5),
  }))

  // ── KPI strip config ─────────────────────────────────────────────────────────
  const targetNet = state.targetMonthlyCashflow > 0 ? state.targetMonthlyCashflow : 0
  const netDelta = netMonthly - targetNet
  const netDeltaPct = targetNet > 0 ? Math.abs((netDelta / targetNet) * 100).toFixed(1) : "—"

  const kpis = [
    {
      label: "Target Net / mo",
      value: `£${targetNet.toLocaleString()}`,
      sub: "After all costs & financing",
      colour: "#7C3AED",
      icon: Target,
    },
    {
      label: "Forecast Net / mo",
      value: `£${netMonthly.toLocaleString()}`,
      sub: targetNet > 0 ? `${netDelta >= 0 ? "+" : "-"}£${Math.abs(netDelta).toLocaleString()} (${netDeltaPct}%)` : "Set a target cashflow in Step 2",
      colour: netMonthly >= targetNet ? "#10B981" : "#EF4444",
      icon: TrendingUp,
    },
    {
      label: "Annual Cashflow",
      value: `£${annualCashflow.toLocaleString()}`,
      sub: "Year 1 (after debt service)",
      colour: "#2563EB",
      icon: BarChart2,
    },
    {
      label: "Payback (Months)",
      value: paybackMonths.toFixed(1),
      sub: `Total upfront £${(totalUpfront / 1000).toFixed(0)}k`,
      colour: "#F59E0B",
      icon: Clock,
    },
    {
      label: "Gross Yield (Stabilised)",
      value: `${grossYield.toFixed(1)}%`,
      sub: "Year 3",
      colour: "#EF4444",
      icon: TrendingUp,
    },
    {
      label: "Net Yield (Stabilised)",
      value: `${netYield.toFixed(1)}%`,
      sub: "Year 3",
      colour: "#7C3AED",
      icon: Sparkles,
    },
  ]

  // ── Assumption slider config ─────────────────────────────────────────────────
  const sliders = [
    {
      label: "Occupancy (Stabilised)",
      key: "forecastOccupancyPct" as const,
      unit: "%",
      min: 50,
      max: 100,
      step: 0.5,
      sub: "Monthly",
    },
    {
      label: "Rent Growth",
      key: "forecastRentGrowthPct" as const,
      unit: "%",
      min: 0,
      max: 8,
      step: 0.5,
      sub: "Per Annum",
    },
    {
      label: "Operating Cost Inflation",
      key: "forecastOpCostInflationPct" as const,
      unit: "%",
      min: 0,
      max: 6,
      step: 0.5,
      sub: "Per Annum",
    },
    {
      label: "Void / Turnover Loss",
      key: "forecastVoidTurnoverLossPct" as const,
      unit: "%",
      min: 0,
      max: 8,
      step: 0.5,
      sub: "Of Gross Rent",
    },
    {
      label: "Financing",
      key: "forecastLtvPct" as const,
      unit: "% LTV",
      min: 0,
      max: 90,
      step: 5,
      sub: `${state.forecastInterestRatePct}% Interest Rate`,
    },
    {
      label: "Loan Term",
      key: "forecastLoanTermYears" as const,
      unit: "Years",
      min: 5,
      max: 40,
      step: 1,
      sub: "Amortising",
    },
    {
      label: "Capex / Refurb Timing",
      key: "forecastCapexAmount" as const,
      unit: "k",
      min: 0,
      max: 250,
      step: 5,
      sub: "Month: 0–6",
      isCapex: true,
    },
    {
      label: "Exit / Hold Period",
      key: "forecastExitHoldMonths" as const,
      unit: "Months",
      min: 12,
      max: 60,
      step: 1,
      sub: "Hold Period",
    },
  ]

  return (
    <div className="flex flex-col">
      {/* ── KPI Strip ──────────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-5 border-b border-slate-100">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map(kpi => {
            const Icon = kpi.icon
            return (
              <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ background: kpi.colour + "18" }}
                  >
                    <div style={{ color: kpi.colour }}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500">{kpi.label}</p>
                </div>
                <p className="text-[20px] font-bold" style={{ color: kpi.colour }}>
                  {kpi.value}
                </p>
                {kpi.sub && <p className="text-[10.5px] text-slate-400 mt-0.5">{kpi.sub}</p>}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Scenario Tabs + View Controls ──────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-slate-100 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {(["best", "base", "worst"] as const).map(s => (
            <button
              key={s}
              onClick={() => setScenario(s)}
              className={cn(
                "h-9 px-5 rounded-xl text-[13px] font-semibold transition-all capitalize border",
                scenario === s
                  ? s === "best"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : s === "base"
                    ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                    : "bg-red-500 text-white border-red-500"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300",
              )}
            >
              {s === "best" ? "Best Case" : s === "base" ? "Base Case" : "Worst Case"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setShowCumulative(!showCumulative)}
              className={cn(
                "w-9 h-5 rounded-full transition-all flex items-center px-0.5",
                showCumulative ? "bg-[#7C3AED]" : "bg-slate-200",
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full bg-white shadow-sm transition-all",
                  showCumulative ? "translate-x-4" : "translate-x-0",
                )}
              />
            </div>
            <span className="text-[12.5px] text-slate-600">Show cumulative</span>
          </label>
          <select aria-label="Chart time period" className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]">
            <option>Monthly view</option>
            <option>Quarterly view</option>
            <option>Annual view</option>
          </select>
        </div>
      </div>

      {/* ── Main Charts ─────────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6 border-b border-slate-100">
        {/* Chart A: Income vs Cost vs Net */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-[14px] font-bold text-slate-900 mb-1">
            Income vs Cost vs Net (Monthly)
          </h3>
          <div className="flex items-center gap-4 mb-3">
            {[
              { colour: "#10B981", label: "Income" },
              { colour: "#F59E0B", label: "Operating Costs" },
              { colour: "#7C3AED", label: "Net Cashflow" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ background: l.colour }} />
                <span className="text-[11px] text-slate-500">{l.label}</span>
              </div>
            ))}
          </div>
          <div className="h-[240px]" role="img" aria-label="5-year forecast chart of projected income, costs and net cashflow">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  interval={5}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `£${(Number(v) / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v) => `£${Number(v).toLocaleString()}`}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #E2E8F0",
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="income" name="Income" fill="#10B98128" stackId="a" />
                <Bar dataKey="opCosts" name="Operating Costs" fill="#F59E0B28" stackId="b" />
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
          <div className="flex justify-around mt-2 text-[10px] text-slate-400">
            <span>Year 1</span>
            <span>Year 2</span>
            <span>Year 3</span>
          </div>
        </div>

        {/* Chart B: Cumulative Cashflow */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[14px] font-bold text-slate-900">Cumulative Cashflow</h3>
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
              <Clock className="w-3 h-3 text-amber-600" />
              <span className="text-[11.5px] font-bold text-amber-700">
                Breakeven Month {Number(breakevenMonth).toFixed(1)}
              </span>
            </div>
          </div>
          <div className="h-[240px]" role="img" aria-label="Cumulative cashflow projection area chart over the forecast period">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="cumGradPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  interval={5}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `£${(Number(v) / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v) => `£${Number(v).toLocaleString()}`}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #E2E8F0",
                    fontSize: 11,
                  }}
                />
                <ReferenceLine y={0} stroke="#E2E8F0" strokeWidth={2} strokeDasharray="4 4" />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  name="Cumulative Net"
                  stroke="#7C3AED"
                  fill="url(#cumGradPos)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {showCumulative && (
            <p className="text-[10.5px] text-slate-400 mt-2 text-center">
              Cumulative net cashflow shown above
            </p>
          )}
        </div>
      </div>

      {/* ── Breakeven + Yield + Occupancy Sensitivity ─────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 border-b border-slate-100">
        {/* Breakeven Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-[13.5px] font-bold text-slate-900 mb-1">Breakeven Timeline</h3>
          <p className="text-[28px] font-bold text-slate-900">
            {Number(breakevenMonth).toFixed(1)}{" "}
            <span className="text-[16px] font-semibold text-slate-400">months</span>
          </p>
          <p className="text-[12px] text-slate-400 mb-4">Cumulative turns positive</p>
          <div className="relative">
            <div className="h-2 bg-slate-200 rounded-full">
              <div
                className="h-full bg-[#7C3AED] rounded-full"
                style={{ width: `${Math.min((Number(breakevenMonth) / 36) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>M0</span>
              <span>M12</span>
              <span>M24</span>
              <span>M36</span>
            </div>
            <div
              className="absolute top-0 w-4 h-4 -mt-1 rounded-full bg-[#7C3AED] border-2 border-white shadow"
              style={{
                left: `calc(${Math.min((Number(breakevenMonth) / 36) * 100, 100)}% - 8px)`,
              }}
            />
          </div>
        </div>

        {/* Net Yield Projection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-[13.5px] font-bold text-slate-900 mb-1">
            Net Yield Projection (Stabilised)
          </h3>
          <p className="text-[28px] font-bold text-[#7C3AED]">{netYield.toFixed(1)}%</p>
          <p className="text-[12px] text-slate-400 mb-3">Year 3 Net Yield</p>
          <div className="flex items-end gap-4 h-[80px]">
            {yearData.map((y, i) => (
              <div key={y.year} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[11px] font-bold text-[#7C3AED]">
                  {y.yield.toFixed(1)}%
                </span>
                <div
                  className="w-full rounded-t-lg"
                  style={{
                    height: `${Math.max((y.yield / 10) * 60, 20)}px`,
                    background: `#7C3AED${["40", "70", "FF"][i]}`,
                  }}
                />
                <span className="text-[10px] text-slate-400">{y.year}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Occupancy Sensitivity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13.5px] font-bold text-slate-900">
              Occupancy Sensitivity (Net / mo)
            </h3>
            <Info className="w-3.5 h-3.5 text-slate-300" />
          </div>
          {[
            { label: "90% Occupancy", pct: 90, colour: "#EF4444" },
            { label: "Base (95%)", pct: 95, colour: "#7C3AED" },
            { label: "100% Occupancy", pct: 100, colour: "#10B981" },
          ].map(occ => {
            const adjGross = grossMonthly * (occ.pct / (state.forecastOccupancyPct || 95))
            const adjNet = Math.round(adjGross - totalExpenses - debtService)
            const delta = adjNet - netMonthly
            return (
              <div
                key={occ.label}
                className={cn(
                  "flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0",
                  occ.pct === 95 ? "bg-violet-50/50 -mx-2 px-2 rounded-xl" : "",
                )}
              >
                <span className="text-[12.5px] font-semibold text-slate-700">{occ.label}</span>
                <div className="text-right">
                  <p className="text-[14px] font-bold text-slate-900">
                    £{adjNet.toLocaleString()}
                  </p>
                  <p
                    className={cn(
                      "text-[11px] font-semibold",
                      delta >= 0 ? "text-emerald-600" : "text-red-600",
                    )}
                  >
                    {delta >= 0 ? "+" : ""}
                    {netMonthly !== 0
                      ? ((delta / Math.abs(netMonthly)) * 100).toFixed(1)
                      : "0.0"}
                    %
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Forecast Assumptions Sliders ───────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-bold text-slate-900">Forecast Assumptions</h2>
          <p className="text-[12.5px] text-slate-400">Edit the key drivers of your forecast</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sliders.map(a => {
            const rawValue = a.isCapex
              ? state[a.key as "forecastCapexAmount"] / 1000
              : (state[a.key] as number)
            const displayValue = rawValue
            return (
              <div key={a.label} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <SlidersHorizontal className="w-4 h-4 text-[#7C3AED]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11.5px] font-semibold text-slate-700 leading-tight">
                      {a.label}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[16px] font-bold text-slate-900">
                        {displayValue}
                      </span>
                      <span className="text-[11px] text-slate-400">{a.unit}</span>
                    </div>
                    <p className="text-[10.5px] text-slate-400">{a.sub}</p>
                  </div>
                </div>
                <input
                  type="range"
                  min={a.min}
                  max={a.max}
                  step={a.step}
                  value={displayValue}
                  onChange={e => {
                    const raw = Number(e.target.value)
                    if (a.isCapex) {
                      update({ forecastCapexAmount: raw * 1000 })
                    } else {
                      update({ [a.key]: raw })
                    }
                  }}
                  className="w-full h-1.5 rounded-full appearance-none bg-slate-200 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#7C3AED]"
                  style={{ accentColor: "var(--accent)" }}
                />
                <div className="flex justify-between text-[9.5px] text-slate-400 mt-1">
                  <span>
                    {a.min}
                    {a.unit.includes("%") ? "%" : ""}
                  </span>
                  <span>
                    {a.max}
                    {a.unit.includes("%") ? "%" : ""}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mt-4 flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ChevronDown
            className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")}
          />
          {showAdvanced ? "Hide" : "Show"} advanced assumptions
        </button>

        {showAdvanced && (
          <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                {
                  label: "Interest Rate",
                  key: "forecastInterestRatePct" as const,
                  unit: "%",
                  min: 1,
                  max: 12,
                  step: 0.25,
                  sub: "Annual",
                },
              ].map(a => (
                <div key={a.label} className="bg-white rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                      <SlidersHorizontal className="w-4 h-4 text-[#7C3AED]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11.5px] font-semibold text-slate-700 leading-tight">
                        {a.label}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[16px] font-bold text-slate-900">
                          {state[a.key]}
                        </span>
                        <span className="text-[11px] text-slate-400">{a.unit}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-400">{a.sub}</p>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={a.min}
                    max={a.max}
                    step={a.step}
                    value={state[a.key]}
                    onChange={e => update({ [a.key]: Number(e.target.value) })}
                    className="w-full h-1.5 rounded-full appearance-none bg-slate-200 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#7C3AED]"
                    style={{ accentColor: "var(--accent)" }}
                  />
                  <div className="flex justify-between text-[9.5px] text-slate-400 mt-1">
                    <span>{a.min}%</span>
                    <span>{a.max}%</span>
                  </div>
                </div>
              ))}
              <div className="col-span-full p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-700">
                  Advanced assumptions affect debt service calculations. Changes are reflected
                  instantly across all forecast charts.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
