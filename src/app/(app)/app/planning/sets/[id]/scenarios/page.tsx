"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Settings,
  ArrowRight,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import type { PlanningScenario } from "@/lib/planning/types"

// ── Formatters ────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${n < 0 ? "-" : ""}£${(abs / 1_000_000).toFixed(1)}m`
  if (abs >= 1_000) return `${n < 0 ? "-" : ""}£${(abs / 1_000).toFixed(0)}k`
  return `${n < 0 ? "-" : ""}£${abs.toFixed(0)}`
}

function fmtFull(n: number): string {
  const abs = Math.abs(n)
  return `${n < 0 ? "-" : ""}£${abs.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── Health Gauge ──────────────────────────────────────────────────────────────

function HealthGauge({ score }: { score: number }) {
  const capped = Math.max(0, Math.min(100, score))
  const color = capped >= 75 ? "#10B981" : capped >= 50 ? "#F59E0B" : "#EF4444"
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-9 h-9">
        <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="4" />
          <circle
            cx="18" cy="18" r="14"
            fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={`${(capped / 100) * 87.96} 87.96`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-700">{capped}</span>
      </div>
      <span className="text-sm font-bold text-slate-900">{capped}/100</span>
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string
  value: React.ReactNode
  chip?: React.ReactNode
  trend?: React.ReactNode
  loading?: boolean
}

function KpiCard({ label, value, chip, trend, loading }: KpiProps) {
  if (loading) return <Skeleton className="h-24 w-full" />
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5">
      <div className="text-xs text-slate-500 font-medium">{label}</div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[17px] font-bold text-slate-900 leading-tight">{value}</span>
        {chip}
      </div>
      {trend && <div className="text-[11px] text-slate-400">{trend}</div>}
    </div>
  )
}

// ── Chip ──────────────────────────────────────────────────────────────────────

function Chip({ label, color }: { label: string; color: "emerald" | "amber" | "red" | "blue" | "slate" }) {
  const map = {
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    slate: "bg-slate-100 text-slate-600",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[color]}`}>{label}</span>
  )
}

// ── Static scenario data ──────────────────────────────────────────────────────

const STATIC_SCENARIOS = [
  {
    type: "base",
    label: "Base Case",
    badge: "Most likely outcome",
    accentColor: "#2563EB",
    accentBg: "bg-blue-50",
    accentText: "text-blue-700",
    accentBorder: "border-blue-200",
    accentBar: "bg-blue-500",
    netMonthly: 1142,
    annualProfit: 13704,
    annualChange: null,
    occupancy: 98,
    totalCosts: 42308,
    costsChange: null,
    breakevenMonth: "Month 9",
    healthScore: 82,
  },
  {
    type: "optimistic",
    label: "Optimistic Case",
    badge: "Best case",
    accentColor: "#10B981",
    accentBg: "bg-emerald-50",
    accentText: "text-emerald-700",
    accentBorder: "border-emerald-200",
    accentBar: "bg-emerald-500",
    netMonthly: 1782,
    annualProfit: 21384,
    annualChange: "+56%",
    occupancy: 99,
    totalCosts: 40126,
    costsChange: "-5%",
    breakevenMonth: "Month 6",
    healthScore: 92,
  },
  {
    type: "conservative",
    label: "Conservative Case",
    badge: "Prudent assumptions",
    accentColor: "#F59E0B",
    accentBg: "bg-amber-50",
    accentText: "text-amber-700",
    accentBorder: "border-amber-200",
    accentBar: "bg-amber-400",
    netMonthly: 642,
    annualProfit: 7704,
    annualChange: "-44%",
    occupancy: 90,
    totalCosts: 44812,
    costsChange: "+6%",
    breakevenMonth: "Month 14",
    healthScore: 58,
  },
  {
    type: "stress",
    label: "Stress Case",
    badge: "Downside stress test",
    accentColor: "#EF4444",
    accentBg: "bg-red-50",
    accentText: "text-red-700",
    accentBorder: "border-red-200",
    accentBar: "bg-red-500",
    netMonthly: -318,
    annualProfit: -3816,
    annualChange: "-128%",
    occupancy: 82,
    totalCosts: 47936,
    costsChange: "+13%",
    breakevenMonth: "18+ months",
    healthScore: 24,
  },
]

