"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  Trash2,
  Search,
  Filter,
  ReceiptText,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// ── Live schema row (planning_expense_lines is profile-scoped) ─────────────────

interface ExpenseLineRow {
  id: string
  label: string | null
  category: string | null
  monthly_amount: number | null
  amount: number | null
  frequency: string | null
  is_variable: boolean | null
  notes: string | null
  sort_order: number | null
}

const BAR_COLORS = [
  "#7C3AED", "#2563EB", "#10B981", "#F59E0B", "#EF4444",
  "#06B6D4", "#8B5CF6", "#F97316", "#84CC16", "#94A3B8",
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

function monthlyOf(r: ExpenseLineRow): number {
  if (r.monthly_amount != null) return r.monthly_amount
  const amt = r.amount ?? 0
  switch (r.frequency) {
    case "monthly": return amt
    case "weekly": return amt * 52 / 12
    case "annual": return amt / 12
    case "one_off": return amt / 12
    default: return amt
  }
}

function annualOf(r: ExpenseLineRow): number {
  return monthlyOf(r) * 12
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex flex-col gap-1.5 min-w-0">
      <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
      <p className="text-xl font-bold text-slate-900 truncate">{value}</p>
      {sub && <span className="text-xs font-medium text-slate-500">{sub}</span>}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [rows, setRows] = useState<ExpenseLineRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    // planning_expense_lines is profile-scoped (no planning_set_id) — resilient → empty.
    const { data, error } = await supabase
      .from("planning_expense_lines")
      .select("*")
      .eq("planning_set_id", id)
      .order("sort_order")
    setRows(error ? [] : ((data ?? []) as unknown as ExpenseLineRow[]))
    setLoading(false)
  }, [id])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  async function handleDelete(rowId: string) {
    const supabase = createClient()
    await supabase.from("planning_expense_lines").delete().eq("id", rowId)
    setRows(prev => prev.filter(r => r.id !== rowId))
  }

  // ── Derived from real rows ───────────────────────────────────────────────────

  const totalMonthly = rows.reduce((s, r) => s + monthlyOf(r), 0)
  const totalAnnual = totalMonthly * 12
  const variableMonthly = rows.filter(r => r.is_variable).reduce((s, r) => s + monthlyOf(r), 0)
  const hasRows = rows.length > 0

  const filtered = rows.filter(r => {
    if (search === "") return true
    const q = search.toLowerCase()
    return (r.label ?? "").toLowerCase().includes(q) || (r.category ?? "").toLowerCase().includes(q)
  })

  const donutData = rows
    .map((r, i) => ({ name: r.label ?? r.category ?? `Expense ${i + 1}`, value: monthlyOf(r) }))
    .filter(d => d.value > 0)

  return (
    <div className="flex flex-col gap-6">

      {/* ── Inner tab switcher 5A / 5B ── */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        <button className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#7C3AED] text-white transition-colors">
          5A Expenses
        </button>
        <button
          onClick={() => router.push(`/property-manager/planning/sets/${id}/bills`)}
          className="px-4 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          5B Bills
        </button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : (
          <>
            <KpiCard label="Total OPEX (Annual)" value={fmt(totalAnnual)} sub={`${rows.length} item${rows.length !== 1 ? "s" : ""}`} />
            <KpiCard label="Monthly OPEX" value={fmt(totalMonthly)} sub="Recurring estimate" />
            <KpiCard label="Variable Spend (Monthly)" value={fmt(variableMonthly)} sub="Flagged variable" />
            <KpiCard label="Average / Item" value={hasRows ? fmt(totalMonthly / rows.length) : "—"} sub="Per month" />
          </>
        )}
      </div>

      {/* ── 2-column layout ── */}
      <div className="flex flex-col xl:flex-row gap-5">

        {/* ── Left column ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">

          {/* ── Section header ── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Expenses</h2>
              <p className="text-xs text-slate-500 mt-0.5">Operating expense summary</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl px-3 py-1.5">
                <div style={{ color: "var(--text-disabled)" }}><Search className="w-3.5 h-3.5" /></div>
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-transparent text-xs outline-none w-36 placeholder:text-slate-400 text-slate-700"
                />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition-colors">
                <div style={{ color: "var(--text-disabled)" }}><Filter className="w-3.5 h-3.5" /></div>
                Filters
              </button>
            </div>
          </div>

          {/* ── OPEX Summary Table ── */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Operating Expenses</h3>
              <span className="text-xs text-slate-400">Monthly view</span>
            </div>
            {loading ? (
              <div className="p-5"><Skeleton className="h-40 w-full" /></div>
            ) : !hasRows ? (
              <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <ReceiptText className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No expense lines yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Add operating expenses to build the cost model for this plan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500 font-medium uppercase tracking-wide">
                      <th className="px-4 py-2.5 text-left">Expense</th>
                      <th className="px-4 py-2.5 text-left">Category</th>
                      <th className="px-4 py-2.5 text-left">Type</th>
                      <th className="px-4 py-2.5 text-right">Monthly (£)</th>
                      <th className="px-4 py-2.5 text-right">Annual (£)</th>
                      <th className="px-4 py-2.5 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((r, i) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}>
                              <ReceiptText className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-medium text-slate-800">{r.label ?? r.category ?? `Expense ${i + 1}`}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{r.category ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${r.is_variable ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                            {r.is_variable ? "Variable" : "Fixed"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-right font-medium text-slate-800">{fmt(monthlyOf(r))}</td>
                        <td className="px-4 py-3 text-xs text-right text-slate-700">{fmt(annualOf(r))}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">No expenses match your search.</td>
                      </tr>
                    )}
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td className="px-4 py-3 text-xs text-slate-900" colSpan={3}>TOTAL</td>
                      <td className="px-4 py-3 text-xs text-right text-slate-900">{fmt(totalMonthly)}</td>
                      <td className="px-4 py-3 text-xs text-right text-slate-900">{fmt(totalAnnual)}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Expense Mix Donut ── */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Expense Mix</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly total: {fmt(totalMonthly)}</p>
            </div>
            <div className="px-5 py-4">
              {!hasRows || donutData.length === 0 ? (
                <div className="h-[160px] flex items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400">Add expenses to see the breakdown</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="value">
                        {donutData.map((entry, index) => (
                          <Cell key={entry.name} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: unknown) => fmt(Number(value))} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 w-full grid grid-cols-1 gap-1.5">
                    {donutData.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
                          <span className="text-xs text-slate-600 truncate">{d.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-800 flex-shrink-0">{fmt(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
