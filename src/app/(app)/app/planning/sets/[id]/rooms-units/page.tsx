"use client"

import { useParams } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import {
  Plus,
  MoreHorizontal,
  LayoutGrid,
  List,
  Filter,
  DoorOpen,
  Check,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import { createClient } from "@/lib/supabase/client"

// ── Live schema row (planning_room_lines, FK planning_set_id) ──────────────────

interface RoomLineRow {
  id: string
  planning_set_id: string
  room_label: string | null
  room_type: string | null
  monthly_rent: number | null
  bills_included: boolean | null
  notes: string | null
  sort_order: number | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return "£" + n.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const TYPE_COLOURS: Record<string, string> = {
  ensuite:  "#2563EB",
  standard: "#94a3b8",
  studio:   "#7C3AED",
  bathroom: "#64748b",
  kitchen:  "#F59E0B",
  lounge:   "#10B981",
}

const DONUT_COLOURS = ["#2563EB", "#94a3b8", "#7C3AED", "#EF4444", "#F59E0B", "#10B981"]

function typeColour(t: string | null): string {
  return (t && TYPE_COLOURS[t]) || "#94a3b8"
}

function typeLabel(t: string | null): string {
  if (!t) return "Room"
  return t.charAt(0).toUpperCase() + t.slice(1)
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-xl ${className ?? ""}`} />
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string
  value: string
  sub?: string
}

function KpiCard({ label, value, sub }: KpiProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-1.5 min-w-0">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{label}</p>
      <p className="text-[22px] font-bold text-slate-900 leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RoomsUnitsPage() {
  const { id } = useParams<{ id: string }>()

  const [rooms, setRooms] = useState<RoomLineRow[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  useEffect(() => {
    if (!id) return
    const sb = createClient()
    sb.from("planning_room_lines")
      .select("*")
      .eq("planning_set_id", id)
      .order("sort_order")
      .then(({ data, error }) => {
        setRooms(error ? [] : ((data ?? []) as unknown as RoomLineRow[]))
        setLoading(false)
      })
  }, [id])

  // ── Derived KPIs from live columns ───────────────────────────────────────────

  const total = rooms.length
  const billsInclCount = rooms.filter((r) => r.bills_included).length
  const totalMonthlyRent = rooms.reduce((s, r) => s + (r.monthly_rent ?? 0), 0)
  const avgRent = total ? totalMonthlyRent / total : 0

  // ── Donut: income by room type ───────────────────────────────────────────────

  const donutData = useMemo(() => {
    const typeMap: Record<string, number> = {}
    rooms.forEach((r) => {
      const t = r.room_type ?? "other"
      typeMap[t] = (typeMap[t] ?? 0) + (r.monthly_rent ?? 0)
    })
    return Object.entries(typeMap).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0)
  }, [rooms])

  // ── Bar chart: rent per room ─────────────────────────────────────────────────

  const barData = useMemo(() =>
    rooms.slice(0, 10).map((r, i) => ({
      name: r.room_label ?? `Room ${i + 1}`,
      rent: r.monthly_rent ?? 0,
    })), [rooms])

  const hasRooms = total > 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-10" />
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── KPI Strip ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Rooms" value={String(total)} sub="All room lines" />
        <KpiCard label="Total Monthly Rent" value={fmt(totalMonthlyRent)} sub="Across all rooms" />
        <KpiCard label="Average Room Rent" value={fmt(avgRent)} sub="Per month" />
        <KpiCard label="Bills Included" value={`${billsInclCount} / ${total}`} sub="Rooms with bills incl." />
      </div>

      {/* ── Controls Row ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3 flex flex-wrap items-center gap-2">
        <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Add Room
        </button>
        <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          <Filter className="w-3.5 h-3.5" />
          Filter
        </button>
        <button className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {/* View toggles */}
        <div className="ml-auto flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
          {[
            { mode: "grid" as const, icon: LayoutGrid },
            { mode: "table" as const, icon: List },
          ].map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === mode ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Main 2-column layout ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">

        {/* Center: Room Inventory */}
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <p className="text-sm font-bold text-slate-900">Room Inventory</p>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {total} room{total !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {!hasRooms ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col items-center justify-center text-center py-14 px-4">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <DoorOpen className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No rooms yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Add rooms to model rent and bills for this plan.</p>
                <button className="mt-4 inline-flex items-center gap-1.5 h-8 px-4 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  Add Room
                </button>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {rooms.map((r, i) => {
                const colour = typeColour(r.room_type)
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div
                      className="h-[72px] relative flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${colour}22 0%, ${colour}44 100%)` }}
                    >
                      <span className="text-lg font-black opacity-30" style={{ color: colour }}>
                        {(r.room_label ?? `R${i + 1}`).slice(0, 3).toUpperCase()}
                      </span>
                      <div className="absolute top-2 left-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/70 text-slate-700">
                          {typeLabel(r.room_type)}
                        </span>
                      </div>
                      <button className="absolute top-2 right-2 p-1 rounded bg-white/70 hover:bg-white text-slate-500">
                        <MoreHorizontal className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="p-3 space-y-2">
                      <p className="text-sm font-bold text-slate-900 leading-tight">{r.room_label ?? `Room ${i + 1}`}</p>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Monthly rent</span>
                        <span className="font-semibold text-slate-900">{fmt(r.monthly_rent ?? 0)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Bills incl.</span>
                        <span className={`font-semibold ${r.bills_included ? "text-emerald-700" : "text-slate-500"}`}>
                          {r.bills_included ? "Yes" : "No"}
                        </span>
                      </div>
                      {r.notes && <p className="text-[11px] text-slate-400 truncate">{r.notes}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {["Room", "Type", "Monthly Rent", "Bills Included", "Notes", "Actions"].map((h) => (
                        <th key={h} className="text-left px-3 py-2.5 font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rooms.map((r, i) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-medium text-slate-800">{r.room_label ?? `Room ${i + 1}`}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {typeLabel(r.room_type)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-900">{fmt(r.monthly_rent ?? 0)}</td>
                        <td className="px-3 py-2.5 text-center">
                          {r.bills_included ? (
                            <div style={{ color: "var(--color-success)" }}><Check className="w-4 h-4 mx-auto" /></div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 truncate max-w-[180px]">{r.notes ?? "—"}</td>
                        <td className="px-3 py-2.5">
                          <button className="p-1 rounded hover:bg-slate-100 text-slate-400">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Rail */}
        <div className="space-y-5">

          {/* Income by Room Type Donut */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm font-bold text-slate-900 mb-1">Income by Room Type</p>
            <p className="text-xs text-slate-400 mb-3">
              Total monthly rent{" "}
              <span className="font-semibold text-slate-900">{fmt(totalMonthlyRent)} / mo</span>
            </p>
            {donutData.length === 0 ? (
              <div className="h-[160px] flex items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                <p className="text-xs text-slate-400">Add rooms to see the breakdown</p>
              </div>
            ) : (
              <>
                <div className="relative" style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                        {donutData.map((entry, i) => (
                          <Cell key={entry.name} fill={TYPE_COLOURS[entry.name] ?? DONUT_COLOURS[i % DONUT_COLOURS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: unknown) => [fmt(Number(v)), "Monthly"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] text-slate-400">Monthly</p>
                    <p className="text-sm font-bold text-slate-900">{fmt(totalMonthlyRent)}</p>
                  </div>
                </div>
                <div className="mt-2 space-y-1.5">
                  {donutData.slice(0, 6).map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_COLOURS[d.name] ?? DONUT_COLOURS[i % DONUT_COLOURS.length] }} />
                        <span className="text-slate-600 capitalize truncate">{d.name}</span>
                      </div>
                      <span className="font-semibold text-slate-900 flex-shrink-0">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Rent per Room Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm font-bold text-slate-900 mb-3">Rent per Room</p>
            {!hasRooms ? (
              <div className="h-[180px] flex items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                <p className="text-xs text-slate-400">No room data to chart yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} barSize={10} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: unknown) => `£${Number(v)}`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip formatter={(v: unknown) => [fmt(Number(v)), "Rent"]} />
                  <Bar dataKey="rent" name="Monthly Rent" fill="#2563EB" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
