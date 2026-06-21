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
  Pencil,
  Trash2,
  MoreHorizontal,
  Settings,
  Zap,
  Receipt,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// ── Live schema row (planning_bill_lines, FK planning_set_id) ──────────────────

interface BillLineRow {
  id: string
  planning_set_id: string
  label: string
  monthly_amount: number | null
  provider: string | null
  notes: string | null
  sort_order: number | null
}

const DONUT_COLORS = ["#2563EB", "#F59E0B", "#06B6D4", "#10B981", "#7C3AED", "#EF4444", "#84CC16", "#F97316", "#8B5CF6", "#94A3B8"]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

function fmtDec(n: number, dp = 1) {
  return n.toFixed(dp)
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, subColor }: { label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex flex-col gap-1.5 min-w-0">
      <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
      <p className="text-xl font-bold text-slate-900 truncate">{value}</p>
      {sub && <span className={`text-xs font-semibold ${subColor ?? "text-slate-500"}`}>{sub}</span>}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BillsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [bills, setBills] = useState<BillLineRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBills = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("planning_bill_lines")
      .select("*")
      .eq("planning_set_id", id)
      .order("sort_order")
    setBills(error ? [] : ((data ?? []) as unknown as BillLineRow[]))
    setLoading(false)
  }, [id])

  useEffect(() => { fetchBills() }, [fetchBills])

  async function handleDelete(billId: string) {
    const supabase = createClient()
    await supabase.from("planning_bill_lines").delete().eq("id", billId)
    setBills(prev => prev.filter(r => r.id !== billId))
  }

  // ── Derived stats from real rows ──────────────────────────────────────────────

  const totalMonthly = bills.reduce((s, b) => s + (b.monthly_amount ?? 0), 0)
  const totalAnnual = totalMonthly * 12
  const avgMonthly = bills.length ? totalMonthly / bills.length : 0

  const donutData = bills
    .map((b) => ({ name: b.label, value: b.monthly_amount ?? 0 }))
    .filter((d) => d.value > 0)
  const hasBills = bills.length > 0

  return (
    <div className="flex flex-col gap-6">

      {/* ── Inner tab switcher 5A / 5B ── */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        <button
          onClick={() => router.push(`/property-manager/planning/sets/${id}/expenses`)}
          className="px-4 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          5A Expenses
        </button>
        <button className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#7C3AED] text-white transition-colors">
          5B Bills
        </button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : (
          <>
            <KpiCard label="Monthly Bills" value={fmt(totalMonthly)} sub={`${bills.length} bill${bills.length !== 1 ? "s" : ""}`} subColor="text-slate-500" />
            <KpiCard label="Annual Bills" value={fmt(totalAnnual)} sub="Estimated" subColor="text-slate-500" />
            <KpiCard label="Average / Bill" value={hasBills ? fmt(avgMonthly) : "—"} sub="Per month" subColor="text-slate-500" />
            <KpiCard
              label="Largest Bill"
              value={hasBills ? fmt(Math.max(...bills.map((b) => b.monthly_amount ?? 0))) : "—"}
              sub={hasBills ? [...bills].sort((a, b) => (b.monthly_amount ?? 0) - (a.monthly_amount ?? 0))[0].label : "No bills yet"}
              subColor="text-slate-500"
            />
          </>
        )}
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
            <div className="flex items-center gap-2 flex-wrap">
              <button className="inline-flex items-center gap-1.5 h-8 px-4 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
                <Settings className="w-3.5 h-3.5" />
                Manage Bills
              </button>
              <button className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Utility Bills Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Utility Bills</h3>
              <span className="text-xs text-slate-400">Monthly recurring</span>
            </div>
            {loading ? (
              <div className="p-5"><Skeleton className="h-40 w-full" /></div>
            ) : !hasBills ? (
              <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <Receipt className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No bills yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Add utility bills and supplier costs to track recurring spend for this plan.</p>
                <button className="mt-4 inline-flex items-center gap-1.5 h-8 px-4 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
                  <Settings className="w-3.5 h-3.5" />
                  Manage Bills
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500 font-medium uppercase tracking-wide">
                      <th className="px-4 py-2.5 text-left">Bill</th>
                      <th className="px-4 py-2.5 text-left">Provider</th>
                      <th className="px-4 py-2.5 text-left">Notes</th>
                      <th className="px-4 py-2.5 text-right">Monthly (£)</th>
                      <th className="px-4 py-2.5 text-right">Annual (£)</th>
                      <th className="px-4 py-2.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bills.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0" style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}>
                              <Zap className="w-3.5 h-3.5" />
                            </div>
                            <p className="text-xs font-semibold text-slate-800">{b.label}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{b.provider ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[160px]">{b.notes ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-right font-medium text-slate-800">{fmt(b.monthly_amount ?? 0)}</td>
                        <td className="px-4 py-3 text-xs text-right text-slate-600">{fmt((b.monthly_amount ?? 0) * 12)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(b.id)}
                              className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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

          {/* ── Bills by Category Donut ── */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Bills by Category</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly total: {fmt(totalMonthly)}</p>
            </div>
            <div className="px-5 py-4">
              {!hasBills || donutData.length === 0 ? (
                <div className="h-[160px] flex items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400">Add bills to see the category breakdown</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={entry.name} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: unknown) => fmt(Number(value))} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 w-full grid grid-cols-1 gap-1.5">
                    {donutData.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                          <span className="text-xs text-slate-600 truncate">{d.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-right flex-shrink-0">
                          <span className="text-xs font-semibold text-slate-800">{totalMonthly > 0 ? `${fmtDec((d.value / totalMonthly) * 100)}%` : "—"}</span>
                          <span className="text-[10px] text-slate-400 w-14 text-right">{fmt(d.value)}</span>
                        </div>
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
