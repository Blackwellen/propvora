"use client"

import { useParams } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Pencil,
  Plus,
  MoreHorizontal,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Info,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import type { PlanningIncomeLine, PlanningUnitRoom } from "@/lib/planning/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, compact = false): string {
  if (compact && n >= 1000) {
    return "£" + (n / 1000).toFixed(1).replace(/\.0$/, "") + "k"
  }
  return "£" + n.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function pct(a: number, total: number): string {
  if (!total) return "0%"
  return ((a / total) * 100).toFixed(1) + "%"
}

function annualFromLine(line: PlanningIncomeLine): number {
  const freq = line.frequency
  const base = line.amount * line.quantity
  if (freq === "monthly") return base * 12
  if (freq === "weekly") return base * 52
  if (freq === "annual") return base
  if (freq === "one_off") return base
  return base * 12
}

const CATEGORY_COLOURS: Record<string, string> = {
  "Rental Income (Rooms)": "#2563EB",
  "Rental Income (Studios)": "#7C3AED",
  "Ancillary Income": "#10B981",
  "Parking Income": "#F59E0B",
  "Storage Income": "#F97316",
  "Utilities Recharges": "#06B6D4",
  "Other Income": "#8B5CF6",
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const SCENARIO_OPTIONS = ["Base", "Optimistic", "Conservative", "Stress"]
const VIEW_OPTIONS = ["Gross", "Net"]
const PERIOD_OPTIONS = ["Annual", "Monthly"]

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  chip?: { text: string; colour: "blue" | "violet" | "emerald" | "amber" | "red" | "slate" }
  trend?: "up" | "down"
}

