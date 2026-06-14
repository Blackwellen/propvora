"use client"

import { useParams } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import {
  TrendingUp,
  MoreHorizontal,
  Plus,
  ArrowRight,
  Coins,
  DoorOpen,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { createClient } from "@/lib/supabase/client"

// ── Live schema rows ───────────────────────────────────────────────────────────
// planning_income_lines is profile-scoped (no planning_set_id) — resilient → empty.
// planning_room_lines is set-scoped (FK planning_set_id).

interface IncomeLineRow {
  id: string
  source: string | null
  label: string | null
  monthly_amount: number | null
  amount: number | null
  frequency: string | null
  notes: string | null
  sort_order: number | null
}

interface RoomLineRow {
  id: string
  room_label: string | null
  room_type: string | null
  monthly_rent: number | null
  bills_included: boolean | null
  notes: string | null
  sort_order: number | null
}

const COLOURS = ["#2563EB", "#7C3AED", "#10B981", "#F59E0B", "#F97316", "#06B6D4", "#8B5CF6", "#EF4444"]

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

function monthlyOf(l: IncomeLineRow): number {
  if (l.monthly_amount != null) return l.monthly_amount
  const amt = l.amount ?? 0
  switch (l.frequency) {
    case "monthly": return amt
    case "weekly": return amt * 52 / 12
    case "annual": return amt / 12
    case "one_off": return amt / 12
    default: return amt
  }
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: "up" }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-1.5 min-w-0">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-[22px] font-bold text-slate-900 leading-none">{value}</p>
        {trend === "up" && <div style={{ color: "#10B981" }}><TrendingUp className="w-4 h-4" /></div>}
      </div>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
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

  const [incomeLines, setIncomeLines] = useState<IncomeLineRow[]>([])
  const [rooms, setRooms] = useState<RoomLineRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const sb = createClient()
    Promise.all([
      sb.from("planning_income_lines").select("*").eq("planning_set_id", id).order("sort_order"),
      sb.from("planning_room_lines").select("*").eq("planning_set_id", id).order("sort_order"),
    ]).then(([incRes, rmRes]) => {
      setIncomeLines(incRes.error ? [] : ((incRes.data ?? []) as unknown as IncomeLineRow[]))
      setRooms(rmRes.error ? [] : ((rmRes.data ?? []) as unknown as RoomLineRow[]))
      setLoading(false)
    })
  }, [id])

  // ── Derived from real rows ───────────────────────────────────────────────────

  const incomeMonthly = useMemo(() => incomeLines.reduce((s, l) => s + monthlyOf(l), 0), [incomeLines])
  const roomMonthly = useMemo(() => rooms.reduce((s, r) => s + (r.monthly_rent ?? 0), 0), [rooms])
  const grossMonthly = incomeMonthly + roomMonthly
  const grossAnnual = grossMonthly * 12
  const avgRoomRent = rooms.length ? roomMonthly / rooms.length : 0

  const donutData = useMemo(() => {
    const grouped: Record<string, number> = {}
    incomeLines.forEach((l) => {
      const cat = l.source || l.label || "Other Income"
      grouped[cat] = (grouped[cat] ?? 0) + monthlyOf(l) * 12
    })
    if (roomMonthly > 0) grouped["Room Rent"] = (grouped["Room Rent"] ?? 0) + roomMonthly * 12
    return Object.entries(grouped).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0)
  }, [incomeLines, roomMonthly])

  const hasAnyIncome = incomeLines.length > 0 || rooms.length > 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Gross Annual Income" value={fmt(grossAnnual)} trend="up" />
        <KpiCard label="Gross Monthly Income" value={fmt(grossMonthly)} sub="Income + room rent" />
        <KpiCard label="Income Lines" value={String(incomeLines.length)} sub={`${rooms.length} room${rooms.length !== 1 ? "s" : ""}`} />
        <KpiCard label="Avg Room Rent (PCM)" value={fmt(avgRoomRent)} sub="Per room" />
      </div>

      {/* ── B. Income Streams + Donut ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Income Streams Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Income streams</p>
              <p className="text-xs text-slate-400 mt-0.5">Recorded income lines for this plan.</p>
            </div>
            <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Add Income
            </button>
          </div>
          {incomeLines.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Coins className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No income lines yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">Add income sources beyond room rent (parking, storage, ancillary) to complete the revenue picture.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-500 min-w-[160px]">Income Source</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Frequency</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-slate-500">Monthly</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-slate-500">Annual Gross</th>
                    <th className="text-center px-3 py-2.5 font-semibold text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {incomeLines.map((l, i) => {
                    const m = monthlyOf(l)
                    return (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLOURS[i % COLOURS.length] }} />
                            <span className="font-medium text-slate-800">{l.source ?? l.label ?? `Income ${i + 1}`}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-600 capitalize">{(l.frequency ?? "monthly").replace("_", "-")}</td>
                        <td className="px-3 py-3 text-right font-medium text-slate-800">{fmt(m)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-900">{fmt(m * 12)}</td>
                        <td className="px-3 py-3 text-center">
                          <button className="p-1 rounded hover:bg-slate-100 text-slate-400">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td className="px-4 py-3 font-bold text-slate-900 text-sm" colSpan={3}>Total Annual (Income Lines)</td>
                    <td className="px-3 py-3 text-right font-bold text-slate-900 text-sm">{fmt(incomeMonthly * 12)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Revenue Mix Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <p className="text-sm font-bold text-slate-900 mb-1">Revenue Mix</p>
          <p className="text-xs text-slate-400 mb-4">Annual breakdown by source</p>
          {donutData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200" style={{ minHeight: 220 }}>
              <p className="text-xs text-slate-400">Add income to see the revenue mix</p>
            </div>
          ) : (
            <>
              <div className="relative flex-1 flex items-center justify-center" style={{ minHeight: 220 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                      {donutData.map((entry, i) => (
                        <Cell key={entry.name} fill={COLOURS[i % COLOURS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => [fmt(Number(v)), "Annual"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[11px] text-slate-400">Total Gross</p>
                  <p className="text-base font-bold text-slate-900">{fmt(grossAnnual, true)}</p>
                </div>
              </div>
              <div className="mt-2 space-y-1.5">
                {donutData.slice(0, 6).map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLOURS[i % COLOURS.length] }} />
                      <span className="text-slate-600 truncate max-w-[120px]">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-right flex-shrink-0">
                      <span className="font-semibold text-slate-900">{fmt(d.value, true)}</span>
                      <span className="text-slate-400 w-10">{pct(d.value, grossAnnual)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── C. Room-by-Room Revenue Table ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">Room-by-Room Revenue</p>
          <a href={`/app/planning/sets/${id}/rooms-units`} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            View all rooms <ArrowRight className="w-3 h-3" />
          </a>
        </div>
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <DoorOpen className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No rooms added yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">Add rooms in the Rooms &amp; Units tab to model per-room rent.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Room", "Type", "Monthly Rent", "Annual Rent", "Bills Included", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rooms.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{r.room_label ?? `Room ${i + 1}`}</td>
                    <td className="px-4 py-2.5 text-slate-600 capitalize">{r.room_type ?? "—"}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{fmt(r.monthly_rent ?? 0)}</td>
                    <td className="px-4 py-2.5 text-slate-900">{fmt((r.monthly_rent ?? 0) * 12)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full ${r.bills_included ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {r.bills_included ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button className="p-1 rounded hover:bg-slate-100 text-slate-400">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td className="px-4 py-2.5 font-bold text-slate-900" colSpan={2}>Total Monthly Room Rent</td>
                  <td className="px-4 py-2.5 font-bold text-slate-900">{fmt(roomMonthly)}</td>
                  <td className="px-4 py-2.5 font-bold text-slate-900">{fmt(roomMonthly * 12)}</td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!hasAnyIncome && (
        <p className="text-center text-xs text-slate-400">No income or rooms recorded for this plan yet.</p>
      )}
    </div>
  )
}
