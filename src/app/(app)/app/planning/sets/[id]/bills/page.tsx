"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
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
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Clock,
  XCircle,
  MoreHorizontal,
  Settings,
  Zap,
  Droplets,
  Wifi,
  Home,
  Trash,
  Tv,
  Flame,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { PlanningBill } from "@/lib/planning/types"

// ── Types ─────────────────────────────────────────────────────────────────────

type BillStatus = "upcoming" | "paid" | "overdue" | "unpaid"

interface BillRow {
  id: string
  utility: string
  supplier: string
  ref: string
  frequency: string
  dueDate: string
  estimated: number
  actual?: number
  status: BillStatus
  directDebit: boolean
}

// ── Static seed bills ─────────────────────────────────────────────────────────

const SEED_BILLS: BillRow[] = [
  { id: "b1", utility: "Electricity", supplier: "E.ON", ref: "#338495", frequency: "Monthly", dueDate: "20 May 2025", estimated: 420, actual: undefined, status: "upcoming", directDebit: true },
  { id: "b2", utility: "Gas", supplier: "British Gas", ref: "#223344", frequency: "Monthly", dueDate: "28 May 2025", estimated: 310, actual: undefined, status: "upcoming", directDebit: true },
  { id: "b3", utility: "Water", supplier: "Severn Trent", ref: "#887766", frequency: "Quarterly", dueDate: "28 May 2025", estimated: 186, actual: 172, status: "paid", directDebit: false },
  { id: "b4", utility: "Internet", supplier: "BT Business", ref: "#556677", frequency: "Monthly", dueDate: "01 Jun 2025", estimated: 75, actual: 75, status: "paid", directDebit: true },
  { id: "b5", utility: "Council Tax", supplier: "Nottingham CC", ref: "", frequency: "Monthly", dueDate: "05 Jun 2025", estimated: 160, actual: undefined, status: "upcoming", directDebit: false },
  { id: "b6", utility: "Waste Collection", supplier: "Veolia", ref: "#999877", frequency: "Quarterly", dueDate: "15 Jun 2025", estimated: 98, actual: undefined, status: "upcoming", directDebit: false },
  { id: "b7", utility: "TV Licence", supplier: "TV Licensing", ref: "", frequency: "Annual", dueDate: "01 Jul 2025", estimated: 169, actual: undefined, status: "upcoming", directDebit: false },
  { id: "b8", utility: "Gas (2nd)", supplier: "British Gas", ref: "#223344", frequency: "Monthly", dueDate: "20 Apr 2025", estimated: 305, actual: 328, status: "overdue", directDebit: true },
]

const UTILITY_ICONS: Record<string, React.ReactNode> = {
  "Electricity": <Zap className="w-3.5 h-3.5" />,
  "Gas": <Flame className="w-3.5 h-3.5" />,
  "Gas (2nd)": <Flame className="w-3.5 h-3.5" />,
  "Water": <Droplets className="w-3.5 h-3.5" />,
  "Internet": <Wifi className="w-3.5 h-3.5" />,
  "Council Tax": <Home className="w-3.5 h-3.5" />,
  "Waste Collection": <Trash className="w-3.5 h-3.5" />,
  "TV Licence": <Tv className="w-3.5 h-3.5" />,
}

const UTILITY_COLORS: Record<string, string> = {
  "Electricity": "#2563EB",
  "Gas": "#F59E0B",
  "Gas (2nd)": "#F97316",
  "Water": "#06B6D4",
  "Internet": "#7C3AED",
  "Council Tax": "#10B981",
  "Waste Collection": "#84CC16",
  "TV Licence": "#EF4444",
}

// ── Chart data ────────────────────────────────────────────────────────────────

const MONTHS = ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"]

const LINE_DATA = MONTHS.map((month, i) => ({
  month,
  Estimated: 2100 + (i % 10) * 20 - 80,
  Actual: i < 9 ? 1900 + (i % 12) * 20 - 100 : undefined,
}))

const DONUT_DATA = [
  { name: "Electricity", value: 36, amount: 1530 },
  { name: "Gas", value: 28, amount: 1190 },
  { name: "Water", value: 12, amount: 510 },
  { name: "Council Tax", value: 11, amount: 468 },
  { name: "Internet", value: 7, amount: 297 },
  { name: "Other", value: 6, amount: 253 },
]

const DONUT_COLORS = ["#2563EB", "#F59E0B", "#06B6D4", "#10B981", "#7C3AED", "#94A3B8"]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