function KpiCard({ label, value, sub, chip, trend }: KpiCardProps) {
  const chipCls: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-600",
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-1.5 min-w-0">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-[22px] font-bold text-slate-900 leading-none">{value}</p>
        {trend === "up" && (
          <div style={{ color: "#10B981" }}>
            <TrendingUp className="w-4 h-4" />
          </div>
        )}
        {trend === "down" && (
          <div style={{ color: "#EF4444" }}>
            <TrendingDown className="w-4 h-4" />
          </div>
        )}
      </div>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
      {chip && (
        <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit ${chipCls[chip.colour]}`}>
          {chip.text}
        </span>
      )}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-lg ${className ?? ""}`} />
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function IncomePage() {
  const { id } = useParams<{ id: string }>()

  const [incomeLines, setIncomeLines] = useState<PlanningIncomeLine[]>([])
  const [rooms, setRooms] = useState<PlanningUnitRoom[]>([])
  const [loading, setLoading] = useState(true)

  const [scenario, setScenario] = useState("Base")
  const [revenueView, setRevenueView] = useState("Gross")
  const [period, setPeriod] = useState("Annual")
  const [year, setYear] = useState(1)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [chartMode, setChartMode] = useState<"monthly" | "cumulative">("monthly")

  useEffect(() => {
    if (!id) return
    const sb = createClient()
    Promise.all([
      sb.from("planning_income_lines").select("*").eq("planning_set_id", id).order("created_at"),
      sb.from("planning_units_rooms").select("*").eq("planning_set_id", id).order("sort_order"),
    ]).then(([incRes, rmRes]) => {
      setIncomeLines((incRes.data ?? []) as PlanningIncomeLine[])
      setRooms((rmRes.data ?? []) as PlanningUnitRoom[])
      setLoading(false)
    })
  }, [id])

  // ── Derived calculations ───────────────────────────────────────────────────

  const grossAnnual = useMemo(() => incomeLines.reduce((s, l) => s + annualFromLine(l), 0), [incomeLines])
  const vacancyPct = 0.08
  const badDebtPct = 0.02
  const concessionPct = 0.01
  const vacancyLoss = grossAnnual * vacancyPct
  const badDebt = grossAnnual * badDebtPct
  const concession = grossAnnual * concessionPct
  const netIncome = grossAnnual - vacancyLoss - badDebt - concession
  const netRecoveryPct = grossAnnual ? (netIncome / grossAnnual) * 100 : 88

  const rentableRooms = rooms.filter((r) => r.rentable)
  const avgRentPcm = rentableRooms.length
    ? rentableRooms.reduce((s, r) => s + r.target_rent_pcm, 0) / rentableRooms.length
    : 0

  const occupancyLinkedIncome = grossAnnual * (1 - vacancyPct)
  const upsideOpportunity = grossAnnual * 0.07

  const donutData = useMemo(() => {
    const grouped: Record<string, number> = {}
    incomeLines.forEach((l) => {
      const cat = l.label || "Other Income"
      grouped[cat] = (grouped[cat] ?? 0) + annualFromLine(l)
    })
    return Object.entries(grouped).map(([name, value]) => ({ name, value }))
  }, [incomeLines])

  const monthlyChartData = useMemo(() => {
    const base = grossAnnual / 12
    return MONTHS.map((m, i) => {
      const multiplier = 0.9 + Math.sin((i / 12) * Math.PI * 2) * 0.08
      return {
        month: m,
        gross: Math.round(base * multiplier),
        net: Math.round(base * multiplier * (1 - vacancyPct - badDebtPct - concessionPct)),
      }
    })
  }, [grossAnnual])

  const cumulativeChartData = useMemo(() => {
    let cum = 0
    return monthlyChartData.map((d) => {
      cum += d.gross
      return { ...d, cumulative: cum }
    })
  }, [monthlyChartData])

  const occupancyData = useMemo(() =>
    MONTHS.map((m, i) => ({
      month: m,
      occupancy: 88 + Math.sin((i / 12) * Math.PI * 2) * 6,
      multiplier: (0.92 + Math.sin((i / 12) * Math.PI * 2) * 0.06) * 100,
    })), [])

  const yearTable = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => {
      const growth = Math.pow(1.03, i)
      const gross = grossAnnual * growth
      const vacancy = gross * vacancyPct
      const net = gross - vacancy - gross * badDebtPct - gross * concessionPct
      return {
        year: i + 1,
        gross,
        vacancy,
        net,
        yoy: i === 0 ? null : 3.0,
      }
    }), [grossAnnual])

  const incomeRows = [
    { cat: "Rental Income (Rooms)", status: "Active", units: "12 Rooms", basis: "PCM" },
    { cat: "Rental Income (Studios)", status: "Active", units: "1 Unit", basis: "PCM" },
    { cat: "Ancillary Income", status: "Active", units: "Various", basis: "Various" },
    { cat: "Parking Income", status: "Active", units: "4 Spaces", basis: "PCM" },
    { cat: "Storage Income", status: "Active", units: "6 Lockers", basis: "PCM" },
    { cat: "Utilities Recharges", status: "Active", units: "12 Rooms", basis: "PCM" },
    { cat: "Other Income", status: "Active", units: "One-off", basis: "One-off" },
  ]

  const unitTypes: { label: string; type: string; colour: string }[] = [
    { label: "Rooms", type: "ensuite", colour: "#2563EB" },
    { label: "Studios", type: "studio", colour: "#7C3AED" },
    { label: "Parking", type: "standard", colour: "#F59E0B" },
    { label: "Storage", type: "bathroom", colour: "#10B981" },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-12" />
        <Skeleton className="h-64" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Skeleton className="h-72 xl:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── A. KPI Strip ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard
          label="Gross Annual Income"
          value={fmt(grossAnnual)}
          trend="up"
        />
        <KpiCard
          label="Net Income Contribution"
          value={fmt(netIncome)}
          sub={`${pct(netIncome, grossAnnual)} of Gross Income`}
          trend="up"
        />
        <KpiCard
          label="Avg Rent / Room (PCM)"
          value={fmt(avgRentPcm)}
          chip={{ text: "−3% vs Benchmark", colour: "amber" }}
        />
        <KpiCard
          label="Occupancy-Linked Income"
          value={fmt(occupancyLinkedIncome)}
          sub={`${pct(occupancyLinkedIncome, grossAnnual)} of Gross Income`}
        />
        <KpiCard
          label="Revenue Upside Opportunity"
          value={fmt(upsideOpportunity)}
          chip={{ text: "+7% vs Base", colour: "emerald" }}
        />
      </div>

      {/* ── B. Controls Bar ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3 flex flex-wrap items-center gap-3">
        {[
          { label: "Scenario", options: SCENARIO_OPTIONS, value: scenario, set: setScenario },
          { label: "Revenue View", options: VIEW_OPTIONS, value: revenueView, set: setRevenueView },
          { label: "Period", options: PERIOD_OPTIONS, value: period, set: setPeriod },
        ].map(({ label, options, value, set }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">{label}:</span>
            <div className="relative">
              <select
                value={value}
                onChange={(e) => set(e.target.value)}
                className="appearance-none text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg pl-2.5 pr-6 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
        ))}

        {/* Year selector */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setYear((y) => Math.max(1, y - 1))}
            className="p-1 rounded hover:bg-slate-100 text-slate-500"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold text-slate-700 min-w-[36px] text-center">Year {year}</span>
          <button
            onClick={() => setYear((y) => Math.min(5, y + 1))}
            className="p-1 rounded hover:bg-slate-100 text-slate-500"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
            <AlertTriangle className="w-3 h-3" />
            2 Validation Issues
          </span>
          <button className="p-1 rounded hover:bg-slate-100 text-slate-400">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── C. Income Streams + Donut ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Income Streams Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Income streams</p>
              <p className="text-xs text-slate-400 mt-0.5">Expand categories to view details. All values editable.</p>
            </div>
            <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Add Income Category
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 min-w-[180px]">Income Category</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Status</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Units</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Pricing Basis</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-slate-500">
                    <button className="inline-flex items-center gap-0.5 hover:text-slate-700">Avg. Rate <ChevronUp className="w-3 h-3" /></button>
                  </th>
                  <th className="text-right px-3 py-2.5 font-semibold text-slate-500">
                    <button className="inline-flex items-center gap-0.5 hover:text-slate-700">Occ. / Util. <ChevronUp className="w-3 h-3" /></button>
                  </th>
                  <th className="text-right px-3 py-2.5 font-semibold text-slate-500">Annual Gross</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {incomeRows.map((row) => {
                  const isExpanded = expanded.has(row.cat)
                  const matchedLines = incomeLines.filter((l) => l.label?.includes(row.cat.split(" ")[0]))
                  const rowGross = matchedLines.length
                    ? matchedLines.reduce((s, l) => s + annualFromLine(l), 0)
                    : grossAnnual / incomeRows.length
                  const colour = CATEGORY_COLOURS[row.cat] ?? "#94a3b8"
                  return [
                    <tr
                      key={row.cat}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() =>
                        setExpanded((prev) => {
                          const next = new Set(prev)
                          next.has(row.cat) ? next.delete(row.cat) : next.add(row.cat)
                          return next
                        })
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colour }} />
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span className="font-medium text-slate-800">{row.cat}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{row.units}</td>
                      <td className="px-3 py-3 text-slate-600">{row.basis}</td>
                      <td className="px-3 py-3 text-right font-medium text-slate-800">
                        {fmt(rowGross / 12)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600">92%</td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-900">{fmt(rowGross)}</td>
                      <td className="px-3 py-3 text-center">
                        <button className="p-1 rounded hover:bg-slate-100 text-slate-400" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>,
                    isExpanded && (
                      <tr key={`${row.cat}-sub`} className="bg-blue-50/30">
                        <td colSpan={8} className="px-8 py-2 text-xs text-slate-500 italic">
                          No sub-line items yet — click + Add Income Category to expand.
                        </td>
                      </tr>
                    ),
                  ]
                })}
                {/* Total row */}
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td className="px-4 py-3 font-bold text-slate-900 text-sm" colSpan={6}>
                    Total Gross Annual Income
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-slate-900 text-sm">{fmt(grossAnnual)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue Mix Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <p className="text-sm font-bold text-slate-900 mb-1">Revenue Mix</p>
          <p className="text-xs text-slate-400 mb-4">Breakdown by income category</p>
          <div className="relative flex-1 flex items-center justify-center" style={{ minHeight: 220 }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={donutData.length ? donutData : [{ name: "No data", value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {donutData.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_COLOURS[entry.name] ?? Object.values(CATEGORY_COLOURS)[i % 7]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: unknown) => [fmt(Number(v)), "Annual"]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[11px] text-slate-400">Total Gross</p>
              <p className="text-base font-bold text-slate-900">{fmt(grossAnnual, true)}</p>
            </div>
          </div>
          <div className="mt-2 space-y-1.5">
            {(donutData.length ? donutData : []).slice(0, 5).map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLOURS[d.name] ?? Object.values(CATEGORY_COLOURS)[i % 7] }}
                  />
                  <span className="text-slate-600 truncate max-w-[120px]">{d.name}</span>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="font-semibold text-slate-900">{fmt(d.value, true)}</span>
                  <span className="text-slate-400 w-10">{pct(d.value, grossAnnual)}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            View breakdown <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── D. Unit-Linked Income Cards ──────────────────────────────────────── */}
      <div>
        <p className="text-sm font-bold text-slate-900 mb-3">Unit-Linked Income</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {unitTypes.map(({ label, type, colour }) => {
            const typeRooms = rooms.filter((r) => r.unit_type === type)
            const total = typeRooms.reduce((s, r) => s + r.target_rent_pcm, 0)
            const avg = typeRooms.length ? total / typeRooms.length : 0
            const occupied = typeRooms.filter((r) => r.status === "occupied").length
            const occPct = typeRooms.length ? (occupied / typeRooms.length) * 100 : 0
            const annualGross = total * 12
            return (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colour }} />
                    <p className="text-sm font-bold text-slate-900">{label}</p>
                  </div>
                  <button className="p-1 rounded hover:bg-slate-50 text-slate-400">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Avg rate</span>
                    <span className="font-semibold text-slate-900">{fmt(avg)} / mo</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Occupancy</span>
                    <span className="font-semibold text-slate-900">{occPct.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Annual gross</span>
                    <span className="font-semibold text-slate-900">{fmt(annualGross)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Units</span>
                    <span className="font-semibold text-slate-900">{typeRooms.length}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── E. Monthly Income Breakdown ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-slate-900">Monthly Income Breakdown</p>
            <p className="text-xs text-slate-400 mt-0.5">Year {year} projected income by month</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setChartMode("monthly")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                chartMode === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setChartMode("cumulative")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                chartMode === "cumulative" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              Cumulative
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartMode === "monthly" ? monthlyChartData : cumulativeChartData} barSize={22}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: unknown) => fmt(Number(v), true)} />
            <Tooltip formatter={(v: unknown) => [fmt(Number(v)), ""]} />
            {chartMode === "monthly" ? (
              <>
                <Bar dataKey="gross" name="Gross Income" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" name="Net Income" fill="#10B981" radius={[4, 4, 0, 0]} />
              </>
            ) : (
              <Bar dataKey="cumulative" name="Cumulative" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>

        {/* Annual Summary Table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 font-semibold text-slate-500"></th>
                {yearTable.map((y) => (
                  <th key={y.year} className="text-right py-2 font-semibold text-slate-500 px-3">Year {y.year}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { label: "Gross Income", key: "gross" as const },
                { label: "Vacancy / Loss", key: "vacancy" as const },
                { label: "Net Income", key: "net" as const },
              ].map((row) => (
                <tr key={row.label}>
                  <td className="py-2.5 font-medium text-slate-600">{row.label}</td>
                  {yearTable.map((y) => (
                    <td key={y.year} className={`py-2.5 text-right px-3 ${row.key === "net" ? "font-bold text-slate-900" : "text-slate-700"}`}>
                      {row.key === "vacancy" ? `(${fmt(y.vacancy)})` : fmt(y[row.key])}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="py-2.5 font-medium text-slate-600">YoY Change</td>
                {yearTable.map((y) => (
                  <td key={y.year} className="py-2.5 text-right px-3 text-emerald-600 font-medium">
                    {y.yoy === null ? "—" : `+${y.yoy}%`}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── F. Seasonality + Scenario Rail ──────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* Seasonality Chart */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Seasonality & Occupancy Assumptions</p>
              <p className="text-xs text-slate-400 mt-0.5">Occupancy rate and seasonal multiplier by month</p>
            </div>
            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              Edit assumptions <Pencil className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-6 mb-4">
            {[
              { label: "Avg Occupancy", value: "88.0%", colour: "#2563EB" },
              { label: "Low Season", value: "82%", colour: "#94a3b8" },
              { label: "High Season", value: "94%", colour: "#10B981" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.colour }} />
                <span className="text-slate-500">{s.label}:</span>
                <span className="font-semibold text-slate-900">{s.value}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={occupancyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[70, 100]} />
              <Tooltip formatter={(v: unknown) => [`${Number(v).toFixed(1)}%`, ""]} />
              <Line type="monotone" dataKey="occupancy" name="Occupancy %" stroke="#2563EB" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="multiplier" name="Seasonal Multiplier" stroke="#F59E0B" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Scenario Adjustments Rail */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm font-bold text-slate-900 mb-3">Scenario Adjustments</p>
          <div className="space-y-3">
            {[
              { label: "Rent Uplift (YoY)", value: "3.0%" },
              { label: "Vacancy Allowance", value: "8.0%" },
              { label: "Bad Debt", value: "2.0%" },
              { label: "Concession", value: "1.0%" },
              { label: "Utility Pass-through", value: "100%" },
              { label: "Inflation (CPI)", value: "2.5%" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{item.label}</span>
                <span className="text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{item.value}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            View all adjustments <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── G. Room-by-Room Revenue Table ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">Room-by-Room Revenue</p>
          <button className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            View all rooms <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
              <tr>
                {["Room", "Type", "Floor", "Rent (PCM)", "Annual Rent (Gross)", "Occupancy %", "Annual Income", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No rooms added yet.
                  </td>
                </tr>
              ) : (
                rooms.slice(0, 12).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{r.name}</td>
                    <td className="px-4 py-2.5 text-slate-600 capitalize">{r.unit_type ?? "—"}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.floor ?? "—"}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{fmt(r.target_rent_pcm)}</td>
                    <td className="px-4 py-2.5 text-slate-900">{fmt(r.target_rent_pcm * 12)}</td>
                    <td className="px-4 py-2.5 text-slate-600">92%</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{fmt(r.actual_rent_pcm * 12)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        r.status === "occupied"
                          ? "bg-emerald-50 text-emerald-700"
                          : r.status === "vacant"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button className="p-1 rounded hover:bg-slate-100 text-slate-400">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── H. Gross vs Net + Market Benchmarks + AI ─────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Gross vs Net waterfall */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm font-bold text-slate-900 mb-4">Gross vs Net (Year 1)</p>
          <div className="space-y-2">
            {[
              { label: "Gross Income", amount: grossAnnual, colour: "#2563EB", sign: "" },
              { label: "Vacancy / Loss", amount: -vacancyLoss, colour: "#EF4444", sign: "−" },
              { label: "Bad Debt", amount: -badDebt, colour: "#EF4444", sign: "−" },
              { label: "Concessions", amount: -concession, colour: "#F59E0B", sign: "−" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.colour }} />
                  <span className="text-slate-600">{item.label}</span>
                </div>
                <span className={`font-semibold ${item.amount < 0 ? "text-red-600" : "text-slate-900"}`}>
                  {item.amount < 0 ? `(${fmt(Math.abs(item.amount))})` : fmt(item.amount)}
                </span>
              </div>
            ))}
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-sm">
              <span className="font-bold text-slate-900">Net Income</span>
              <span className="font-bold text-emerald-600">{fmt(netIncome)}</span>
            </div>
          </div>

          {/* Net recovery gauge */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-slate-500">Net Recovery Rate</p>
              <p className="text-sm font-bold text-slate-900">{netRecoveryPct.toFixed(1)}%</p>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#10B981] transition-all"
                style={{ width: `${Math.min(100, netRecoveryPct)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Target: ≥ 85%</p>
          </div>
        </div>

        {/* Market Benchmarks */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm font-bold text-slate-900 mb-4">Market Benchmarks</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 font-semibold text-slate-500">Metric</th>
                <th className="text-right py-2 font-semibold text-slate-500">This Plan</th>
                <th className="text-right py-2 font-semibold text-slate-500">Market Avg</th>
                <th className="text-right py-2 font-semibold text-slate-500">vs Market</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { metric: "Avg Rent/Room (PCM)", plan: fmt(avgRentPcm), mkt: "£595", diff: "-3%", neg: true },
                { metric: "Gross Yield", plan: "8.4%", mkt: "7.8%", diff: "+0.6%", neg: false },
                { metric: "Occupancy", plan: "92%", mkt: "88%", diff: "+4%", neg: false },
                { metric: "RevPAR", plan: fmt(avgRentPcm * 0.92), mkt: "£524", diff: "+2%", neg: false },
              ].map((row) => (
                <tr key={row.metric}>
                  <td className="py-2.5 font-medium text-slate-700">{row.metric}</td>
                  <td className="py-2.5 text-right font-semibold text-slate-900">{row.plan}</td>
                  <td className="py-2.5 text-right text-slate-500">{row.mkt}</td>
                  <td className={`py-2.5 text-right font-semibold ${row.neg ? "text-red-600" : "text-emerald-600"}`}>
                    {row.diff}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            View full benchmark report <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* AI Recommendation */}
        <div className="bg-[#7C3AED] rounded-2xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div style={{ color: "#fff" }}>
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-sm font-bold text-white">AI Income Recommendation</p>
          </div>
          <p className="text-xs text-violet-200 leading-relaxed flex-1">
            Room rents are 3% below the local HMO benchmark. Increasing rent by £18/room/month across all 12
            rooms would generate an additional <strong className="text-white">£2,592/year</strong> without
            significantly impacting occupancy based on current demand signals. Consider a phased uplift over
            two tenancy cycles.
          </p>
          <div className="mt-4 space-y-2">
            <button className="w-full inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl bg-white text-violet-800 text-xs font-bold hover:bg-violet-50 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              Run scenario
            </button>
            <button className="w-full inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl border border-violet-400 text-white text-xs font-semibold hover:bg-violet-600 transition-colors">
              <Info className="w-3.5 h-3.5" />
              Learn more
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
