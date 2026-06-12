"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  AlertTriangle,
  Pencil,
  Trash2,
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  Zap,
  ShieldCheck,
  Droplets,
  Wrench,
  Building,
  ReceiptText,
  Home,
  DollarSign,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { PlanningExpenseLine } from "@/lib/planning/types"

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExpenseRow {
  id: string
  category: string
  type: "Recurring" | "One-off"
  frequency: string
  monthly: number
  annual: number
  budget: number
  variance: number
  variancePct: number
  supplier?: string
  escalation?: string
  startDate?: string
  nextReview?: string
}

// ── Static seed data (merged with live DB rows) ───────────────────────────────

const SEED_ROWS: ExpenseRow[] = [
  { id: "seed-1", category: "Management Fees", type: "Recurring", frequency: "Monthly", monthly: 750, annual: 9000, budget: 8800, variance: 200, variancePct: 2.3, supplier: "Propvora PM Ltd", escalation: "RPI", startDate: "01 Jan 2024", nextReview: "01 Jan 2025" },
  { id: "seed-2", category: "Repairs & Maintenance", type: "Recurring", frequency: "Monthly", monthly: 560, annual: 6720, budget: 6000, variance: 720, variancePct: 12.0, supplier: "Natts Maintenance Ltd", escalation: "Fixed", startDate: "01 Jan 2024", nextReview: "01 Jan 2025" },
  { id: "seed-3", category: "Insurance", type: "Recurring", frequency: "Monthly", monthly: 375, annual: 4500, budget: 4200, variance: 300, variancePct: 7.1, supplier: "Aviva Policy", escalation: "CPI", startDate: "01 Jan 2024", nextReview: "01 Jun 2025" },
  { id: "seed-4", category: "Utilities Allocations", type: "Recurring", frequency: "Monthly", monthly: 820, annual: 9840, budget: 9600, variance: 240, variancePct: 2.5, supplier: "Internal Allocation", escalation: "Fixed", startDate: "01 Jan 2024", nextReview: "01 Jan 2025" },
  { id: "seed-5", category: "Cleaning", type: "Recurring", frequency: "Monthly", monthly: 380, annual: 4560, budget: 4200, variance: 360, variancePct: 8.6, supplier: "CleanCo Ltd", escalation: "Fixed", startDate: "01 Jan 2024", nextReview: "01 Jan 2025" },
  { id: "seed-6", category: "Licensing & Compliance", type: "Recurring", frequency: "Monthly", monthly: 150, annual: 1800, budget: 1800, variance: 0, variancePct: 0, supplier: "Local Council", escalation: "None", startDate: "01 Jan 2024", nextReview: "01 Jan 2026" },
  { id: "seed-7", category: "Void Provisions", type: "Recurring", frequency: "Monthly", monthly: 600, annual: 7200, budget: 6600, variance: 600, variancePct: 9.1, supplier: "Provision Fund", escalation: "RPI", startDate: "01 Jan 2024", nextReview: "01 Jan 2025" },
  { id: "seed-8", category: "Finance Costs", type: "Recurring", frequency: "Monthly", monthly: 510, annual: 6120, budget: 6000, variance: 120, variancePct: 2.0, supplier: "HSBC Business", escalation: "Base Rate", startDate: "01 Feb 2024", nextReview: "01 Feb 2025" },
  { id: "seed-9", category: "One-off Costs (Amortised)", type: "One-off", frequency: "One-off", monthly: 333, annual: 4000, budget: 4000, variance: 0, variancePct: 0, supplier: "Refurb Fund", escalation: "None", startDate: "01 Mar 2024", nextReview: "—" },
]

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Management Fees": <Building className="w-3.5 h-3.5" />,
  "Repairs & Maintenance": <Wrench className="w-3.5 h-3.5" />,
  "Insurance": <ShieldCheck className="w-3.5 h-3.5" />,
  "Utilities Allocations": <Droplets className="w-3.5 h-3.5" />,
  "Cleaning": <Home className="w-3.5 h-3.5" />,
  "Licensing & Compliance": <ReceiptText className="w-3.5 h-3.5" />,
  "Void Provisions": <DollarSign className="w-3.5 h-3.5" />,
  "Finance Costs": <TrendingDown className="w-3.5 h-3.5" />,
  "One-off Costs (Amortised)": <Zap className="w-3.5 h-3.5" />,
}

const BAR_COLORS = [
  "#7C3AED", "#2563EB", "#10B981", "#F59E0B", "#EF4444",
  "#06B6D4", "#8B5CF6", "#F97316", "#84CC16",
]

