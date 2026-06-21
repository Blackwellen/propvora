"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  ShieldCheck,
  Settings,
  Layers,
} from "lucide-react"
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
import { createClient } from "@/lib/supabase/client"

// ── Live schema row (planning_scenarios is profile-scoped) ─────────────────────

interface ScenarioRow {
  id: string
  name: string
  scenario_type: string | null
  type: string | null
  occupancy_pct: number | null
  income_adjustment_pct: number | null
  expense_adjustment_pct: number | null
  calculated_net_profit: number | null
  calculated_margin_pct: number | null
  notes: string | null
}

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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1.5 min-w-0">
      <div className="text-xs text-slate-500 font-medium">{label}</div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[17px] font-bold text-slate-900 leading-tight">{value}</span>
        {chip}
      </div>
      {trend && <div className="text-[11px] text-slate-400">{trend}</div>}
    </div>
  )
}

// ── Scenario type presentation ────────────────────────────────────────────────

const TYPE_STYLE: Record<string, { accentColor: string; accentBg: string; accentText: string; accentBorder: string; accentBar: string; badge: string }> = {
  base:         { accentColor: "#2563EB", accentBg: "bg-blue-50",    accentText: "text-blue-700",    accentBorder: "border-blue-200",    accentBar: "bg-blue-500",    badge: "Most likely outcome" },
  optimistic:   { accentColor: "#10B981", accentBg: "bg-emerald-50", accentText: "text-emerald-700", accentBorder: "border-emerald-200", accentBar: "bg-emerald-500", badge: "Best case" },
  pessimistic:  { accentColor: "#F59E0B", accentBg: "bg-amber-50",   accentText: "text-amber-700",   accentBorder: "border-amber-200",   accentBar: "bg-amber-400",   badge: "Prudent assumptions" },
  custom:       { accentColor: "#7C3AED", accentBg: "bg-violet-50",  accentText: "text-violet-700",  accentBorder: "border-violet-200",  accentBar: "bg-violet-500",  badge: "Custom scenario" },
}

function styleForType(t: string | null): typeof TYPE_STYLE[string] {
  return TYPE_STYLE[t ?? "custom"] ?? TYPE_STYLE.custom
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function ImpactTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <div className="font-semibold text-slate-700">{payload[0].name}</div>
      <div className="font-bold" style={{ color: v >= 0 ? "var(--color-success)" : "var(--color-danger-500, #EF4444)" }}>
        {v >= 0 ? "+" : ""}{fmtFull(v)}/mo
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <Layers className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">{hint}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ScenariosPage() {
  const params = useParams()
  const id = params.id as string

  const [scenarios, setScenarios] = useState<ScenarioRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      setLoading(true)
      // planning_scenarios is profile-scoped (no planning_set_id) — query resiliently
      const { data, error } = await supabase
        .from("planning_scenarios")
        .select("*")
        .eq("planning_set_id", id)
        .order("sort_order")
      setScenarios(error ? [] : ((data ?? []) as unknown as ScenarioRow[]))
      setLoading(false)
    }
    load()
  }, [id])

  // ── Derived from real rows only ──────────────────────────────────────────────

  const cards = scenarios.map((s) => {
    const t = s.scenario_type ?? s.type
    const style = styleForType(t)
    const net = s.calculated_net_profit ?? 0
    return {
      id: s.id,
      type: t ?? "custom",
      label: s.name,
      style,
      netMonthly: net / 12,
      annualProfit: net,
      occupancy: s.occupancy_pct,
      margin: s.calculated_margin_pct,
      healthScore: Math.max(0, Math.min(100, Math.round(s.calculated_margin_pct ?? 0))),
    }
  })

  const baseNet = cards.find((c) => c.type === "base")?.netMonthly ?? 0
  const impactData = cards.map((c) => ({
    name: c.label,
    delta: Math.round(c.netMonthly - baseNet),
    fill: c.style.accentColor,
  }))

  return (
    <div className="flex flex-col gap-6">

      {/* ── Section Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Scenarios</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare performance across saved scenarios to understand potential outcomes and downside risk.
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          <Settings className="w-3.5 h-3.5" />
          View scenario settings
        </button>
      </div>

      {/* ── Main layout: cards + right panel ──────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-5 items-start">

        {/* Left: scenario cards + table */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">

          {/* Scenario Cards */}
          {loading ? (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72" />)}
            </div>
          ) : cards.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <EmptyState
                title="No scenarios yet"
                hint="Saved scenarios will appear here once you create them. Add a base, optimistic or downside case to compare outcomes."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {cards.map((s) => (
                <div
                  key={s.id}
                  className={`bg-white rounded-2xl border ${s.style.accentBorder} shadow-sm overflow-hidden flex flex-col`}
                >
                  {/* Header */}
                  <div className={`px-4 pt-4 pb-3 ${s.style.accentBg}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: s.style.accentColor + "22" }}>
                        <ShieldCheck className="w-3.5 h-3.5" style={{ color: s.style.accentColor }} />
                      </div>
                      <span className={`text-xs font-bold ${s.style.accentText} truncate`}>{s.label}</span>
                    </div>
                    <span className={`text-[10px] font-medium ${s.style.accentText} opacity-75`}>{s.style.badge}</span>
                  </div>

                  {/* Body */}
                  <div className="px-4 py-3 flex flex-col gap-2.5 flex-1">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Net Monthly (calc.)</div>
                      <div className={`text-lg font-bold ${s.netMonthly < 0 ? "text-red-600" : "text-slate-900"}`}>
                        {fmtFull(Math.round(s.netMonthly))}/mo
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-[10px] text-slate-400">Annual Net Profit (calc.)</div>
                        <div className={`text-sm font-semibold ${s.annualProfit < 0 ? "text-red-600" : "text-slate-800"}`}>
                          {fmtFull(s.annualProfit)}
                        </div>
                      </div>
                    </div>
                    {[
                      { label: "Occupancy", value: s.occupancy != null ? `${s.occupancy}%` : "—" },
                      { label: "Margin", value: s.margin != null ? `${s.margin.toFixed(1)}%` : "—" },
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
                  <div className={`h-1.5 ${s.style.accentBar}`} />
                </div>
              ))}
            </div>
          )}

          {/* Comparison Table */}
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : cards.length === 0 ? null : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Scenario Comparison</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["Scenario", "Net Monthly (calc.)", "Annual Net Profit", "Occupancy", "Margin", "Health Score"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map((s) => (
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${s.style.accentText} flex items-center gap-1`}>
                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: s.style.accentColor }} />
                            {s.label}
                          </span>
                        </td>
                        <td className={`px-4 py-3 font-semibold ${s.netMonthly < 0 ? "text-red-600" : "text-slate-800"}`}>
                          {fmtFull(Math.round(s.netMonthly))}/mo
                        </td>
                        <td className={`px-4 py-3 font-semibold ${s.annualProfit < 0 ? "text-red-600" : "text-slate-800"}`}>
                          {fmtFull(s.annualProfit)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{s.occupancy != null ? `${s.occupancy}%` : "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{s.margin != null ? `${s.margin.toFixed(1)}%` : "—"}</td>
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
        <div className="w-full xl:w-80 flex-shrink-0 flex flex-col gap-4">

          {/* Impact Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Scenario Impact vs Base</h3>
            {cards.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                <p className="text-xs text-slate-400">No scenario data to chart yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={impactData} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip content={<ImpactTooltip />} />
                  <Bar dataKey="delta" radius={[4, 4, 0, 0]} name="Delta vs Base">
                    {impactData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