function fmtDec(n: number, dp = 1) {
  return n.toFixed(dp)
}

const STATUS_CONFIG: Record<BillStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  upcoming: { label: "Upcoming", bg: "bg-blue-100", text: "text-blue-700", icon: <Clock className="w-3 h-3" /> },
  paid: { label: "Paid", bg: "bg-emerald-100", text: "text-emerald-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  overdue: { label: "Overdue", bg: "bg-red-100", text: "text-red-700", icon: <XCircle className="w-3 h-3" /> },
  unpaid: { label: "Unpaid", bg: "bg-amber-100", text: "text-amber-700", icon: <AlertTriangle className="w-3 h-3" /> },
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, subColor, trend, trendLabel,
}: {
  label: string
  value: string
  sub?: string
  subColor?: string
  trend?: "up" | "down" | "flat"
  trendLabel?: string
}) {
  const trendIcon =
    trend === "up" ? <TrendingUp className="w-3 h-3" /> :
    trend === "down" ? <TrendingDown className="w-3 h-3" /> :
    <Minus className="w-3 h-3" />
  const trendStyle =
    trend === "up" ? "text-red-500" :
    trend === "down" ? "text-emerald-500" :
    "text-slate-400"

  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex flex-col gap-1.5 min-w-0">
      <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
      <p className="text-xl font-bold text-slate-900 truncate">{value}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {sub && <span className={`text-xs font-semibold ${subColor ?? "text-slate-500"}`}>{sub}</span>}
        {trendLabel && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trendStyle}`}>
            {trendIcon} {trendLabel}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Mini Status Card ───────────────────────────────────────────────────────────

function StatusMiniCard({
  label, count, amount, color,
}: {
  label: string; count: number; amount: number; color: "blue" | "red" | "amber" | "emerald"
}) {
  const cls = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  }[color]

  return (
    <div className={`rounded-xl border px-4 py-3 ${cls} flex-1 min-w-0`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-lg font-bold mt-0.5">{count} bills</p>
      <p className="text-xs font-medium mt-0.5 opacity-80">{fmt(amount)}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BillsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [dbBills, setDbBills] = useState<PlanningBill[]>([])
  const [loading, setLoading] = useState(true)
  const [bills, setBills] = useState<BillRow[]>(SEED_BILLS)
  const [chartMode, setChartMode] = useState<"monthly" | "cumulative">("monthly")

  // ── Fetch DB ────────────────────────────────────────────────────────────────

  const fetchBills = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("planning_bills")
      .select("*")
      .eq("planning_set_id", id)
      .order("created_at")
    setDbBills((data ?? []) as PlanningBill[])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchBills() }, [fetchBills])

  // ── Toggle paid status ──────────────────────────────────────────────────────

  async function togglePaid(billId: string) {
    if (billId.startsWith("b")) {
      // seed row — toggle locally
      setBills(prev => prev.map(b => {
        if (b.id !== billId) return b
        const next: BillStatus = b.status === "paid" ? "unpaid" : "paid"
        return { ...b, status: next }
      }))
    } else {
      // DB row — not status field in PlanningBill but we can update notes as workaround
      // The PlanningBill type doesn't have a status column; skip DB update
    }
  }

  async function handleDelete(billId: string) {
    if (!billId.startsWith("b")) {
      const supabase = createClient()
      await supabase.from("planning_bills").delete().eq("id", billId)
      setDbBills(prev => prev.filter(r => r.id !== billId))
    }
  }

  // ── Derived stats ───────────────────────────────────────────────────────────

  const upcomingBills = bills.filter(b => b.status === "upcoming")
  const overdueBills = bills.filter(b => b.status === "overdue")
  const unpaidBills = bills.filter(b => b.status === "unpaid")
  const paidBills = bills.filter(b => b.status === "paid")

  const upcomingAmt = upcomingBills.reduce((s, b) => s + b.estimated, 0)
  const overdueAmt = overdueBills.reduce((s, b) => s + (b.actual ?? b.estimated), 0)
  const unpaidAmt = unpaidBills.reduce((s, b) => s + b.estimated, 0)
  const paidAmt = paidBills.reduce((s, b) => s + (b.actual ?? b.estimated), 0)

  const totalEstimated = bills.reduce((s, b) => s + b.estimated, 0)
  const totalActual = bills.filter(b => b.actual !== undefined).reduce((s, b) => s + (b.actual ?? 0), 0)
  const reconcVariance = totalActual - totalEstimated
  const reconcPct = totalEstimated > 0 ? (reconcVariance / totalEstimated) * 100 : 0

  // Cumulative chart
  const chartData = chartMode === "cumulative"
    ? LINE_DATA.reduce((acc: typeof LINE_DATA, row, i) => {
        const prev = acc[i - 1]
        acc.push({
          month: row.month,
          Estimated: (prev?.Estimated ?? 0) + row.Estimated,
          Actual: row.Actual !== undefined ? ((prev?.Actual ?? 0) + row.Actual) : undefined,
        })
        return acc
      }, [])
    : LINE_DATA

  // All bills (seed + DB)
  const allBills: BillRow[] = [
    ...bills,
    ...dbBills.map(r => ({
      id: r.id,
      utility: r.label,
      supplier: r.notes ?? "—",
      ref: "—",
      frequency: r.frequency === "one_off" ? "One-off" : r.frequency === "weekly" ? "Weekly" : r.frequency === "annual" ? "Annual" : "Monthly",
      dueDate: "—",
      estimated: r.amount,
      actual: undefined,
      status: "unpaid" as BillStatus,
      directDebit: false,
    }))
  ]

  return (
    <div className="flex flex-col gap-6">

      {/* ── Inner tab switcher 5A / 5B ── */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        <button
          onClick={() => router.push(`/app/planning/sets/${id}/expenses`)}
          className="px-4 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          5A Expenses
        </button>
        <button className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#7C3AED] text-white transition-colors">
          5B Bills
        </button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 grid grid-cols-2 xl:grid-cols-4 gap-3">
          <KpiCard
            label="Monthly Bills (Est.)"
            value={fmt(totalEstimated)}
            sub={`${bills.length} bills`}
            subColor="text-slate-500"
          />
          <KpiCard
            label="Overdue"
            value={fmt(overdueAmt)}
            sub={`${overdueBills.length} bills`}
            subColor="text-red-600"
          />
          <KpiCard
            label="Unpaid"
            value={fmt(unpaidAmt)}
            sub={`${unpaidBills.length} bills`}
            subColor="text-amber-600"
          />
          <KpiCard
            label="Paid (This Month)"
            value={fmt(paidAmt)}
            sub={`${paidBills.length} bills`}
            subColor="text-emerald-600"
          />
        </div>
        <div className="flex flex-row sm:flex-col gap-2 sm:w-[200px] flex-shrink-0">
          <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Utilities Burden</p>
            <p className="text-base font-bold text-blue-800 mt-0.5">6.2%</p>
          </div>
          <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">DD Coverage</p>
            <p className="text-base font-bold text-emerald-800 mt-0.5">62.5%</p>
          </div>
        </div>
      </div>

      {/* ── 2-column layout ── */}
      <div className="flex flex-col xl:flex-row gap-5">

        {/* ── Left/center ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">

          {/* Section header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Section 5B — Bills</h2>
              <p className="text-xs text-slate-500 mt-0.5">Utility bills &amp; supplier tracking</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 h-8 px-4 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
                <Settings className="w-3.5 h-3.5" />
                Manage Bills
              </button>
              <button className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status mini cards */}
          <div className="flex gap-3 overflow-x-auto pb-1">
            <StatusMiniCard label="Upcoming (7d)" count={upcomingBills.length} amount={upcomingAmt} color="blue" />
            <StatusMiniCard label="Overdue" count={overdueBills.length} amount={overdueAmt} color="red" />
            <StatusMiniCard label="Unpaid" count={unpaidBills.length} amount={unpaidAmt} color="amber" />
            <StatusMiniCard label="Paid this month" count={paidBills.length} amount={paidAmt} color="emerald" />
          </div>

          {/* Utility Bills Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Utility Bills</h3>
              <span className="text-xs text-slate-400">Current cycle</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 font-medium uppercase tracking-wide">
                    <th className="px-4 py-2.5 text-left">Utility / Supplier</th>
                    <th className="px-4 py-2.5 text-left">Ref / Account</th>
                    <th className="px-4 py-2.5 text-left">Frequency</th>
                    <th className="px-4 py-2.5 text-left">Due Date</th>
                    <th className="px-4 py-2.5 text-right">Est. (£)</th>
                    <th className="px-4 py-2.5 text-right">Actual (£)</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                    <th className="px-4 py-2.5 text-center">Direct Debit</th>
                    <th className="px-4 py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allBills.map(bill => {
                    const sc = STATUS_CONFIG[bill.status]
                    const iconColor = UTILITY_COLORS[bill.utility] ?? "#7C3AED"
                    const iconBg = `${iconColor}1A`
                    return (
                      <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: iconBg, color: iconColor }}
                            >
                              {UTILITY_ICONS[bill.utility] ?? <Zap className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-800">{bill.utility}</p>
                              <p className="text-[10px] text-slate-400">{bill.supplier}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{bill.ref || "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{bill.frequency}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{bill.dueDate}</td>
                        <td className="px-4 py-3 text-xs text-right font-medium text-slate-800">{fmt(bill.estimated)}</td>
                        <td className="px-4 py-3 text-xs text-right text-slate-600">
                          {bill.actual !== undefined ? fmt(bill.actual) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => togglePaid(bill.id)}
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-colors ${sc.bg} ${sc.text}`}
                          >
                            {sc.icon}
                            {sc.label}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${bill.directDebit ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                            {bill.directDebit ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(bill.id)}
                              className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}

                  {/* DB bills */}
                  {!loading && dbBills.map(r => {
                    const sc = STATUS_CONFIG["unpaid"]
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </div>
                            <p className="text-xs font-semibold text-slate-800">{r.label}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">—</td>
                        <td className="px-4 py-3 text-xs text-slate-500 capitalize">{r.frequency.replace("_", "-")}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">—</td>
                        <td className="px-4 py-3 text-xs text-right font-medium text-slate-800">{fmt(r.amount)}</td>
                        <td className="px-4 py-3 text-xs text-right text-slate-500">—</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                            {sc.icon} {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">No</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-100">
              <button className="text-xs font-semibold text-[#7C3AED] hover:underline">View all bills →</button>
            </div>
          </div>

          {/* ── Bills vs Actuals Chart ── */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-sm font-semibold text-slate-800">Bills vs Actuals — Last 12 Months</h3>
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
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `£${(v / 1000).toFixed(1)}k`} />
                  <Tooltip formatter={(value: unknown) => fmt(Number(value))} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="Estimated" stroke="#2563EB" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="Actual" stroke="#10B981" strokeWidth={2} dot={false} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Bottom row: Donut + Reconciliation ── */}
          <div className="flex flex-col md:flex-row gap-5">

            {/* Donut */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800">Bills by Category</h3>
                <p className="text-xs text-slate-400 mt-0.5">Annual total: £4,248</p>
              </div>
              <div className="px-5 py-4 flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={DONUT_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {DONUT_DATA.map((entry, index) => (
                        <Cell key={entry.name} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: unknown) => `${Number(value).toFixed(1)}%`} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 grid grid-cols-1 gap-1.5">
                  {DONUT_DATA.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                        <span className="text-xs text-slate-600">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        <span className="text-xs font-semibold text-slate-800">{d.value}%</span>
                        <span className="text-[10px] text-slate-400 w-12 text-right">{fmt(d.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reconciliation */}
            <div className="md:w-[240px] flex-shrink-0 bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800">Bill Reconciliation</h3>
              </div>
              <div className="px-5 py-4 flex flex-col gap-3">
                {[
                  { label: "Estimated", value: fmt(totalEstimated), color: "text-slate-800" },
                  { label: "Actual", value: fmt(totalActual), color: "text-slate-800" },
                  { label: "Variance", value: fmt(Math.abs(reconcVariance)), color: reconcVariance <= 0 ? "text-emerald-600" : "text-red-600" },
                  { label: "Variance %", value: `${fmtDec(Math.abs(reconcPct))}%`, color: reconcVariance <= 0 ? "text-emerald-600" : "text-red-600" },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">{r.label}</p>
                    <p className={`text-sm font-bold ${r.color}`}>{r.value}</p>
                  </div>
                ))}
                <div className={`mt-1 px-3 py-1.5 rounded-xl text-center text-xs font-semibold ${reconcVariance <= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {reconcVariance <= 0 ? `${fmtDec(Math.abs(reconcPct))}% under estimate` : `${fmtDec(reconcPct)}% over estimate`}
                </div>
                <button className="text-xs font-semibold text-[#7C3AED] hover:underline text-center mt-1">
                  View reconciliation →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="w-full xl:w-[280px] flex-shrink-0 flex flex-col gap-4">

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
                { msg: "Void provisions high — 9.1% of income", color: "text-amber-700", dot: "bg-amber-500" },
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
