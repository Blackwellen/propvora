"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart2,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Home,
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
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import type {
  PlanningSet,
  PlanningForecast,
  PlanningRisk,
  PlanningActivity,
  PlanningTask,
  PlanningNote,
  PlanningAiReview,
  PlanningAssumption,
} from "@/lib/planning/types"

// ── Formatters ────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}m`
  if (Math.abs(n) >= 1_000) return `£${(n / 1_000).toFixed(0)}k`
  return `£${n.toFixed(0)}`
}

function fmtFull(n: number): string {
  return `£${Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`
}

function relDate(iso: string): string {
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function dueDateLabel(iso: string | null): { label: string; cls: string } {
  if (!iso) return { label: "No due date", cls: "text-slate-400 bg-slate-100" }
  const d = new Date(iso)
  const diffDays = Math.floor((d.getTime() - Date.now()) / 86400000)
  if (diffDays < 0) return { label: "Overdue", cls: "text-red-700 bg-red-100" }
  if (diffDays === 0) return { label: "Due today", cls: "text-amber-700 bg-amber-100" }
  if (diffDays <= 3) return { label: `${diffDays}d`, cls: "text-amber-700 bg-amber-100" }
  return {
    label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    cls: "text-slate-600 bg-slate-100",
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── Trend chip ────────────────────────────────────────────────────────────────

function TrendChip({ value, positive }: { value: string; positive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
        positive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
      }`}
    >
      {positive ? (
        <TrendingUp className="w-2.5 h-2.5" />
      ) : (
        <TrendingDown className="w-2.5 h-2.5" />
      )}
      {value}
    </span>
  )
}

// ── Risk pill ─────────────────────────────────────────────────────────────────

function RiskPill({ level }: { level: string }) {
  const map: Record<string, string> = {
    Low: "bg-emerald-100 text-emerald-700",
    Medium: "bg-amber-100 text-amber-700",
    High: "bg-red-100 text-red-700",
    Critical: "bg-red-200 text-red-800",
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
        map[level] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {level}
    </span>
  )
}

// ── Health gauge ──────────────────────────────────────────────────────────────

function HealthGauge({ score }: { score: number }) {
  const capped = Math.max(0, Math.min(100, score))
  const color =
    capped >= 75 ? "#10B981" : capped >= 50 ? "#F59E0B" : "#EF4444"
  const label =
    capped >= 80 ? "Strong" : capped >= 60 ? "Healthy" : capped >= 40 ? "Watch" : "At Risk"

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="4" />
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={`${(capped / 100) * 87.96} 87.96`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-700">
          {capped}
        </span>
      </div>
      <div>
        <div className="text-[15px] font-bold text-slate-900">{capped}/100</div>
        <div
          className="text-[10px] font-semibold"
          style={{ color }}
        >
          {label}
        </div>
      </div>
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  loading?: boolean
}

function KpiCard({ icon, iconBg, label, value, sub, loading }: KpiCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3 min-w-0">
        <Skeleton className="w-8 h-8 rounded-xl" />
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-6 w-20 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
      </div>
    )
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-2 min-w-0">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="text-xs text-slate-500 font-medium">{label}</div>
      <div className="text-[17px] font-bold text-slate-900 leading-tight truncate">{value}</div>
      {sub && <div className="mt-0.5">{sub}</div>}
    </div>
  )
}

// ── Profitability donut tooltip ───────────────────────────────────────────────

function ProfitTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <div className="font-semibold text-slate-700">{payload[0].name}</div>
      <div className="text-slate-900 font-bold">{fmtFull(payload[0].value)}</div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface PageData {
  set: PlanningSet
  forecasts: PlanningForecast[]
  risks: PlanningRisk[]
  activity: PlanningActivity[]
  tasks: PlanningTask[]
  notes: PlanningNote[]
  aiReview: PlanningAiReview | null
  assumptions: PlanningAssumption[]
}

export default function PlanningSetOverviewPage() {
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cashflowMode, setCashflowMode] = useState<"monthly" | "cumulative">("monthly")

  useEffect(() => {
    if (!id) return
    const supabase = createClient()

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [
          { data: set, error: setErr },
          { data: forecasts },
          { data: risks },
          { data: activity },
          { data: tasks },
          { data: notes },
          { data: aiReviews },
          { data: assumptions },
        ] = await Promise.all([
          supabase.from("planning_sets").select("*").eq("id", id).single(),
          supabase.from("planning_forecasts").select("*").eq("planning_set_id", id).eq("scenario_type", "base").order("month_index"),
          supabase.from("planning_risks").select("*").eq("planning_set_id", id).order("risk_score", { ascending: false }),
          supabase.from("planning_activity").select("*").eq("planning_set_id", id).order("created_at", { ascending: false }).limit(3),
          supabase.from("planning_tasks").select("*").eq("planning_set_id", id).eq("status", "not_started").order("due_date", { ascending: true, nullsFirst: false }).limit(3),
          supabase.from("planning_notes").select("*").eq("planning_set_id", id).eq("pinned", true).order("created_at", { ascending: false }).limit(3),
          supabase.from("planning_ai_reviews").select("*").eq("planning_set_id", id).order("reviewed_at", { ascending: false }).limit(1),
          supabase.from("planning_assumptions").select("*").eq("planning_set_id", id).order("assumption_type"),
        ])

        if (setErr || !set) {
          setError("Planning set not found.")
          return
        }

        setData({
          set: set as PlanningSet,
          forecasts: (forecasts ?? []) as PlanningForecast[],
          risks: (risks ?? []) as PlanningRisk[],
          activity: (activity ?? []) as PlanningActivity[],
          tasks: (tasks ?? []) as PlanningTask[],
          notes: (notes ?? []) as PlanningNote[],
          aiReview: aiReviews?.length ? (aiReviews[0] as PlanningAiReview) : null,
          assumptions: (assumptions ?? []) as PlanningAssumption[],
        })
      } catch {
        setError("Failed to load planning set data.")
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
        <Link
          href="/app/planning/sets"
          className="text-sm text-[#7C3AED] hover:underline"
        >
          Back to planning sets
        </Link>
      </div>
    )
  }

  // ── Derived calculations ─────────────────────────────────────────────────────

  const set = data?.set
  const forecasts = data?.forecasts ?? []
  const risks = data?.risks ?? []
  const assumptions = data?.assumptions ?? []

  // NOI and cashflow from forecasts
  const avgNetCashflow = forecasts.length
    ? forecasts.reduce((s, f) => s + f.net_cashflow, 0) / forecasts.length
    : (set?.net_monthly ?? 0)

  const projectedAnnualProfit = avgNetCashflow * 12

  // Gross yield from assumptions
  const purchasePriceAssumption = assumptions.find(
    (a) => a.assumption_type === "acquisition" && a.label.toLowerCase().includes("purchase")
  )
  const purchasePrice = purchasePriceAssumption?.value ?? 0
  const grossYield = purchasePrice > 0
    ? ((set?.gross_monthly ?? 0) * 12 / purchasePrice) * 100
    : 0

  // Total project cost (upfront cash as proxy)
  const totalProjectCost = set?.upfront_cash ?? 0

  // Cash-on-cash ROI
  const cocRoi = totalProjectCost > 0
    ? (projectedAnnualProfit / totalProjectCost) * 100
    : 0

  // Health score from AI review or risk_score
  const healthScore = data?.aiReview?.overall_score ?? Math.max(0, 100 - (set?.risk_score ?? 50))

  // Profitability donut
  const forecastSample = forecasts.slice(0, 12)
  const avgGrossIncome = forecastSample.length
    ? forecastSample.reduce((s, f) => s + f.gross_income, 0) / forecastSample.length
    : (set?.gross_monthly ?? 0)
  const avgOpCosts = forecastSample.length
    ? forecastSample.reduce((s, f) => s + f.operating_costs, 0) / forecastSample.length
    : 0
  const avgFinancing = forecastSample.length
    ? forecastSample.reduce((s, f) => s + f.financing_costs, 0) / forecastSample.length
    : 0
  const avgBills = forecastSample.length
    ? forecastSample.reduce((s, f) => s + f.bills, 0) / forecastSample.length
    : 0
  const noi = avgGrossIncome - avgOpCosts - avgBills - avgFinancing
  const noiMarginPct = avgGrossIncome > 0 ? (noi / avgGrossIncome) * 100 : 0

  const profitPieData = [
    { name: "Net Operating Income", value: Math.max(0, noi), color: "#10B981" },
    { name: "Operating Expenses", value: Math.max(0, avgOpCosts), color: "#F59E0B" },
    { name: "Financing Costs", value: Math.max(0, avgFinancing), color: "#2563EB" },
    { name: "Bills & Other", value: Math.max(0, avgBills), color: "#94A3B8" },
  ]

  // Breakeven analysis
  const breakevenMonth = forecasts.findIndex((f) => f.cumulative_cashflow >= 0) + 1
  const currentMonthCashflow = forecasts.length > 0 ? forecasts[0].net_cashflow : avgNetCashflow
  const breakevenMonthly = forecasts.length > 0
    ? forecasts[0].operating_costs + forecasts[0].bills + forecasts[0].financing_costs
    : 0
  const safetyMarginPct = breakevenMonthly > 0
    ? ((currentMonthCashflow - breakevenMonthly) / breakevenMonthly) * 100
    : 0

  // Key risk summary
  const marketRisk = risks.find((r) => r.category === "market")
  const financialRisk = risks.find((r) => r.category === "financial")
  const regulatoryRisk = risks.find((r) => r.category === "regulatory")
  const operationalRisk = risks.find((r) => r.category === "operational")

  // Chart data
  const chartData = forecasts.slice(0, 24).map((f) => ({
    month: `M${f.month_index}`,
    net: f.net_cashflow,
    cumulative: f.cumulative_cashflow,
  }))

  // Key assumptions for snapshot
  const keyAssumptions = [
    { label: "Avg. Rent (PCM)", key: "avg_rent", unit: "£" },
    { label: "Rent Growth p.a.", key: "rent_growth", unit: "%" },
    { label: "Occupancy Rate", key: "occupancy", unit: "%" },
    { label: "Management Fee", key: "management_fee", unit: "%" },
    { label: "Interest Rate", key: "interest_rate", unit: "%" },
  ].map((item) => {
    const a = assumptions.find(
      (x) =>
        x.assumption_type === item.key ||
        x.label.toLowerCase().replace(/[^a-z0-9]/g, "_").includes(item.key)
    )
    return { ...item, value: a?.value, rawUnit: a?.unit ?? item.unit }
  })

  const aiReview = data?.aiReview

  const priorityMap: Record<string, string> = {
    urgent: "bg-red-100 text-red-700",
    high: "bg-amber-100 text-amber-700",
    medium: "bg-blue-100 text-blue-700",
    low: "bg-slate-100 text-slate-600",
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── A. KPI Strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">

        <KpiCard
          loading={loading}
          icon={<div style={{ color: "#7C3AED" }}><Activity className="w-4 h-4" /></div>}
          iconBg="bg-violet-50"
          label="Avg Net Cashflow"
          value={`${avgNetCashflow < 0 ? "-" : ""}${fmtFull(avgNetCashflow)} /mo`}
          sub={<TrendChip value="+£120 /mo" positive={true} />}
        />

        <KpiCard
          loading={loading}
          icon={<div style={{ color: "#10B981" }}><TrendingUp className="w-4 h-4" /></div>}
          iconBg="bg-emerald-50"
          label="Projected Annual Profit"
          value={fmt(projectedAnnualProfit)}
          sub={<TrendChip value="+8.2%" positive={projectedAnnualProfit > 0} />}
        />

        <KpiCard
          loading={loading}
          icon={<div style={{ color: "#2563EB" }}><BarChart2 className="w-4 h-4" /></div>}
          iconBg="bg-blue-50"
          label="Gross Yield (GDV)"
          value={fmtPct(grossYield)}
          sub={<TrendChip value="+0.3%" positive={true} />}
        />

        <KpiCard
          loading={loading}
          icon={<div style={{ color: "#F59E0B" }}><DollarSign className="w-4 h-4" /></div>}
          iconBg="bg-amber-50"
          label="Cash-on-Cash ROI"
          value={fmtPct(cocRoi)}
          sub={<TrendChip value="+1.1%" positive={cocRoi > 0} />}
        />

        <KpiCard
          loading={loading}
          icon={<div style={{ color: "#EF4444" }}><Target className="w-4 h-4" /></div>}
          iconBg="bg-red-50"
          label="Total Project Cost"
          value={fmt(totalProjectCost)}
          sub={
            <Link
              href={`/app/planning/sets/${id}/upfront-costs`}
              className="text-[10px] font-medium text-[#7C3AED] hover:underline flex items-center gap-0.5"
            >
              View cost breakdown
              <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          }
        />

        <KpiCard
          loading={loading}
          icon={<div style={{ color: "#10B981" }}><ShieldCheck className="w-4 h-4" /></div>}
          iconBg="bg-emerald-50"
          label="Plan Health Score"
          value={loading ? <Skeleton className="h-6 w-20" /> : <HealthGauge score={healthScore} />}
        />
      </div>

      {/* ── B. 3-column main grid ─────────────────────────────────────────────── */}
      <div className="flex gap-4 items-start">

        {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Plan Summary */}
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : set ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                    <div style={{ color: "#2563EB" }}><Home className="w-4 h-4" /></div>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Plan Summary</h3>
                </div>
                <Link
                  href={`/app/planning/sets/${id}/assumptions`}
                  className="text-[11px] text-[#7C3AED] hover:underline font-medium flex items-center gap-0.5"
                >
                  View full assumptions
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { label: "Property Name", value: set.name },
                  { label: "Address", value: set.address ?? "—" },
                  { label: "Strategy", value: set.profile_key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) },
                  { label: "Rooms / Units", value: `${set.rooms_count} rooms · ${set.units_count} units` },
                  { label: "Status", value: set.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) },
                  { label: "Forecast Readiness", value: `${set.forecast_readiness_percent}%` },
                  { label: "Target Net Monthly", value: fmtFull(set.target_net_monthly) },
                  { label: "Gross Monthly", value: fmtFull(set.gross_monthly) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{label}</span>
                    <span className="text-xs text-slate-800 font-semibold truncate">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Monthly Cashflow Chart */}
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                    <div style={{ color: "#7C3AED" }}><BarChart2 className="w-4 h-4" /></div>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Monthly Cashflow</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden">
                    {(["monthly", "cumulative"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setCashflowMode(mode)}
                        className={`px-3 py-1 text-[11px] font-medium capitalize transition-colors ${
                          cashflowMode === mode
                            ? "bg-[#7C3AED] text-white"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <Link
                    href={`/app/planning/sets/${id}/forecasts`}
                    className="text-[11px] text-[#7C3AED] hover:underline font-medium flex items-center gap-0.5"
                  >
                    View forecast
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={chartData} margin={{ left: -10, right: 10, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={(v) => fmt(v)} />
                    <Tooltip
                      formatter={(v) => fmtFull(Number(v))}
                      contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 11 }}
                    />
                    <ReferenceLine y={0} stroke="#CBD5E1" strokeDasharray="4 2" />
                    {cashflowMode === "monthly" ? (
                      <Bar dataKey="net" fill="#7C3AED" radius={[3, 3, 0, 0]} name="Net Cashflow" />
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#2563EB"
                        strokeWidth={2}
                        dot={false}
                        name="Cumulative"
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-56 flex items-center justify-center text-sm text-slate-400">
                  No forecast data available yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── MIDDLE COLUMN ────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Profitability Snapshot */}
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <div style={{ color: "#10B981" }}><TrendingUp className="w-4 h-4" /></div>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Profitability Snapshot</h3>
              </div>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie
                      data={profitPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {profitPieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ProfitTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5 flex-1">
                  {profitPieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-[10px] text-slate-600 truncate max-w-[100px]">{d.name}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-800 tabular-nums">{fmt(d.value)}</span>
                    </div>
                  ))}
                  <div className="pt-1 border-t border-slate-100 mt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500">Net Annual Profit</span>
                      <span className="text-xs font-bold text-emerald-600">{fmt(projectedAnnualProfit)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-[10px] text-slate-500">Margin</span>
                      <span className="text-[10px] font-semibold text-slate-700">{fmtPct(noiMarginPct)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {profitPieData.map((d) => (
                  <span key={d.name} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-slate-50 text-slate-600 border border-slate-100">
                    {d.name.split(" ")[0]}: {fmtPct(avgGrossIncome > 0 ? (d.value / avgGrossIncome) * 100 : 0)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Breakeven Analysis */}
          {loading ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                  <div style={{ color: "#F59E0B" }}><Target className="w-4 h-4" /></div>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Breakeven Analysis</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Monthly Breakeven", value: fmtFull(breakevenMonthly) },
                  { label: "Current Net Cashflow", value: fmtFull(currentMonthCashflow) },
                  {
                    label: "Safety Margin",
                    value: (
                      <span className={safetyMarginPct >= 0 ? "text-emerald-600" : "text-red-600"}>
                        {fmtPct(safetyMarginPct)}
                      </span>
                    ),
                  },
                  {
                    label: "Breakeven Month",
                    value: breakevenMonth > 0 ? `Month ${breakevenMonth}` : "N/A",
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5 bg-slate-50 rounded-xl px-3 py-2">
                    <span className="text-[10px] text-slate-400 font-medium">{label}</span>
                    <span className="text-sm font-bold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Summary */}
          {loading ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                    <div style={{ color: "#EF4444" }}><AlertTriangle className="w-4 h-4" /></div>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Risk Summary</h3>
                </div>
                <Link
                  href={`/app/planning/sets/${id}/risk`}
                  className="text-[11px] text-[#7C3AED] hover:underline font-medium flex items-center gap-0.5"
                >
                  Full risk report
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-slate-500">Overall risk:</span>
                <RiskPill level={set?.risk_level ?? "Low"} />
                <span className="text-[10px] text-slate-400 ml-1">Score {set?.risk_score ?? 0}/100</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Market Risk", risk: marketRisk },
                  { label: "Financial Risk", risk: financialRisk },
                  { label: "Regulatory Risk", risk: regulatoryRisk },
                  { label: "Operational Risk", risk: operationalRisk },
                ].map(({ label, risk }) => (
                  <div key={label} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-1.5">
                    <span className="text-[10px] text-slate-500">{label}</span>
                    <RiskPill level={risk?.likelihood === "very_high" || risk?.impact === "very_high" ? "High" : risk ? "Medium" : "Low"} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────────────────────── */}
        <div className="w-[280px] flex-shrink-0 flex flex-col gap-4">

          {/* AI Insight Card */}
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="rounded-2xl border border-violet-200 shadow-sm p-5 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #EDE9FE 0%, #F5F3FF 60%, #EFF6FF 100%)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-violet-900">AI Insight</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-violet-200 text-violet-700 px-2 py-0.5 rounded-full">
                  BETA
                </span>
              </div>

              {aiReview ? (
                <>
                  <p className="text-xs text-violet-800 leading-relaxed mb-3">
                    {aiReview.recommendation ??
                      "This plan shows solid fundamentals. Review the risk factors to optimise your return profile."}
                  </p>
                  {aiReview.strengths?.slice(0, 2).map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 mb-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] text-violet-900">{s}</span>
                    </div>
                  ))}
                  {aiReview.weaknesses?.slice(0, 2).map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5 mb-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] text-violet-900">{w}</span>
                    </div>
                  ))}
                  <p className="text-[10px] font-semibold text-violet-700 mt-2 bg-violet-100 rounded-lg px-2 py-1">
                    Overall Score: {aiReview.overall_score}/100
                  </p>
                </>
              ) : (
                <p className="text-xs text-violet-700 leading-relaxed">
                  No AI review available yet. Complete your assumptions and run an AI review to unlock insights.
                </p>
              )}

              <button className="mt-3 w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors">
                Ask AI a question
              </button>
            </div>
          )}

          {/* Key Assumptions Snapshot */}
          {loading ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Key Assumptions</h3>
                <Link
                  href={`/app/planning/sets/${id}/assumptions`}
                  className="text-[11px] text-[#7C3AED] hover:underline font-medium flex items-center gap-0.5"
                >
                  View all
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {keyAssumptions.map((ka) => (
                  <div key={ka.label} className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">{ka.label}</span>
                    <span className="text-[11px] font-semibold text-slate-800">
                      {ka.value != null
                        ? `${ka.rawUnit === "£" ? "£" : ""}${ka.value.toLocaleString("en-GB")}${
                            ka.rawUnit !== "£" ? ka.rawUnit : ""
                          }`
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Important Notes */}
          {loading ? (
            <Skeleton className="h-36 w-full" />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Pinned Notes</h3>
                <Link
                  href={`/app/planning/sets/${id}/activity`}
                  className="text-[11px] text-[#7C3AED] hover:underline font-medium flex items-center gap-0.5"
                >
                  View all
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {(data?.notes ?? []).length > 0 ? (
                <div className="flex flex-col gap-2">
                  {(data?.notes ?? []).map((note) => (
                    <div key={note.id} className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                      <p className="text-[11px] text-slate-700 leading-relaxed line-clamp-2">{note.body}</p>
                      <p className="text-[9px] text-slate-400 mt-1">{relDate(note.created_at)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No pinned notes.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── C. Bottom row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Activity */}
        {loading ? (
          <Skeleton className="h-48" />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center">
                  <div style={{ color: "#64748B" }}><Clock className="w-3.5 h-3.5" /></div>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
              </div>
              <Link
                href={`/app/planning/sets/${id}/activity`}
                className="text-[11px] text-[#7C3AED] hover:underline font-medium flex items-center gap-0.5"
              >
                View all
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {(data?.activity ?? []).length > 0 ? (
              <div className="flex flex-col gap-3">
                {(data?.activity ?? []).map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{act.title}</p>
                      {act.description && (
                        <p className="text-[11px] text-slate-500 truncate">{act.description}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">{relDate(act.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No activity yet.</p>
            )}
          </div>
        )}

        {/* Upcoming Tasks */}
        {loading ? (
          <Skeleton className="h-48" />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center">
                  <div style={{ color: "#2563EB" }}><CheckCircle2 className="w-3.5 h-3.5" /></div>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Upcoming Tasks</h3>
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7C3AED] hover:underline">
                  <Plus className="w-3 h-3" />
                  Add task
                </button>
                <Link
                  href={`/app/planning/sets/${id}/tasks`}
                  className="text-[11px] text-[#7C3AED] hover:underline font-medium flex items-center gap-0.5"
                >
                  View all
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
            {(data?.tasks ?? []).length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {(data?.tasks ?? []).map((task) => {
                  const dd = dueDateLabel(task.due_date)
                  return (
                    <div key={task.id} className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded border-2 border-slate-300 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{task.title}</p>
                        {task.owner_name && (
                          <p className="text-[10px] text-slate-400">{task.owner_name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${dd.cls}`}>
                          {dd.label}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${priorityMap[task.priority] ?? "bg-slate-100 text-slate-500"}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No upcoming tasks.</p>
            )}
          </div>
        )}

        {/* AI Recommendation */}
        {loading ? (
          <Skeleton className="h-48" />
        ) : (
          <div className="rounded-2xl border border-violet-200 shadow-sm p-5"
            style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EFF6FF 100%)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-violet-900">AI Recommendation</h3>
            </div>
            <p className="text-xs text-violet-800 leading-relaxed mb-4">
              {aiReview?.suggestions?.[0] ??
                "Consider running a stress-test scenario to understand your downside risk exposure before proceeding to offer stage."}
            </p>
            <div className="flex gap-2">
              <Link
                href={`/app/planning/sets/${id}/scenarios`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors"
              >
                Run scenario
                <ArrowRight className="w-3 h-3" />
              </Link>
              <Link
                href={`/app/planning/sets/${id}/ai-review`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-300 text-violet-700 text-xs font-medium hover:bg-violet-50 transition-colors"
              >
                View AI review
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
