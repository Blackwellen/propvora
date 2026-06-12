"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  TrendingUp,
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
          <span style={{ color: p.color ?? "#64748B" }}>{p.name}</span>
          <span className="font-bold text-slate-900">{fmtFull(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Static fallback data ──────────────────────────────────────────────────────

const MONTHS = Array.from({ length: 24 }, (_, i) => {
  const base = 5800
  const target = 6200
  const net = base + Math.sin(i * 0.4) * 400 + i * 60
  return {
    month: `M${i + 1}`,
    net: Math.round(net),
    target: Math.round(target + i * 55),
    cumulative: Math.round((base + i * 62) * (i + 1) - 100000),
    targetCumulative: Math.round((target + i * 55) * (i + 1) - 100000),
  }
})

const ANNUAL_DATA = [
  { year: "Year 1", profit: 48600 },
  { year: "Year 2", profit: 62800 },
  { year: "Year 3", profit: 74400 },
  { year: "Year 4", profit: 83200 },
  { year: "Year 5", profit: 91600 },
]

const BREAKEVEN_DATA = MONTHS.slice(0, 18).map((m, i) => ({
  month: m.month,
  net: m.net,
  cumulative: -100000 + i * 6200,
}))

const TORNADO_DATA = [
  { factor: "Occupancy (±5%)", positive: 18450, negative: -18450 },
  { factor: "Avg. Rent (±10%)", positive: 16820, negative: -16820 },
  { factor: "OpEx (±10%)", positive: 9320, negative: -9320 },
  { factor: "Interest Rate (±1%)", positive: 6140, negative: -6140 },
  { factor: "Void Period (±1mo)", positive: 3460, negative: -3460 },
]

const SENSITIVITY_ROWS = [
  {
    scenario: "Best case",
    occupancy: "98%",
    avgRent: "£720",
    netProfit: "£84,200",
    coc: "34.2%",
    irr: "38.1%",
    colorClass: "text-emerald-700",
    bgClass: "bg-emerald-50",
  },
  {
    scenario: "Target case",
    occupancy: "92%",
    avgRent: "£650",
    netProfit: "£68,400",
    coc: "28.6%",
    irr: "31.2%",
    colorClass: "text-blue-700",
    bgClass: "bg-blue-50",
  },
  {
    scenario: "Current case",
    occupancy: "88%",
    avgRent: "£630",
    netProfit: "£56,800",
    coc: "22.1%",
    irr: "24.7%",
    colorClass: "text-amber-700",
    bgClass: "bg-amber-50",
  },
  {
    scenario: "Downside case",
    occupancy: "78%",
    avgRent: "£580",
    netProfit: "£31,200",
    coc: "11.4%",
    irr: "13.8%",
    colorClass: "text-red-700",
    bgClass: "bg-red-50",
  },
]

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
      try {
        const [{ data: f }, { data: s }] = await Promise.all([
          supabase
            .from("planning_forecasts")
            .select("*")
            .eq("planning_set_id", id)
            .order("month_index"),
          supabase
            .from("planning_scenarios")
            .select("*")
            .eq("planning_set_id", id)
            .order("created_at"),
        ])
        setForecasts((f ?? []) as PlanningForecast[])
        setScenarios((s ?? []) as PlanningScenario[])
      } catch {
        setError("Failed to load data.")
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
        <Link href="/app/planning/sets" className="text-sm text-[#7C3AED] hover:underline">Back to planning sets</Link>
      </div>
    )
  }

  // Build monthly chart data from DB forecasts if available, else use static
  const baseForecasts = forecasts.filter(f => f.scenario_type === "base")
  const optForecasts = forecasts.filter(f => f.scenario_type === "optimistic")

  const monthlyData = baseForecasts.length >= 12
    ? baseForecasts.slice(0, 24).map((f, i) => ({
        month: `M${f.month_index}`,
        net: f.net_cashflow,
        target: optForecasts[i]?.net_cashflow ?? f.net_cashflow * 1.08,
        cumulative: f.cumulative_cashflow,
        targetCumulative: (optForecasts[i]?.cumulative_cashflow ?? f.cumulative_cashflow * 1.08),
      }))
    : MONTHS

  const breakevenData = monthlyData.map((m) => ({
    month: m.month,
    net: m.net,
    cumulative: m.cumulative,
  }))

  const breakevenMonthIdx = breakevenData.findIndex(d => d.cumulative >= 0)
  const breakevenLabel = breakevenMonthIdx >= 0 ? breakevenData[breakevenMonthIdx].month : null

  // 12-month & 24-month performance
  const m12 = monthlyData.slice(0, 12)
  const m24 = monthlyData.slice(0, 24)
  const sum12Net = m12.reduce((s, m) => s + m.net, 0)
  const sum12Target = m12.reduce((s, m) => s + m.target, 0)
  const sum24Net = m24.reduce((s, m) => s + m.net, 0)
  const sum24Target = m24.reduce((s, m) => s + m.target, 0)

  void scenarios

  return (
    <div className="flex flex-col gap-6">

      {/* ── Performance comparison blocks ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            {/* 12-Month Performance */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center">
                  <div style={{ color: "#2563EB" }}><TrendingUp className="w-3.5 h-3.5" /></div>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">12-Month Performance</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Best", value: fmt(sum12Target * 1.12), color: "text-emerald-600" },
                  { label: "Target", value: fmt(sum12Target), color: "text-blue-600" },
                  { label: "Current", value: fmt(sum12Net), color: "text-amber-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex flex-col gap-0.5 text-center">
                    <span className="text-[10px] text-slate-400 font-medium">{label}</span>
                    <span className={`text-sm font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 24-Month Performance */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-violet-50 flex items-center justify-center">
                  <div style={{ color: "#7C3AED" }}><TrendingUp className="w-3.5 h-3.5" /></div>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">24-Month Performance</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Best", value: fmt(sum24Target * 1.12), color: "text-emerald-600" },
                  { label: "Target", value: fmt(sum24Target), color: "text-blue-600" },
                  { label: "Current", value: fmt(sum24Net), color: "text-amber-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex flex-col gap-0.5 text-center">
                    <span className="text-[10px] text-slate-400 font-medium">{label}</span>
                    <span className={`text-sm font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Return Metrics */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <div style={{ color: "#10B981" }}><TrendingUp className="w-3.5 h-3.5" /></div>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Key Return Metrics</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Cash-on-Cash", value: "28.6%" },
                  { label: "IRR", value: "31.2%" },
                  { label: "Equity Multiple", value: "2.34x" },
                  { label: "Payback", value: "2.6 years" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-400">{label}</span>
                    <span className="text-sm font-bold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Main layout ── */}
      <div className="flex gap-5 items-start">

        {/* ── Left / centre ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">

          {/* A. 4 charts 2x2 */}
          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

              {/* Chart 1: Net Cashflow (monthly) */}
              <ChartCard title="Net Cashflow (monthly)">
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={monthlyData} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94A3B8" }} interval={2} />
                    <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} tickFormatter={fmt} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={0} stroke="#CBD5E1" strokeDasharray="4 2" />
                    <Bar dataKey="net" fill="#7C3AED" radius={[3, 3, 0, 0]} name="Net Cashflow" />
                    <Line type="monotone" dataKey="target" stroke="#10B981" strokeWidth={1.5} dot={false} name="Target" strokeDasharray="4 2" />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Chart 2: Cumulative cashflow */}
              <ChartCard title="Net Cashflow (cumulative)">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={monthlyData} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94A3B8" }} interval={2} />
                    <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} tickFormatter={fmt} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={0} stroke="#CBD5E1" strokeDasharray="4 2" label={{ value: "Breakeven", fill: "#94A3B8", fontSize: 9 }} />
                    <Area type="monotone" dataKey="targetCumulative" stroke="#10B981" fill="#d1fae5" strokeWidth={1.5} name="Target Case" dot={false} strokeDasharray="4 2" />
                    <Area type="monotone" dataKey="cumulative" stroke="#2563EB" fill="#dbeafe" strokeWidth={2} name="Current Case" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Chart 3: Break-even timeline */}
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

              {/* Chart 4: Annual Net Profit */}
              <ChartCard title="Annual Net Profit (5-Year)">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ANNUAL_DATA} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="year" tick={{ fontSize: 9, fill: "#94A3B8" }} />
                    <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} tickFormatter={fmt} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="profit" fill="#2563EB" radius={[3, 3, 0, 0]} name="Net Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {/* B. Sensitivity Snapshots table */}
          {loading ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">B. Sensitivity Snapshots</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Scenario</th>
                      <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Occupancy</th>
                      <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Avg Rent (pcm)</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Net Profit (Yr 1)</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Cash-on-Cash</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wide">IRR (5yr)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SENSITIVITY_ROWS.map((row, i) => (
                      <tr key={i} className={`border-b border-slate-50 ${row.bgClass}`}>
                        <td className={`px-4 py-2.5 font-bold ${row.colorClass}`}>{row.scenario}</td>
                        <td className={`px-4 py-2.5 text-center ${row.colorClass}`}>{row.occupancy}</td>
                        <td className={`px-4 py-2.5 text-center ${row.colorClass}`}>{row.avgRent}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${row.colorClass} tabular-nums`}>{row.netProfit}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${row.colorClass} tabular-nums`}>{row.coc}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${row.colorClass} tabular-nums`}>{row.irr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* C. Key Assumptions */}
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">C. Key Assumptions (Forecasts)</h3>
              <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
                {[
                  { label: "Occupancy", value: "92%" },
                  { label: "Avg Rent (pcm)", value: "£650" },
                  { label: "Operating Expenses (p.a.)", value: "£59,800" },
                  { label: "Finance Rate", value: "9.75%" },
                  { label: "Loan Term", value: "25 years" },
                  { label: "Loan Amount", value: "£420,000" },
                  { label: "LTV", value: "70%" },
                  { label: "Interest Only Period", value: "12 months" },
                  { label: "Refinance at", value: "Month 24" },
                  { label: "Exit Cap Rate", value: "6.25%" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">{label}</span>
                    <span className="text-xs font-bold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* D. Sensitivity Tornado chart */}
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">D. Sensitivity Tornado (Impact on Net Profit Year 1)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={TORNADO_DATA}
                  layout="vertical"
                  margin={{ left: 120, right: 20, top: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: "#94A3B8" }} tickFormatter={fmt} />
                  <YAxis type="category" dataKey="factor" tick={{ fontSize: 9, fill: "#64748B" }} width={115} />
                  <Tooltip
                    formatter={(v) => fmtFull(Math.abs(Number(v)))}
                    contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 11 }}
                  />
                  <ReferenceLine x={0} stroke="#CBD5E1" />
                  <Bar dataKey="positive" fill="#10B981" radius={[0, 3, 3, 0]} name="Upside" />
                  <Bar dataKey="negative" fill="#EF4444" radius={[3, 0, 0, 3]} name="Downside" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── Right AI panel ── */}
        <div className="w-[260px] flex-shrink-0 flex flex-col gap-4">

          {/* What this means */}
          {loading ? (
            <Skeleton className="h-52 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div style={{ color: "#7C3AED" }}><Sparkles className="w-4 h-4" /></div>
                <h3 className="text-sm font-bold text-slate-900">What this means</h3>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mb-4">
                At target occupancy and rent, this deal produces strong returns over 5 years.
                Breakeven projected within 18 months. Occupancy and rent levels are the highest-impact drivers —
                a 5% occupancy drop reduces Year 1 profit by £18,450.
              </p>

              <div className="mb-3">
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1.5">Top Opportunities</div>
                {[
                  "Increase occupancy to 95% via marketing spend",
                  "Improve avg rent by £30/room with premium fit-out",
                  "Refinance at lower rate in Year 2 (+£6k/yr)",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-1.5 mb-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[11px] text-slate-600">{item}</span>
                  </div>
                ))}
              </div>

              <div>
                <div className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-1.5">Top Risks</div>
                {[
                  "Market rent compression in Years 2–3",
                  "Interest rate volatility on refinance",
                  "Higher void periods in shoulder season",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-1.5 mb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                    <span className="text-[11px] text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Run scenario CTA */}
          {loading ? (
            <Skeleton className="h-28 w-full" />
          ) : (
            <div className="rounded-2xl border border-violet-200 shadow-sm p-5 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 100%)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-bold text-violet-900">Scenario Analysis</span>
              </div>
              <p className="text-[11px] text-violet-800 leading-relaxed mb-4">
                Run best case, stress test and custom scenarios to stress-test your plan before committing.
              </p>
              <Link
                href={`/app/planning/sets/${id}/scenarios`}
                className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                Run scenario analysis <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Assumptions card */}
          {loading ? (
            <Skeleton className="h-36 w-full" />
          ) : (
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
          )}
        </div>
      </div>
    </div>
  )
}