const IMPACT_DATA = [
  { name: "Optimistic", delta: 640, fill: "#10B981" },
  { name: "Base", delta: 0, fill: "#2563EB" },
  { name: "Conservative", delta: -500, fill: "#F59E0B" },
  { name: "Stress", delta: -1460, fill: "#EF4444" },
]

const PIE_DATA = [
  { name: "Base 50%", value: 50, fill: "#2563EB" },
  { name: "Optimistic 20%", value: 20, fill: "#10B981" },
  { name: "Conservative 20%", value: 20, fill: "#F59E0B" },
  { name: "Stress 10%", value: 10, fill: "#EF4444" },
]

// ── Tooltip ───────────────────────────────────────────────────────────────────

function ImpactTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <div className="font-semibold text-slate-700">{payload[0].name}</div>
      <div className="font-bold" style={{ color: v >= 0 ? "#10B981" : "#EF4444" }}>
        {v >= 0 ? "+" : ""}{fmtFull(v)}/mo
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ScenariosPage() {
  const params = useParams()
  const id = params.id as string

  const [scenarios, setScenarios] = useState<PlanningScenario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await supabase
          .from("planning_scenarios")
          .select("*")
          .eq("planning_set_id", id)
          .order("created_at")
        if (err) throw err
        setScenarios((data ?? []) as PlanningScenario[])
      } catch {
        setError("Failed to load scenarios.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div className="text-slate-700 font-semibold">{error}</div>
      </div>
    )
  }

  // Merge live data into static display cards where possible
  const enriched = STATIC_SCENARIOS.map((s) => {
    const live = scenarios.find((x) => x.scenario_type === s.type)
    return live
      ? { ...s, netMonthly: live.net_monthly, annualProfit: live.annual_cashflow, occupancy: live.occupancy_pct ?? s.occupancy, healthScore: live.confidence_score }
      : s
  })

  return (
    <div className="flex flex-col gap-6">

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard
          loading={loading}
          label="Weighted Risk Score"
          value="38/100"
          chip={<Chip label="Medium" color="amber" />}
          trend="↑ 7 pts vs last review"
        />
        <KpiCard
          loading={loading}
          label="Probability of Success"
          value="78%"
          chip={<Chip label="High" color="emerald" />}
          trend="↑ 6% vs last review"
        />
        <KpiCard
          loading={loading}
          label="Downside Protection"
          value="£18,240"
          chip={<span className="text-[10px] text-slate-500 font-medium">Cash buffer at P10</span>}
          trend="↑ £2,140 vs last review"
        />
        <KpiCard
          loading={loading}
          label="Scenario Spread (P90–P10)"
          value="£3,960/mo"
          chip={<span className="text-[10px] text-slate-500 font-medium">24% of base case</span>}
          trend="↓ 5% vs last review"
        />
      </div>

      {/* ── Section Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">8A Scenarios</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare performance across key scenarios to understand potential outcomes and downside risk.
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          <Settings className="w-3.5 h-3.5" />
          View scenario settings
        </button>
      </div>

      {/* ── Main layout: cards + right panel ──────────────────────────────── */}
      <div className="flex gap-5 items-start">

        {/* Left: scenario cards + table */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">

          {/* 4 Scenario Cards */}
          {loading ? (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {enriched.map((s) => (
                <div
                  key={s.type}
                  className={`bg-white rounded-2xl border ${s.accentBorder} shadow-sm overflow-hidden flex flex-col`}
                >
                  {/* Header */}
                  <div className={`px-4 pt-4 pb-3 ${s.accentBg}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: s.accentColor + "22" }}>
                        <ShieldCheck className="w-3.5 h-3.5" style={{ color: s.accentColor }} />
                      </div>
                      <span className={`text-xs font-bold ${s.accentText}`}>{s.label}</span>
                    </div>
                    <span className={`text-[10px] font-medium ${s.accentText} opacity-75`}>{s.badge}</span>
                  </div>

                  {/* Body */}
                  <div className="px-4 py-3 flex flex-col gap-2.5 flex-1">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Net Monthly Cashflow</div>
                      <div className={`text-lg font-bold ${s.netMonthly < 0 ? "text-red-600" : "text-slate-900"}`}>
                        {fmtFull(s.netMonthly)}/mo
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-[10px] text-slate-400">Annual Profit (After Tax)</div>
                        <div className={`text-sm font-semibold ${s.annualProfit < 0 ? "text-red-600" : "text-slate-800"}`}>
                          {fmtFull(s.annualProfit)}
                          {s.annualChange && (
                            <span className={`ml-1 text-[10px] font-medium ${s.annualChange.startsWith("+") ? "text-emerald-600" : "text-red-500"}`}>
                              ({s.annualChange})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {[
                      { label: "Occupancy (Avg.)", value: `${s.occupancy}%` },
                      { label: "Total Annual Costs", value: `${fmtFull(s.totalCosts)}${s.costsChange ? ` (${s.costsChange})` : ""}` },
                      { label: "Break-even Month", value: s.breakevenMonth },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center border-t border-slate-100 pt-2">
                        <span className="text-[10px] text-slate-400 font-medium">{label}</span>
                        <span className="text-[11px] font-semibold text-slate-700">{value}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-100 pt-2">
                      <div className="text-[10px] text-slate-400 font-medium mb-1.5">Health Score</div>
                      <HealthGauge score={s.healthScore} />
                    </div>
                  </div>

                  {/* Colour bar */}
                  <div className={`h-1.5 ${s.accentBar}`} />
                </div>
              ))}
            </div>
          )}

          {/* Comparison Table */}
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Scenario Comparison</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["Scenario", "Probability (Weight)", "Net Monthly Cashflow", "Annual Profit", "Occupancy", "Total Annual Costs", "Break-even Month", "Health Score"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {enriched.map((s) => (
                      <tr key={s.type} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${s.accentText} cursor-pointer hover:underline flex items-center gap-1`}>
                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: s.accentColor }} />
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {s.type === "base" ? "50%" : s.type === "optimistic" ? "20%" : s.type === "conservative" ? "20%" : "10%"}
                        </td>
                        <td className={`px-4 py-3 font-semibold ${s.netMonthly < 0 ? "text-red-600" : "text-slate-800"}`}>
                          {fmtFull(s.netMonthly)}/mo
                        </td>
                        <td className={`px-4 py-3 font-semibold ${s.annualProfit < 0 ? "text-red-600" : "text-slate-800"}`}>
                          {fmtFull(s.annualProfit)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{s.occupancy}%</td>
                        <td className="px-4 py-3 text-slate-600">{fmtFull(s.totalCosts)}</td>
                        <td className="px-4 py-3 text-slate-600">{s.breakevenMonth}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${s.healthScore >= 75 ? "text-emerald-600" : s.healthScore >= 50 ? "text-amber-600" : "text-red-500"}`}>
                            {s.healthScore}/100
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">

          {/* Impact Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Scenario Impact vs Base</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={IMPACT_DATA} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={(v) => fmt(v)} />
                <Tooltip content={<ImpactTooltip />} />
                <Bar dataKey="delta" radius={[4, 4, 0, 0]} name="Delta vs Base">
                  {IMPACT_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Probability Distribution Donut */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Scenario Probability Distribution</h3>
            <div className="relative">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={PIE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {PIE_DATA.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => [`${Number(v)}%`, "Weight"]} contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 font-medium">Expected</div>
                  <div className="text-xs font-bold text-slate-900">£1,019/mo</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 mt-2">
              {PIE_DATA.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                  <span className="text-[11px] text-slate-600">{d.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* View all link */}
          <button className="inline-flex items-center justify-center gap-1.5 h-9 w-full rounded-xl border border-violet-200 text-[#7C3AED] text-xs font-semibold hover:bg-violet-50 transition-colors">
            View all scenarios
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