// ── Trend chart data ──────────────────────────────────────────────────────────

const MONTHS = ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"]

function generateTrendData() {
  return MONTHS.map((month, i) => ({
    month,
    "Management": 750 + (i % 8) * 10 - 35,
    "Repairs": 540 + (i % 12) * 10 - 55,
    "Insurance": 375,
    "Utilities": 800 + (i % 6) * 10 - 25,
    "Cleaning": 380,
    "Finance": 510,
    "Other": 1080 + (i % 10) * 10 - 45,
  }))
}

const TREND_DATA = generateTrendData()

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

function fmtDec(n: number, dp = 1) {
  return n.toFixed(dp)
}

function varianceColor(v: number, pct: number) {
  if (v === 0) return "text-slate-500"
  if (pct >= 10) return "text-red-600"
  if (pct > 0) return "text-amber-600"
  return "text-emerald-600"
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, trend, trendLabel, chip, chipColor,
}: {
  label: string
  value: string
  trend?: "up" | "down" | "flat"
  trendLabel?: string
  chip?: string
  chipColor?: "amber" | "red" | "emerald"
}) {
  const trendIcon =
    trend === "up" ? <TrendingUp className="w-3 h-3" /> :
    trend === "down" ? <TrendingDown className="w-3 h-3" /> :
    <Minus className="w-3 h-3" />
  const trendStyle =
    trend === "up" ? "text-red-500" :
    trend === "down" ? "text-emerald-500" :
    "text-slate-400"
  const chipBg =
    chipColor === "amber" ? "bg-amber-100 text-amber-700" :
    chipColor === "red" ? "bg-red-100 text-red-700" :
    "bg-emerald-100 text-emerald-700"

  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex flex-col gap-1.5 min-w-0">
      <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
      <p className="text-xl font-bold text-slate-900 truncate">{value}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {trendLabel && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trendStyle}`}>
            {trendIcon} {trendLabel}
          </span>
        )}
        {chip && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${chipBg}`}>
            {chip}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [dbRows, setDbRows] = useState<PlanningExpenseLine[]>([])
  const [loading, setLoading] = useState(true)
  const [chartMode, setChartMode] = useState<"monthly" | "cumulative">("monthly")
  const [registerFilter, setRegisterFilter] = useState<"all" | "recurring" | "one-off">("all")
  const [registerSearch, setRegisterSearch] = useState("")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 5

  // ── Fetch DB ────────────────────────────────────────────────────────────────

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("planning_expense_lines")
      .select("*")
      .eq("planning_set_id", id)
      .order("created_at")
    setDbRows((data ?? []) as PlanningExpenseLine[])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete(rowId: string) {
    if (!rowId.startsWith("seed-")) {
      const supabase = createClient()
      await supabase.from("planning_expense_lines").delete().eq("id", rowId)
      setDbRows(prev => prev.filter(r => r.id !== rowId))
    }
  }

  // ── Computed rows ───────────────────────────────────────────────────────────

  const allRows: ExpenseRow[] = [
    ...SEED_ROWS,
    ...dbRows.map(r => ({
      id: r.id,
      category: r.label,
      type: (r.frequency === "one_off" ? "One-off" : "Recurring") as "Recurring" | "One-off",
      frequency: r.frequency === "one_off" ? "One-off" : r.frequency === "weekly" ? "Weekly" : r.frequency === "annual" ? "Annual" : "Monthly",
      monthly: r.frequency === "monthly" ? r.amount : r.frequency === "weekly" ? r.amount * 52 / 12 : r.frequency === "annual" ? r.amount / 12 : r.amount / 12,
      annual: r.frequency === "annual" ? r.amount : r.frequency === "one_off" ? r.amount : r.amount * 12,
      budget: r.amount,
      variance: 0,
      variancePct: 0,
      supplier: r.notes ?? undefined,
    })),
  ]

  const totalMonthly = allRows.reduce((s, r) => s + r.monthly, 0)
  const totalAnnual = allRows.reduce((s, r) => s + r.annual, 0)
  const totalBudget = allRows.reduce((s, r) => s + r.budget, 0)
  const totalVariance = allRows.reduce((s, r) => s + r.variance, 0)
  const totalVariancePct = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0

  // Cumulative trend
  const chartData = chartMode === "cumulative"
    ? TREND_DATA.map((d, i) => {
        const prev = i === 0 ? {} : TREND_DATA.slice(0, i).reduce((acc, row) => {
          Object.keys(row).filter(k => k !== "month").forEach(k => { (acc as Record<string, number>)[k] = ((acc as Record<string, number>)[k] ?? 0) + (row as unknown as Record<string, number>)[k] })
          return acc
        }, {} as Record<string, number>)
        return Object.keys(d).reduce((acc, k) => {
          (acc as Record<string, unknown>)[k] = k === "month" ? d.month : (d as unknown as Record<string, number>)[k] + ((prev as Record<string, number>)[k] ?? 0)
          return acc
        }, {} as Record<string, unknown>)
      })
    : TREND_DATA

  // Register
  const filteredRegister = allRows.filter(r => {
    const matchType =
      registerFilter === "all" ? true :
      registerFilter === "recurring" ? r.type === "Recurring" :
      r.type === "One-off"
    const matchSearch = registerSearch === "" || r.category.toLowerCase().includes(registerSearch.toLowerCase()) || (r.supplier ?? "").toLowerCase().includes(registerSearch.toLowerCase())
    return matchType && matchSearch
  })
  const totalPages = Math.max(1, Math.ceil(filteredRegister.length / PAGE_SIZE))
  const pagedRegister = filteredRegister.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // chart avg
  const chartMonthlyAvg = Math.round(totalMonthly)
  const chartAnnualYTD = Math.round(totalAnnual * 0.25)
  const chartBudgetYTD = Math.round(totalBudget * 0.25)
  const chartVarianceYTD = chartAnnualYTD - chartBudgetYTD

  return (
    <div className="flex flex-col gap-6">

      {/* ── Inner tab switcher 5A / 5B ── */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        <button className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#7C3AED] text-white transition-colors">
          5A Expenses
        </button>
        <button
          onClick={() => router.push(`/app/planning/sets/${id}/bills`)}
          className="px-4 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          5B Bills
        </button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <KpiCard label="Total OPEX (Annual)" value={fmt(totalAnnual)} trend="up" trendLabel="+4.2% YoY" />
        <KpiCard label="Monthly Bills (Est.)" value={fmt(totalMonthly)} trend="up" trendLabel="+2.1% MoM" />
        <KpiCard
          label="Cost Variance (YTD)"
          value={fmt(totalVariance)}
          chip={totalVariance > 0 ? "Over Budget ⚠" : undefined}
          chipColor={totalVariance > 0 ? "amber" : undefined}
          trendLabel={totalVariance > 0 ? `+${fmtDec(totalVariancePct)}% vs budget` : undefined}
        />
        <KpiCard label="Utilities Burden" value="6.2%" trend="up" trendLabel="+0.4pp MoM" />
        <KpiCard label="EBITDA Margin" value="38.4%" trend="down" trendLabel="-1.2pp YoY" />
      </div>

      {/* ── 2-column layout ── */}
      <div className="flex flex-col xl:flex-row gap-5">

        {/* ── Left column ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">

          {/* ── Section header ── */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Section 5A — Expenses</h2>
              <p className="text-xs text-slate-500 mt-0.5">Operating expense summary and budget variance</p>
            </div>
          </div>

          {/* ── OPEX Summary Table ── */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Operating Expenses — Monthly View</h3>
              <span className="text-xs text-slate-400">12-month rolling</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 font-medium uppercase tracking-wide">
                    <th className="px-4 py-2.5 text-left">Category</th>
                    <th className="px-4 py-2.5 text-left">Type</th>
                    <th className="px-4 py-2.5 text-left">Frequency</th>
                    <th className="px-4 py-2.5 text-right">Monthly (£)</th>
                    <th className="px-4 py-2.5 text-right">Annual (£)</th>
                    <th className="px-4 py-2.5 text-right">Budget (£)</th>
                    <th className="px-4 py-2.5 text-right">Variance</th>
                    <th className="px-4 py-2.5 text-right">Var %</th>
                    <th className="px-4 py-2.5 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SEED_ROWS.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0"
                            style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}
                          >
                            {CATEGORY_ICONS[row.category] ?? <ReceiptText className="w-3.5 h-3.5" />}
                          </div>
                          <span className="text-xs font-medium text-slate-800">{row.category}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{row.type}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{row.frequency}</td>
                      <td className="px-4 py-3 text-xs text-right font-medium text-slate-800">{fmt(row.monthly)}</td>
                      <td className="px-4 py-3 text-xs text-right text-slate-700">{fmt(row.annual)}</td>
                      <td className="px-4 py-3 text-xs text-right text-slate-600">{fmt(row.budget)}</td>
                      <td className={`px-4 py-3 text-xs text-right font-medium ${varianceColor(row.variance, row.variancePct)}`}>
                        {row.variance > 0 ? `+${fmt(row.variance)}` : row.variance < 0 ? fmt(row.variance) : "£0"}
                      </td>
                      <td className={`px-4 py-3 text-xs text-right font-semibold ${varianceColor(row.variance, row.variancePct)}`}>
                        {row.variancePct > 0 ? `+${fmtDec(row.variancePct)}%` : `${fmtDec(row.variancePct)}%`}
                        {row.variancePct >= 8 && <span className="ml-0.5">▲</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                          <Pencil className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* DB rows */}
                  {!loading && dbRows.map(r => {
                    const monthly = r.frequency === "monthly" ? r.amount : r.frequency === "weekly" ? r.amount * 52 / 12 : r.frequency === "annual" ? r.amount / 12 : r.amount / 12
                    const annual = r.frequency === "annual" || r.frequency === "one_off" ? r.amount : r.amount * 12
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: "#DBEAFE", color: "#2563EB" }}
                            >
                              <ReceiptText className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-medium text-slate-800">{r.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{r.frequency === "one_off" ? "One-off" : "Recurring"}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 capitalize">{r.frequency.replace("_", "-")}</td>
                        <td className="px-4 py-3 text-xs text-right font-medium text-slate-800">{fmt(monthly)}</td>
                        <td className="px-4 py-3 text-xs text-right text-slate-700">{fmt(annual)}</td>
                        <td className="px-4 py-3 text-xs text-right text-slate-600">{fmt(r.amount)}</td>
                        <td className="px-4 py-3 text-xs text-right text-slate-500">—</td>
                        <td className="px-4 py-3 text-xs text-right text-slate-500">—</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}

                  {/* TOTAL row */}
                  <tr className="bg-slate-50 font-bold border-t border-slate-200">
                    <td className="px-4 py-3 text-xs text-slate-900" colSpan={3}>TOTAL</td>
                    <td className="px-4 py-3 text-xs text-right text-slate-900">{fmt(totalMonthly)}</td>
                    <td className="px-4 py-3 text-xs text-right text-slate-900">{fmt(totalAnnual)}</td>
                    <td className="px-4 py-3 text-xs text-right text-slate-700">{fmt(totalBudget)}</td>
                    <td className={`px-4 py-3 text-xs text-right ${totalVariance > 0 ? "text-red-600" : "text-slate-900"}`}>
                      {totalVariance > 0 ? `+${fmt(totalVariance)}` : fmt(totalVariance)}
                    </td>
                    <td className={`px-4 py-3 text-xs text-right ${totalVariance > 0 ? "text-red-600" : "text-slate-900"}`}>
                      {totalVariancePct > 0 ? `+${fmtDec(totalVariancePct)}%` : `${fmtDec(totalVariancePct)}%`}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── OPEX Trend Chart ── */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-sm font-semibold text-slate-800">OPEX Trend — Last 12 Months</h3>
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                {(["monthly", "cumulative"] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setChartMode(m)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${chartMode === m ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-5 py-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData as Record<string, unknown>[]} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `£${(v / 1000).toFixed(1)}k`} />
                  <Tooltip formatter={(value: unknown) => fmt(Number(value))} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                  {["Management", "Repairs", "Insurance", "Utilities", "Cleaning", "Finance", "Other"].map((key, i) => (
                    <Bar key={key} dataKey={key} stackId="a" fill={BAR_COLORS[i % BAR_COLORS.length]} radius={i === 6 ? [3, 3, 0, 0] : undefined} />
                  ))}
                </BarChart>
              </ResponsiveContainer>

              {/* Chart summary row */}
              <div className="mt-4 grid grid-cols-5 gap-3 border-t border-slate-100 pt-3">
                {[
                  { label: "Monthly Avg", value: fmt(chartMonthlyAvg) },
                  { label: "Annual Total YTD", value: fmt(chartAnnualYTD) },
                  { label: "Budget YTD", value: fmt(chartBudgetYTD) },
                  { label: "Variance YTD", value: fmt(Math.abs(chartVarianceYTD)), color: chartVarianceYTD > 0 ? "text-red-600" : "text-emerald-600" },
                  { label: "Variance %", value: `${chartBudgetYTD > 0 ? fmtDec((chartVarianceYTD / chartBudgetYTD) * 100) : "0.0"}%`, color: chartVarianceYTD > 0 ? "text-red-600" : "text-emerald-600" },
                ].map(c => (
                  <div key={c.label} className="text-center">
                    <p className="text-[10px] text-slate-400 font-medium">{c.label}</p>
                    <p className={`text-sm font-bold mt-0.5 ${c.color ?? "text-slate-800"}`}>{c.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Expense Register ── */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-sm font-semibold text-slate-800">Expense Register</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {(["all", "recurring", "one-off"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => { setRegisterFilter(f); setPage(1) }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${registerFilter === f ? "bg-[#7C3AED] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  >
                    {f}
                  </button>
                ))}
                <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl px-3 py-1.5">
                  <div style={{ color: "#94A3B8" }}><Search className="w-3.5 h-3.5" /></div>
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={registerSearch}
                    onChange={e => { setRegisterSearch(e.target.value); setPage(1) }}
                    className="bg-transparent text-xs outline-none w-36 placeholder:text-slate-400 text-slate-700"
                  />
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition-colors">
                  <div style={{ color: "#94A3B8" }}><Filter className="w-3.5 h-3.5" /></div>
                  Filters
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 font-medium uppercase tracking-wide">
                    <th className="px-4 py-2.5 text-left">Expense</th>
                    <th className="px-4 py-2.5 text-left">Type</th>
                    <th className="px-4 py-2.5 text-left">Supplier / Ref</th>
                    <th className="px-4 py-2.5 text-left">Frequency</th>
                    <th className="px-4 py-2.5 text-left">Start Date</th>
                    <th className="px-4 py-2.5 text-right">Monthly (£)</th>
                    <th className="px-4 py-2.5 text-right">Annual (£)</th>
                    <th className="px-4 py-2.5 text-left">Escalation</th>
                    <th className="px-4 py-2.5 text-left">Next Review</th>
                    <th className="px-4 py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedRegister.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-medium text-slate-800">{row.category}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${row.type === "Recurring" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{row.supplier ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{row.frequency}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{row.startDate ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-right font-medium text-slate-800">{fmt(row.monthly)}</td>
                      <td className="px-4 py-3 text-xs text-right text-slate-700">{fmt(row.annual)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{row.escalation ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{row.nextReview ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pagedRegister.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-xs text-slate-400">No expenses match your filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filteredRegister.length)} to {Math.min(page * PAGE_SIZE, filteredRegister.length)} of {filteredRegister.length} expenses
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page === n ? "bg-[#7C3AED] text-white" : "border border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="w-full xl:w-[300px] flex-shrink-0 flex flex-col gap-4">

          {/* Alerts card */}
          <div className="bg-white rounded-2xl border border-amber-300 overflow-hidden">
            <div className="px-4 py-3 border-b border-amber-100 flex items-center gap-2">
              <div style={{ color: "#F59E0B" }}><AlertTriangle className="w-4 h-4" /></div>
              <h3 className="text-sm font-semibold text-slate-800">Alerts &amp; Flags</h3>
            </div>
            <div className="px-4 py-3 flex flex-col gap-2.5">
              {[
                { msg: "2 bills overdue", color: "text-red-600", dot: "bg-red-500" },
                { msg: "Repairs & Maintenance 12.0% over budget", color: "text-amber-700", dot: "bg-amber-500" },
                { msg: "Utilities burden 6.2% above target (< 6%)", color: "text-amber-700", dot: "bg-amber-500" },
                { msg: "Void provisions high — 9.1% of rental income", color: "text-amber-700", dot: "bg-amber-500" },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.dot}`} />
                  <p className={`text-xs font-medium ${a.color}`}>{a.msg}</p>
                </div>
              ))}
              <button className="mt-1 text-xs font-semibold text-[#7C3AED] hover:underline text-left">
                View all alerts →
              </button>
            </div>
          </div>

          {/* AI card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)" }}>
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
              <div style={{ color: "#C4B5FD" }}><Sparkles className="w-4 h-4" /></div>
              <h3 className="text-sm font-semibold text-white">AI Cost Optimisation</h3>
            </div>
            <div className="px-4 py-3 flex flex-col gap-3">
              <p className="text-xs text-violet-200 leading-relaxed">
                AI has analysed your costs and found <span className="text-white font-bold">£4,162 annual savings</span> (3.8% of total OPEX)
              </p>
              {[
                { label: "Switch electricity supplier", save: "£720/yr" },
                { label: "Optimise insurance cover", save: "£1,176/yr" },
                { label: "Water tariff review", save: "£420/yr" },
                { label: "Reduce void buffer", save: "£2,410/yr" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <p className="text-xs text-violet-100 leading-tight flex-1">{s.label}</p>
                  <span className="text-xs font-bold text-emerald-300 flex-shrink-0">Save {s.save}</span>
                </div>
              ))}
              <button className="mt-1 w-full py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors border border-white/20">
                Review recommendations
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
