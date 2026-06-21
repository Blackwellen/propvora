"use client"

import React, { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  Download,
  X,
  Info,
  Shield,
} from "lucide-react"
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import type { RiskFactor } from "@/components/planning/wizard/WizardContext"
import { cn } from "@/lib/utils"

// ── Derive scenario comparison values from wizard state ───────────────────────
function deriveScenarios(state: ReturnType<typeof useWizard>["state"]) {
  const grossMonthly =
    state.profileKey === "hmo" || state.profileKey === "rent_to_rent" || state.profileKey === "student_let"
      ? state.rooms.reduce((s, r) => s + r.avgRentPcm, 0)
      : state.profileKey === "serviced_accommodation" || state.profileKey === "holiday_let"
      ? Math.round((state.adr || 0) * 30.5 * ((state.occupancyPct || 0) / 100))
      : state.singleMonthlyRent || 0

  const opCosts =
    state.expenses.reduce((s, e) => s + e.monthlyAmount, 0) +
    state.bills.reduce((s, b) => s + b.monthlyAmount, 0)

  const totalUpfront = state.upfrontCosts.reduce((s, c) => s + c.amount, 0)

  const debtService =
    state.forecastLtvPct > 0
      ? Math.round(totalUpfront * (state.forecastLtvPct / 100) * (state.forecastInterestRatePct / 100) / 12)
      : 0

  function calcScenario(incomeMultiplier: number, costMultiplier: number) {
    const income = Math.round(grossMonthly * incomeMultiplier * 12)
    const costs = Math.round(opCosts * costMultiplier * 12)
    const noi = income - costs
    const annualDebt = debtService * 12
    const dscr = annualDebt > 0 ? noi / annualDebt : 0
    const cashYield = totalUpfront > 0 ? ((noi - annualDebt) / totalUpfront) * 100 : 0
    const occ = state.occupancyPct * incomeMultiplier
    return { noi, dscr, cashYield, occ: Math.min(occ, 100) }
  }

  return {
    base: calcScenario(1.0, 1.0),
    downside: calcScenario(0.85, 1.15),
    upside: calcScenario(1.1, 0.97),
    hasData: grossMonthly > 0 || totalUpfront > 0,
  }
}

