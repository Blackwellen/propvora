"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  LineChart as LineChartIcon,
} from "lucide-react"
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  ReferenceLine,
  Cell,
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import type { PlanningForecast, PlanningScenario } from "@/lib/planning/types"

// ── Formatters ────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}m`
  if (Math.abs(n) >= 1_000) return `£${(n / 1_000).toFixed(0)}k`
  return `£${n.toFixed(0)}`
}

function fmtFull(n: number): string {
  return `£${Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── Chart card wrapper ────────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <div className="font-semibold text-slate-600 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span style={{ color: p.color ?? "var(--text-muted)" }}>{p.name}</span>
          <span className="font-bold text-slate-900">{fmtFull(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ForecastsPage() {
  const params = useParams()
  const id = params.id as string

  const [forecasts, setForecasts] = useState<PlanningForecast[]>([])
  const [scenarios, setScenarios] = useState<PlanningScenario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      setError(null)
      // planning_forecasts / planning_scenarios may 42P01 — swallow each to empty.
      const [{ data: f, error: fErr }, { data: s, error: sErr }] = await Promise.all([
        supabase.from("planning_forecasts").select("*").eq("planning_set_id", id).order("month_index"),
        supabase.from("planning_scenarios").select("*").eq("planning_set_id", id).order("created_at"),
      ])
      setForecasts(fErr ? [] : ((f ?? []) as PlanningForecast[]))
      setScenarios(sErr ? [] : ((s ?? []) as PlanningScenario[]))
      setLoading(false)
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
        <Link href="/app/planning/sets" className="text-sm text-[#7C3AED] hover:underline">Back to planning sets</Link>
      </div>
    )
  }

  // Build monthly chart data from real forecasts only (no fabricated series).
  const baseForecasts = forecasts.filter((f) => f.scenario_type === "base")
  const optForecasts = forecasts.filter((f) => f.scenario_type === "optimistic")

  const monthlyData = baseForecasts.slice(0, 24).map((f, i) => ({
    month: `M${f.month_index}`,
    net: f.net_cashflow,
    target: optForecasts[i]?.net_cashflow ?? null,
    cumulative: f.cumulative_cashflow,
    targetCumulative: optForecasts[i]?.cumulative_cashflow ?? null,
  }))

  const breakevenData = monthlyData.map((m) => ({ month: m.month, net: m.net, cumulative: m.cumulative }))
  const breakevenMonthIdx = breakevenData.findIndex((d) => d.cumulative >= 0)
  const breakevenLabel = breakevenMonthIdx >= 0 ? breakevenData[breakevenMonthIdx].month : null

  const m12 = monthlyData.slice(0, 12)
  const m24 = monthlyData.slice(0, 24)
  const sum12Net = m12.reduce((s, m) => s + m.net, 0)
  const sum24Net = m24.reduce((s, m) => s + m.net, 0)

  const hasForecasts = monthlyData.length > 0

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-900">10 Forecasts</h2>
          <p className="text-xs text-slate-500 mt-0.5">Projected cashflow and break-even analysis for this planning set.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : !hasForecasts ? (
        /* ── Honest empty state ── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
            <LineChartIcon className="w-6 h-6 text-slate-400" />
          </div>
          <div className="text-sm font-semibold text-slate-700">No forecasts yet</div>
          <p className="text-xs text-slate-400 max-w-sm">
            Set your assumptions, then generate a forecast to see projected monthly cashflow, cumulative position and break-even timeline.
          </p>
          <Link
            href={`/app/planning/sets/${id}/assumptions`}
            className="mt-1 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors"
          >
            Edit assumptions <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <>
          {/* ── Performance summary (real sums) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center">
                  <div style={{ color: "var(--brand)" }}><TrendingUp className="w-3.5 h-3.5" /></div>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">12-Month Net Cashflow</h3>
              </div>
              <div className="text-xl font-bold text-slate-900">{fmt(sum12Net)}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-violet-50 flex items-center justify-center">
                  <div style={{ color: "var(--accent)" }}><TrendingUp className="w-3.5 h-3.5" /></div>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">24-Month Net Cashflow</h3>
              </div>
              <div className="text-xl font-bold text-slate-900">{fmt(sum24Net)}</div>
            </div>
          </div>

          {/* ── Main layout ── */}
          <div className="flex flex-col lg:flex-row gap-5 items-start">

            <div className="flex-1 min-w-0 flex flex-col gap-5 w-full">

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                <ChartCard title="Net Cashflow (monthly)">
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={monthlyData} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94A3B8" }} interval={2} />
                      <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} tickFormatter={fmt} />
                      <Tooltip content={<ChartTooltip />} />
                      <ReferenceLine y={0} stroke="#CBD5E1" strokeDasharray="4 2" />
                      <Bar dataKey="net" fill="#7C3AED" radius={[3, 3, 0, 0]} name="Net Cashflow" />
                      {optForecasts.length > 0 && (
                        <Line type="monotone" dataKey="target" stroke="#10B981" strokeWidth={1.5} dot={false} name="Optimistic" strokeDasharray="4 2" connectNulls />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Net Cashflow (cumulative)">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={monthlyData} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94A3B8" }} interval={2} />
                      <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} tickFormatter={fmt} />
                      <Tooltip content={<ChartTooltip />} />
                      <ReferenceLine y={0} stroke="#CBD5E1" strokeDasharray="4 2" label={{ value: "Breakeven", fill: "#94A3B8", fontSize: 9 }} />
                      {optForecasts.length > 0 && (
                        <Area type="monotone" dataKey="targetCumulative" stroke="#10B981" fill="#d1fae5" strokeWidth={1.5} name="Optimistic" dot={false} strokeDasharray="4 2" connectNulls />
                      )}
                      <Area type="monotone" dataKey="cumulative" stroke="#2563EB" fill="#dbeafe" strokeWidth={2} name="Base Case" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Break-even Timeline">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={breakevenData.slice(0, 18)} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94A3B8" }} interval={2} />
                      <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} tickFormatter={fmt} />
                      <Tooltip content={<ChartTooltip />} />
                      <ReferenceLine y={0} stroke="#EF4444" strokeWidth={1.5} label={{ value: "Zero line", fill: "#EF4444", fontSize: 9 }} />
                      {breakevenLabel && (
                        <ReferenceLine x={breakevenLabel} stroke="#10B981" strokeDasharray="4 2" label={{ value: "Breakeven", fill: "#10B981", fontSize: 9 }} />
                      )}
                      <Bar dataKey="cumulative" name="Cumulative Cashflow" radius={[3, 3, 0, 0]}>
                        {breakevenData.slice(0, 18).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cumulative >= 0 ? "#10B981" : "#EF4444"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Gross Income vs Costs (monthly)">
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={baseForecasts.slice(0, 24).map((f) => ({
                      month: `M${f.month_index}`,
                      gross: f.gross_income,
                      costs: f.operating_costs + f.bills + f.financing_costs,
                    }))} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94A3B8" }} interval={2} />
                      <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} tickFormatter={fmt} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="gross" fill="#10B981" radius={[3, 3, 0, 0]} name="Gross Income" />
                      <Bar dataKey="costs" fill="#F59E0B" radius={[3, 3, 0, 0]} name="Total Costs" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </div>

            {/* ── Right CTA panel ── */}
            <div className="w-full lg:w-[260px] flex-shrink-0 flex flex-col gap-4">
              <div className="rounded-2xl border border-violet-200 shadow-sm p-5 overflow-hidden"
                style={{ background: "linear-gradient(135deg, var(--color-ai-100, #EDE9FE) 0%, var(--accent-soft) 100%)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-violet-900">Scenario Analysis</span>
                </div>
                <p className="text-[11px] text-violet-800 leading-relaxed mb-4">
                  {scenarios.length > 0
                    ? `${scenarios.length} scenario${scenarios.length === 1 ? "" : "s"} saved. Run more to stress-test this plan.`
                    : "Run best case, stress test and custom scenarios to stress-test your plan before committing."}
                </p>
                <Link
                  href={`/app/planning/sets/${id}/scenarios`}
                  className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  Run scenario analysis <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Adjust Assumptions</h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  Update your occupancy, rent or financing inputs to see how forecasts change.
                </p>
                <Link
                  href={`/app/planning/sets/${id}/assumptions`}
                  className="w-full py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  Edit assumptions <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