export default function Step08RiskAIReview() {
  const { state } = useWizard()
  const [riskTab, setRiskTab] = useState("Risk Radar")
  const scenarios = deriveScenarios(state)

  const radarData = state.riskFactors.map((rf: RiskFactor) => ({
    subject: rf.label
      .replace(" Risk", "")
      .replace(" Complexity", "")
      .replace(" Volatility", ""),
    value: rf.score,
    benchmark: 72,
  }))

  return (
    <div className="flex flex-col">
      {/* ── Top Header ──────────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-5 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 mb-1">Risk &amp; AI Review</h1>
            <p className="text-[13.5px] text-slate-500">
              Executive quality-control and decision support before you proceed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              Print
            </button>
            <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* ── Three-Column Layout (stacks on mobile/tablet) ───────────────────────── */}
      <div className="flex flex-col xl:flex-row flex-1 min-h-0">
        {/* LEFT: Risk Categories (240px) */}
        <div className="w-full xl:w-[240px] shrink-0 border-b xl:border-b-0 xl:border-r border-slate-100 overflow-y-auto">
          <div className="p-5">
            <h2 className="text-[14px] font-bold text-slate-900 mb-4">Risk Categories</h2>
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 text-[10px] font-semibold text-slate-400 uppercase mb-3">
              <span>Category</span>
              <span>Score</span>
              <span>Alert</span>
              <span>Trend</span>
            </div>

            {state.riskFactors.map((rf: RiskFactor) => {
              const alertColour =
                rf.alertLevel === "Low"
                  ? "#10B981"
                  : rf.alertLevel === "Medium"
                  ? "#F59E0B"
                  : "#EF4444"
              const TrendIcon =
                rf.trend === "improving" ? ArrowUp : rf.trend === "worsening" ? ArrowDown : Minus
              const trendColour =
                rf.trend === "improving"
                  ? "#10B981"
                  : rf.trend === "worsening"
                  ? "#EF4444"
                  : "#94A3B8"
              return (
                <div
                  key={rf.id}
                  className="flex flex-col py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center">
                    <div>
                      <p className="text-[12.5px] font-bold text-slate-800">{rf.label}</p>
                      <p className="text-[10.5px] text-slate-400 leading-tight mt-0.5">
                        {rf.description}
                      </p>
                    </div>
                    <span
                      style={{
                        background: alertColour + "20",
                        color: alertColour,
                        borderColor: alertColour + "40",
                      }}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap"
                    >
                      {rf.score}/{rf.maxScore}
                    </span>
                    <span
                      style={{ color: alertColour }}
                      className="text-[11px] font-semibold whitespace-nowrap"
                    >
                      {rf.alertLevel}
                    </span>
                    <div style={{ color: trendColour }}>
                      <TrendIcon className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Risk Scoring Guide */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[12px] font-bold text-slate-700 mb-3">Risk Scoring Guide</p>
              {[
                { range: "80 – 100", label: "Low Risk", colour: "#10B981", bg: "#ECFDF5" },
                { range: "60 – 79", label: "Medium Risk", colour: "#F59E0B", bg: "#FFFBEB" },
                { range: "0 – 59", label: "High Risk", colour: "#EF4444", bg: "#FEF2F2" },
              ].map(g => (
                <div key={g.label} className="flex items-center gap-3 py-1.5">
                  <span
                    style={{ background: g.bg, color: g.colour }}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  >
                    {g.range}
                  </span>
                  <span className="text-[12px] text-slate-600">{g.label}</span>
                </div>
              ))}
              <p className="text-[10.5px] text-slate-400 mt-2">
                Scores reflect inherent risk before mitigations.
              </p>
            </div>
          </div>
        </div>

        {/* CENTER: Charts + Tables */}
        <div className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 border-b xl:border-b-0 xl:border-r border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-slate-900">Risk Overview</h2>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {["Risk Radar", "Risk Matrix", "Heat Map"].map(t => (
                <button
                  key={t}
                  onClick={() => setRiskTab(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all",
                    riskTab === t
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-400 hover:text-slate-600",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Chart panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5">
            {riskTab === "Risk Radar" && (
              <>
                <div
                  className="h-[260px]"
                  role="img"
                  aria-label="Risk radar chart comparing your risk score against the industry benchmark across all risk categories"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#E2E8F0" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 10, fill: "#64748B" }}
                      />
                      <Radar
                        name="Your Risk Score"
                        dataKey="value"
                        stroke="#7C3AED"
                        fill="#7C3AED"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                      <Radar
                        name="Industry Benchmark"
                        dataKey="benchmark"
                        stroke="#CBD5E1"
                        fill="transparent"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                      />
                      <Tooltip
                        formatter={(v) => `${Number(v)}/100`}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #E2E8F0",
                          fontSize: 11,
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-6 justify-center text-[11px] mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 bg-[#7C3AED] rounded inline-block" />
                    Your Risk Score
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-0 border-t-2 border-dashed border-slate-300 inline-block" />
                    Industry Benchmark
                  </div>
                </div>
              </>
            )}
            {riskTab === "Risk Matrix" && (
              <div className="h-[260px] flex items-center justify-center">
                <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
                  {state.riskFactors.map((rf: RiskFactor) => {
                    const bg =
                      rf.alertLevel === "Low"
                        ? "#ECFDF5"
                        : rf.alertLevel === "Medium"
                        ? "#FFFBEB"
                        : "#FEF2F2"
                    const col =
                      rf.alertLevel === "Low"
                        ? "#10B981"
                        : rf.alertLevel === "Medium"
                        ? "#F59E0B"
                        : "#EF4444"
                    return (
                      <div
                        key={rf.id}
                        className="rounded-xl p-3 text-center"
                        style={{ background: bg }}
                      >
                        <p className="text-[10px] font-bold mb-1" style={{ color: col }}>
                          {rf.label.replace(" Risk", "").replace(" Complexity", "")}
                        </p>
                        <p className="text-[22px] font-bold text-slate-900">{rf.score}</p>
                        <p className="text-[10px] font-semibold" style={{ color: col }}>
                          {rf.alertLevel}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {riskTab === "Heat Map" && (
              <div className="h-[260px] flex items-end justify-center gap-3">
                {state.riskFactors.map((rf: RiskFactor) => {
                  const opacity = rf.score / 100
                  return (
                    <div key={rf.id} className="flex flex-col items-center gap-2 flex-1">
                      <span className="text-[10px] font-bold text-[#7C3AED]">{rf.score}</span>
                      <div
                        className="w-full rounded-t-xl transition-all"
                        style={{
                          height: `${Math.max(rf.score * 2, 30)}px`,
                          background: `rgba(124,58,237,${opacity})`,
                        }}
                      />
                      <p
                        className="text-center text-slate-500 leading-tight"
                        style={{ fontSize: 9 }}
                      >
                        {rf.label.replace(" Risk", "").replace(" Complexity", "")}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Scenario Comparison Table */}
          <div className="bg-white rounded-2xl border border-slate-200 mb-5 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <h3 className="text-[14px] font-bold text-slate-900">Scenario Comparison</h3>
              <Info className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Scenario", "NOI", "DSCR", "Cash Yield", "IRR ¹", "Occupancy", "Risk Score"].map(
                      h => (
                        <th
                          key={h}
                          className="text-left text-[10.5px] font-semibold text-slate-400 uppercase px-4 py-3 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(scenarios.hasData ? [
                    {
                      label: "Base Case",
                      sub: "Current assumptions",
                      noi: `£${Math.round(scenarios.base.noi).toLocaleString()}`,
                      dscr: scenarios.base.dscr > 0 ? `${scenarios.base.dscr.toFixed(2)}×` : "N/A",
                      cashYield: `${scenarios.base.cashYield.toFixed(1)}%`,
                      irr: "—",
                      occ: `${scenarios.base.occ.toFixed(0)}%`,
                      score: Math.min(100, Math.max(0, Math.round(60 - scenarios.base.cashYield * 2))),
                      colour: "#2563EB",
                    },
                    {
                      label: "Downside Case",
                      sub: "–15% income / +15% costs",
                      noi: `£${Math.round(scenarios.downside.noi).toLocaleString()}`,
                      dscr: scenarios.downside.dscr > 0 ? `${scenarios.downside.dscr.toFixed(2)}×` : "N/A",
                      cashYield: `${scenarios.downside.cashYield.toFixed(1)}%`,
                      irr: "—",
                      occ: `${scenarios.downside.occ.toFixed(0)}%`,
                      score: Math.min(100, Math.max(0, Math.round(75 - scenarios.downside.cashYield * 2))),
                      colour: "#EF4444",
                    },
                    {
                      label: "Upside Case",
                      sub: "+10% income / –3% costs",
                      noi: `£${Math.round(scenarios.upside.noi).toLocaleString()}`,
                      dscr: scenarios.upside.dscr > 0 ? `${scenarios.upside.dscr.toFixed(2)}×` : "N/A",
                      cashYield: `${scenarios.upside.cashYield.toFixed(1)}%`,
                      irr: "—",
                      occ: `${scenarios.upside.occ.toFixed(0)}%`,
                      score: Math.min(100, Math.max(0, Math.round(45 - scenarios.upside.cashYield * 2))),
                      colour: "#10B981",
                    },
                  ] : [
                    { label: "Base Case", sub: "Add income/costs in Steps 3–5 to see projections", noi: "—", dscr: "—", cashYield: "—", irr: "—", occ: "—", score: 0, colour: "#94A3B8" },
                    { label: "Downside Case", sub: "–15% income / +15% costs", noi: "—", dscr: "—", cashYield: "—", irr: "—", occ: "—", score: 0, colour: "#94A3B8" },
                    { label: "Upside Case", sub: "+10% income / –3% costs", noi: "—", dscr: "—", cashYield: "—", irr: "—", occ: "—", score: 0, colour: "#94A3B8" },
                  ]).map(row => (
                    <tr
                      key={row.label}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: row.colour }}
                          />
                          <div>
                            <p className="text-[12.5px] font-bold text-slate-800">{row.label}</p>
                            <p className="text-[10.5px] text-slate-400">{row.sub}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12.5px] font-semibold text-slate-700 whitespace-nowrap">
                        {row.noi}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] font-semibold text-slate-700">
                        {row.dscr}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] font-semibold text-slate-700">
                        {row.cashYield}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] font-semibold text-slate-400" title="IRR requires a full DCF engine — available in V2">
                        N/A
                      </td>
                      <td className="px-4 py-3 text-[12.5px] font-semibold text-slate-700">
                        {row.occ}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          style={{
                            background:
                              row.score >= 70
                                ? "#ECFDF5"
                                : row.score >= 50
                                ? "#FFFBEB"
                                : "#FEF2F2",
                            color:
                              row.score >= 70
                                ? "#10B981"
                                : row.score >= 50
                                ? "#F59E0B"
                                : "#EF4444",
                          }}
                          className="text-[12px] font-bold px-2.5 py-1 rounded-full"
                        >
                          {row.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-2.5 text-[10.5px] text-slate-400 border-t border-slate-50">
              ¹ IRR requires a full DCF cash-flow model. It will be calculated automatically in V2 once multi-year projections are enabled.
            </p>
          </div>

          {/* Unresolved Issues */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-slate-900">Unresolved Issues</h3>
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-[11px] font-bold flex items-center justify-center">
                  4
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Issue", "Impact", "Related To"].map(h => (
                      <th
                        key={h}
                        className="text-left text-[10.5px] font-semibold text-slate-400 uppercase px-4 py-3"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      issue:
                        "Occupancy sensitivity above 15% could stress DSCR below 1.10×",
                      impact: "High",
                      related: "Income, Financing",
                      colour: "#EF4444",
                    },
                    {
                      issue:
                        "Compliance documentation for HMO license not yet verified",
                      impact: "High",
                      related: "Compliance",
                      colour: "#EF4444",
                    },
                    {
                      issue: "Lease renewal terms include CPI-linked increases",
                      impact: "Medium",
                      related: "Landlord Negotiation",
                      colour: "#F59E0B",
                    },
                    {
                      issue: "Capex contingency below recommended 7%",
                      impact: "Medium",
                      related: "Upfront, Expenses",
                      colour: "#F59E0B",
                    },
                  ].map(issue => (
                    <tr key={issue.issue} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                            style={{ background: issue.colour }}
                          />
                          <p className="text-[12.5px] text-slate-700">{issue.issue}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          style={{
                            background: issue.colour + "20",
                            color: issue.colour,
                          }}
                          className="text-[11.5px] font-bold px-2 py-0.5 rounded-full"
                        >
                          {issue.impact}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-slate-500 whitespace-nowrap">
                        {issue.related}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-100">
              <button className="text-[12.5px] font-semibold text-[#7C3AED] hover:text-violet-700">
                View all issues →
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: AI Review Summary (260px) */}
        <div className="w-full xl:w-[260px] shrink-0 overflow-y-auto">
          <div className="p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-bold text-slate-900">AI Review Summary</p>
              <span className="text-[10px] font-bold bg-[#7C3AED] text-white px-1.5 py-0.5 rounded-full">
                Beta
              </span>
            </div>
            <p className="text-[11.5px] text-slate-400 -mt-2">
              AI-powered quality check and strategic guidance.
            </p>

            {/* Three scores */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {(
                [
                  {
                    label: "Opportunity Rating",
                    value: state.aiOpportunityRating as number | null,
                    valueStr: null as string | null,
                    sub: "Good Opportunity",
                    colour: "#10B981",
                  },
                  {
                    label: "Confidence Score",
                    value: state.aiConfidenceScore as number | null,
                    valueStr: null as string | null,
                    sub: "Moderate Confidence",
                    colour: "#F59E0B",
                  },
                  {
                    label: "Risk Adj. Return",
                    value: null as number | null,
                    valueStr: `${state.aiRiskAdjustedReturn}%` as string | null,
                    sub: "Attractive",
                    colour: "#7C3AED",
                  },
                ] as Array<{
                  label: string
                  value: number | null
                  valueStr: string | null
                  sub: string
                  colour: string
                }>
              ).map(s => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-2.5">
                  <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1 leading-tight">
                    {s.label}
                  </p>
                  {s.value !== null ? (
                    <p className="text-[18px] font-bold" style={{ color: s.colour }}>
                      {s.value}
                      <span className="text-[11px]">/100</span>
                    </p>
                  ) : (
                    <p className="text-[18px] font-bold" style={{ color: s.colour }}>
                      {s.valueStr}
                    </p>
                  )}
                  <p className="text-[10px] font-semibold" style={{ color: s.colour }}>
                    {s.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* Strengths */}
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <p className="text-[13px] font-bold text-emerald-900">Strengths</p>
              </div>
              {state.aiStrengths.map((s: string, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-2 py-1.5 border-b border-emerald-100 last:border-0"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[11.5px] text-emerald-800">{s}</p>
                </div>
              ))}
            </div>

            {/* Weaknesses */}
            <div className="bg-red-50 rounded-2xl border border-red-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <X className="w-4 h-4 text-red-600" />
                <p className="text-[13px] font-bold text-red-900">Weaknesses</p>
              </div>
              {state.aiWeaknesses.map((w: string, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-2 py-1.5 border-b border-red-100 last:border-0"
                >
                  <X className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11.5px] text-red-800">{w}</p>
                </div>
              ))}
            </div>

            {/* Assumptions Needing Review */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <p className="text-[13px] font-bold text-amber-900">Assumptions Needing Review</p>
              </div>
              {state.aiAssumptionsToReview.map((a: string, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-2 py-1.5 border-b border-amber-100 last:border-0"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11.5px] text-amber-800">{a}</p>
                </div>
              ))}
            </div>

            {/* Recommended Next Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-lg bg-[#7C3AED] flex items-center justify-center shrink-0">
                  <ArrowRight className="w-3 h-3 text-white" />
                </div>
                <p className="text-[13px] font-bold text-slate-900">Recommended Next Actions</p>
              </div>
              {state.aiNextActions.map((a: string, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-2 py-1.5 border-b border-slate-100 last:border-0"
                >
                  <ArrowRight className="w-3 h-3 text-[#7C3AED] shrink-0 mt-0.5" />
                  <p className="text-[11.5px] text-slate-700">{a}</p>
                </div>
              ))}
            </div>

            {/* AI Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-[13px] font-bold text-slate-900 mb-3">AI Actions</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Improve Profitability", colour: "#2563EB" },
                  { label: "Tighten Assumptions", colour: "#7C3AED" },
                  { label: "Draft Mitigation Plan", colour: "#10B981" },
                  { label: "Explain Risk Score", colour: "#F59E0B" },
                ].map(a => (
                  <button
                    key={a.label}
                    style={{
                      background: a.colour + "12",
                      borderColor: a.colour + "30",
                      color: a.colour,
                    }}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl border text-[11.5px] font-bold hover:opacity-80 transition-opacity text-center"
                  >
                    <Sparkles className="w-4 h-4" />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Final Readiness */}
            <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl border border-violet-200/60 p-4">
              <p className="text-[13px] font-bold text-slate-900 mb-3">Final Readiness</p>
              <div className="flex items-center gap-4 mb-3">
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="3.5"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="3.5"
                      strokeDasharray="72 28"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[16px] font-bold text-slate-900">72</span>
                    <span className="text-[9px] text-slate-400">/100</span>
                  </div>
                </div>
                <div>
                  <p className="text-[15px] font-bold text-amber-600">Watch</p>
                  <p className="text-[11px] text-slate-500">
                    Proceed with mitigations and assumption validation.
                  </p>
                </div>
              </div>
              {[
                { label: "Go (80–100)", colour: "#10B981" },
                { label: "Watch (50–79)", colour: "#F59E0B" },
                { label: "Hold (0–59)", colour: "#EF4444" },
              ].map(g => (
                <div key={g.label} className="flex items-center gap-2 py-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: g.colour }}
                  />
                  <span className="text-[11.5px] text-slate-600">{g.label}</span>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-violet-100 text-[10.5px] text-slate-400">
                <p className="font-bold text-slate-600 mb-1">Audit Note</p>
                <p>
                  Generated:{" "}
                  {new Date().toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p>
                  All scores are based on current data, industry benchmarks and input assumptions.
                </p>
                <button className="text-[#7C3AED] font-semibold mt-1 hover:text-violet-700">
                  View change log &amp; assumptions →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
