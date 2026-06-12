"use client"

import { useParams } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import {
  Pencil,
  Plus,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
  Columns2,
  Filter,
  Sparkles,
  TrendingUp,
  TrendingDown,
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
import type { PlanningUnitRoom, UnitRoomType, UnitRoomStatus } from "@/lib/planning/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return "£" + n.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<UnitRoomType, { label: string; bg: string; text: string }> = {
  ensuite:  { label: "Ensuite",   bg: "bg-blue-100",   text: "text-blue-700" },
  standard: { label: "Standard",  bg: "bg-slate-100",  text: "text-slate-700" },
  studio:   { label: "Studio",    bg: "bg-violet-100", text: "text-violet-700" },
  bathroom: { label: "Bathroom",  bg: "bg-slate-100",  text: "text-slate-600" },
  kitchen:  { label: "Kitchen",   bg: "bg-amber-100",  text: "text-amber-700" },
  lounge:   { label: "Lounge",    bg: "bg-emerald-100",text: "text-emerald-700" },
}

const STATUS_CONFIG: Record<UnitRoomStatus, { label: string; bg: string; text: string; dot: string }> = {
  occupied: { label: "Occupied", bg: "bg-emerald-50",  text: "text-emerald-700", dot: "#10B981" },
  vacant:   { label: "Vacant",   bg: "bg-amber-50",   text: "text-amber-700",   dot: "#F59E0B" },
  shared:   { label: "Shared",   bg: "bg-slate-100",  text: "text-slate-600",   dot: "#94a3b8" },
}

const TYPE_COLOURS: Record<string, string> = {
  ensuite:  "#2563EB",
  standard: "#94a3b8",
  studio:   "#7C3AED",
  bathroom: "#64748b",
  kitchen:  "#F59E0B",
  lounge:   "#10B981",
}

const DONUT_COLOURS = ["#2563EB", "#94a3b8", "#7C3AED", "#EF4444"]

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-xl ${className ?? ""}`} />
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string
  value: string
  sub?: string
  trend?: "up" | "down"
  chip?: string
  chipColour?: "emerald" | "amber" | "blue" | "red"
  onEdit?: () => void
}

function KpiCard({ label, value, sub, trend, chip, chipColour = "emerald", onEdit }: KpiProps) {
  const chipCls: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        {onEdit && (
          <button onClick={onEdit} className="p-1 rounded hover:bg-slate-50 text-slate-300 hover:text-slate-500">
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <p className="text-[22px] font-bold text-slate-900 leading-none">{value}</p>
        {trend === "up" && <div style={{ color: "#10B981" }}><TrendingUp className="w-4 h-4" /></div>}
        {trend === "down" && <div style={{ color: "#EF4444" }}><TrendingDown className="w-4 h-4" /></div>}
      </div>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
      {chip && (
        <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit ${chipCls[chipColour]}`}>
          {chip}
        </span>
      )}
    </div>
  )
}

// ── Inline-editable rent cell ─────────────────────────────────────────────────

interface EditableCellProps {
  value: number
  roomId: string
  field: "target_rent_pcm" | "actual_rent_pcm"
  onSave: (roomId: string, field: string, value: number) => void
}

function EditableRentCell({ value, roomId, field, onSave }: EditableCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))

  const commit = () => {
    const num = parseFloat(draft)
    if (!isNaN(num)) onSave(roomId, field, num)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false) }}
        className="w-20 text-xs border border-blue-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    )
  }
  return (
    <span
      className="cursor-pointer hover:text-blue-600 border-b border-dashed border-transparent hover:border-blue-400 transition-colors"
      onClick={() => setEditing(true)}
    >
      {fmt(value)}
    </span>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RoomsUnitsPage() {
  const { id } = useParams<{ id: string }>()

  const [rooms, setRooms] = useState<PlanningUnitRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "table" | "split">("grid")
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set(["Ground Floor", "First Floor", "Second Floor"]))
  const [groupBy, setGroupBy] = useState("Floor")

  useEffect(() => {
    if (!id) return
    const sb = createClient()
    sb.from("planning_units_rooms")
      .select("*")
      .eq("planning_set_id", id)
      .order("sort_order")
      .then(({ data }) => {
        setRooms((data ?? []) as PlanningUnitRoom[])
        setLoading(false)
      })
  }, [id])

  // ── Optimistic rent save ─────────────────────────────────────────────────────

  const handleRentSave = (roomId: string, field: string, value: number) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId ? { ...r, [field]: value } : r
      )
    )
    const sb = createClient()
    sb.from("planning_units_rooms")
      .update({ [field]: value })
      .eq("id", roomId)
      .then()
  }

  // ── Derived KPIs ─────────────────────────────────────────────────────────────

  const total = rooms.length
  const occupied = rooms.filter((r) => r.status === "occupied").length
  const vacant = rooms.filter((r) => r.status === "vacant").length
  const rentableRooms = rooms.filter((r) => r.rentable)
  const avgRent = rentableRooms.length
    ? rentableRooms.reduce((s, r) => s + r.target_rent_pcm, 0) / rentableRooms.length
    : 0
  const occupancyPct = total ? (occupied / total) * 100 : 0
  const yieldPerUnit = total ? rentableRooms.reduce((s, r) => s + r.actual_rent_pcm, 0) / total : 0

  // ── Floor grouping ────────────────────────────────────────────────────────────

  const floorGroups = useMemo(() => {
    const map: Record<string, PlanningUnitRoom[]> = {}
    rooms.forEach((r) => {
      const floor = r.floor ?? "Other"
      if (!map[floor]) map[floor] = []
      map[floor].push(r)
    })
    return map
  }, [rooms])

  // ── Donut data ────────────────────────────────────────────────────────────────

  const donutData = useMemo(() => {
    const typeMap: Record<string, number> = {}
    rooms.forEach((r) => {
      const t = r.unit_type ?? "other"
      typeMap[t] = (typeMap[t] ?? 0) + r.actual_rent_pcm
    })
    return Object.entries(typeMap).map(([name, value]) => ({ name, value }))
  }, [rooms])

  const totalActualRent = rooms.reduce((s, r) => s + r.actual_rent_pcm, 0)

  // ── Bar chart data ────────────────────────────────────────────────────────────

  const barData = useMemo(() =>
    rooms.slice(0, 10).map((r) => ({
      name: r.unit_code ?? r.name.slice(0, 6),
      target: r.target_rent_pcm,
      actual: r.actual_rent_pcm,
    })), [rooms])

  // ── Floor toggle ──────────────────────────────────────────────────────────────

  const toggleFloor = (floor: string) =>
    setExpandedFloors((prev) => {
      const next = new Set(prev)
      next.has(floor) ? next.delete(floor) : next.add(floor)
      return next
    })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-10" />
        <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr_280px] gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── KPI Strip ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          label="Total Units"
          value={String(total)}
          sub="All rooms"
          onEdit={() => {}}
        />
        <KpiCard
          label="Occupied Units"
          value={String(occupied)}
          sub={`${occupancyPct.toFixed(0)}% of total`}
          chip={`${occupancyPct.toFixed(0)}%`}
          chipColour="emerald"
          onEdit={() => {}}
        />
        <KpiCard
          label="Vacant Units"
          value={String(vacant)}
          sub={`${total ? ((vacant / total) * 100).toFixed(0) : 0}% of total`}
          chip={vacant > 0 ? `${vacant} vacant` : "Full"}
          chipColour={vacant > 0 ? "amber" : "emerald"}
          onEdit={() => {}}
        />
        <KpiCard
          label="Average Room Rent"
          value={fmt(avgRent)}
          sub="Per month"
          onEdit={() => {}}
        />
        <KpiCard
          label="Occupancy %"
          value={`${occupancyPct.toFixed(1)}%`}
          trend={occupancyPct >= 85 ? "up" : "down"}
          chip={occupancyPct >= 85 ? "+2% MoM" : "Below target"}
          chipColour={occupancyPct >= 85 ? "emerald" : "amber"}
        />
        <KpiCard
          label="Yield per Unit (Monthly)"
          value={fmt(yieldPerUnit)}
          trend="up"
          chip="+1.2% MoM"
          chipColour="blue"
        />
      </div>

      {/* ── Controls Row ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-3 flex flex-wrap items-center gap-2">
        <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Add Room
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>
        <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Add Unit
        </button>
        <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          Auto-fill Rooms
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>
        <button className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          Bulk Edit
        </button>
        <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          Columns
        </button>
        <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          <Filter className="w-3.5 h-3.5" />
          Filter
        </button>

        {/* View toggles */}
        <div className="ml-auto flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
          {[
            { mode: "grid" as const, icon: LayoutGrid },
            { mode: "table" as const, icon: List },
            { mode: "split" as const, icon: Columns2 },
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

      {/* ── Main 3-column layout ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr_280px] gap-6 items-start">

        {/* Left: Floor / Room Map */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Floor / Room Map</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Drag to reorder rooms</p>
            </div>
            <button className="p-1 rounded hover:bg-slate-50 text-slate-400">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {Object.keys(floorGroups).length === 0 ? (
              // Fallback floors if no rooms yet
              ["Ground Floor", "First Floor", "Second Floor"].map((floor) => (
                <div key={floor} className="text-xs text-slate-400 py-1 pl-2">{floor} — empty</div>
              ))
            ) : (
              Object.entries(floorGroups).map(([floor, floorRooms]) => (
                <div key={floor}>
                  <button
                    onClick={() => toggleFloor(floor)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-semibold text-slate-700"
                  >
                    <span>{floor}</span>
                    <div className="flex items-center gap-1">
                      <Pencil className="w-3 h-3 text-slate-300" />
                      {expandedFloors.has(floor) ? (
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </button>
                  {expandedFloors.has(floor) && (
                    <div className="ml-2 mt-0.5 space-y-0.5">
                      {floorRooms.map((r) => {
                        const sCfg = STATUS_CONFIG[r.status]
                        return (
                          <div
                            key={r.id}
                            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 cursor-pointer"
                          >
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: sCfg.dot }} />
                            <span className="text-xs text-slate-600 truncate">
                              {r.unit_code ?? r.name} • {r.name}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <button className="mt-3 w-full text-xs text-blue-600 hover:text-blue-800 font-medium text-left pl-2">
            + Add Floor
          </button>
        </div>

        {/* Center: Room/Unit Inventory */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <p className="text-sm font-bold text-slate-900">Room / Unit Inventory</p>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {rooms.length} rooms
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="appearance-none text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg pl-2.5 pr-6 py-1.5 focus:outline-none"
                >
                  <option>Floor</option>
                  <option>Type</option>
                  <option>Status</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
              <button className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50">
                <Filter className="w-3 h-3" />
                Filter
              </button>
            </div>
          </div>

          {viewMode === "grid" && (
            rooms.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <p className="text-sm text-slate-400">No rooms added yet. Click "+ Add Room" to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {rooms.map((r) => {
                  const tCfg = TYPE_CONFIG[r.unit_type ?? "standard"] ?? TYPE_CONFIG.standard
                  const sCfg = STATUS_CONFIG[r.status]
                  const colour = TYPE_COLOURS[r.unit_type ?? "standard"] ?? "#94a3b8"
                  return (
                    <div key={r.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      {/* Thumbnail */}
                      <div
                        className="h-[72px] relative flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${colour}22 0%, ${colour}44 100%)` }}
                      >
                        <span className="text-lg font-black opacity-30" style={{ color: colour }}>
                          {r.unit_code ?? r.name.slice(0, 3).toUpperCase()}
                        </span>
                        <div className="absolute top-2 left-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${tCfg.bg} ${tCfg.text}`}>
                            {tCfg.label}
                          </span>
                        </div>
                        <button className="absolute top-2 right-2 p-1 rounded bg-white/70 hover:bg-white text-slate-500">
                          <MoreHorizontal className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="p-3 space-y-2">
                        <div>
                          <p className="text-[11px] font-bold text-slate-400">{r.unit_code ?? "—"}</p>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{r.name}</p>
                        </div>

                        {(r.size_sqm || r.dimensions) && (
                          <p className="text-[11px] text-slate-400">
                            {r.size_sqm ? `${r.size_sqm} m²` : ""}{r.size_sqm && r.dimensions ? " · " : ""}{r.dimensions ?? ""}
                          </p>
                        )}

                        <span className={`inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${sCfg.bg} ${sCfg.text}`}>
                          {sCfg.label}
                        </span>

                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Target</span>
                          <span className="font-semibold text-slate-900">{fmt(r.target_rent_pcm)}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Actual</span>
                          <span className="font-semibold text-emerald-700">{fmt(r.actual_rent_pcm)}</span>
                        </div>

                        {r.tags && r.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {r.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}

          {viewMode === "table" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {["Unit Code", "Room", "Floor", "Type", "Size", "Status", "Target Rent", "Actual Rent", "Rentable", "Compliance", "Tenancy", "Next Review", "Actions"].map((h) => (
                        <th key={h} className="text-left px-3 py-2.5 font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rooms.map((r) => {
                      const tCfg = TYPE_CONFIG[r.unit_type ?? "standard"] ?? TYPE_CONFIG.standard
                      const sCfg = STATUS_CONFIG[r.status]
                      return (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{r.unit_code ?? "—"}</td>
                          <td className="px-3 py-2.5 font-medium text-slate-800">{r.name}</td>
                          <td className="px-3 py-2.5 text-slate-600">{r.floor ?? "—"}</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${tCfg.bg} ${tCfg.text}`}>
                              {tCfg.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">{r.size_sqm ? `${r.size_sqm} m²` : "—"}</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sCfg.bg} ${sCfg.text}`}>
                              {sCfg.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-900">
                            <EditableRentCell
                              value={r.target_rent_pcm}
                              roomId={r.id}
                              field="target_rent_pcm"
                              onSave={handleRentSave}
                            />
                          </td>
                          <td className="px-3 py-2.5 font-medium text-emerald-700">
                            <EditableRentCell
                              value={r.actual_rent_pcm}
                              roomId={r.id}
                              field="actual_rent_pcm"
                              onSave={handleRentSave}
                            />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {r.rentable ? (
                              <div style={{ color: "#10B981" }}><Check className="w-4 h-4 mx-auto" /></div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              r.compliance_status === "compliant"
                                ? "bg-emerald-50 text-emerald-700"
                                : r.compliance_status === "pending"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {r.compliance_status || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-500">{r.tenancy_id ? "Active" : "—"}</td>
                          <td className="px-3 py-2.5 text-slate-500">
                            {r.next_review_date
                              ? new Date(r.next_review_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                              : "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <button className="p-1 rounded hover:bg-slate-100 text-slate-400">
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === "split" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Card half */}
              <div className="grid grid-cols-1 gap-3 max-h-[480px] overflow-y-auto pr-1">
                {rooms.map((r) => {
                  const tCfg = TYPE_CONFIG[r.unit_type ?? "standard"] ?? TYPE_CONFIG.standard
                  const sCfg = STATUS_CONFIG[r.status]
                  return (
                    <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${TYPE_COLOURS[r.unit_type ?? "standard"] ?? "#94a3b8"}22` }}
                      >
                        <span className="text-xs font-black" style={{ color: TYPE_COLOURS[r.unit_type ?? "standard"] ?? "#94a3b8" }}>
                          {(r.unit_code ?? r.name).slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{r.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tCfg.bg} ${tCfg.text}`}>{tCfg.label}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${sCfg.bg} ${sCfg.text}`}>{sCfg.label}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-slate-900">{fmt(r.target_rent_pcm)}</p>
                        <p className="text-[11px] text-slate-400">target</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Unit register table half */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-h-[480px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-slate-500">Code</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-500">Room</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-500">Status</th>
                      <th className="text-right px-3 py-2 font-semibold text-slate-500">Rent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rooms.map((r) => {
                      const sCfg = STATUS_CONFIG[r.status]
                      return (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono text-slate-500">{r.unit_code ?? "—"}</td>
                          <td className="px-3 py-2 font-medium text-slate-800">{r.name}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${sCfg.bg} ${sCfg.text}`}>
                              {sCfg.label}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-900">
                            {fmt(r.target_rent_pcm)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Unit Register (always visible in grid mode) */}
          {viewMode === "grid" && rooms.length > 0 && (
            <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-900">Unit Register</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {["Unit Code", "Room", "Floor", "Type", "Size", "Status", "Target Rent", "Actual Rent", "Rentable", "Compliance", "Tenancy", "Next Review", "Actions"].map((h) => (
                        <th key={h} className="text-left px-3 py-2.5 font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rooms.map((r) => {
                      const tCfg = TYPE_CONFIG[r.unit_type ?? "standard"] ?? TYPE_CONFIG.standard
                      const sCfg = STATUS_CONFIG[r.status]
                      return (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{r.unit_code ?? "—"}</td>
                          <td className="px-3 py-2.5 font-medium text-slate-800">{r.name}</td>
                          <td className="px-3 py-2.5 text-slate-600">{r.floor ?? "—"}</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${tCfg.bg} ${tCfg.text}`}>
                              {tCfg.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">{r.size_sqm ? `${r.size_sqm} m²` : "—"}</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sCfg.bg} ${sCfg.text}`}>
                              {sCfg.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <EditableRentCell value={r.target_rent_pcm} roomId={r.id} field="target_rent_pcm" onSave={handleRentSave} />
                          </td>
                          <td className="px-3 py-2.5">
                            <EditableRentCell value={r.actual_rent_pcm} roomId={r.id} field="actual_rent_pcm" onSave={handleRentSave} />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {r.rentable ? <div style={{ color: "#10B981" }}><Check className="w-4 h-4 mx-auto" /></div> : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              r.compliance_status === "compliant" ? "bg-emerald-50 text-emerald-700"
                                : r.compliance_status === "pending" ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {r.compliance_status || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-500">{r.tenancy_id ? "Active" : "—"}</td>
                          <td className="px-3 py-2.5 text-slate-500">
                            {r.next_review_date
                              ? new Date(r.next_review_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                              : "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <button className="p-1 rounded hover:bg-slate-100 text-slate-400">
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Rail */}
        <div className="space-y-5">

          {/* Income by Unit Type Donut */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm font-bold text-slate-900 mb-1">Income by Unit Type</p>
            <p className="text-xs text-slate-400 mb-3">
              Total actual rent{" "}
              <span className="font-semibold text-slate-900">{fmt(totalActualRent)} / mo</span>
            </p>
            <div className="relative" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={donutData.length ? donutData : [{ name: "No data", value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutData.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={TYPE_COLOURS[entry.name] ?? DONUT_COLOURS[i % DONUT_COLOURS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => [fmt(Number(v)), "Monthly"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] text-slate-400">Monthly</p>
                <p className="text-sm font-bold text-slate-900">
                  {fmt(totalActualRent)}
                </p>
              </div>
            </div>
            <div className="mt-2 space-y-1.5">
              {donutData.slice(0, 5).map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: TYPE_COLOURS[d.name] ?? DONUT_COLOURS[i % DONUT_COLOURS.length] }}
                    />
                    <span className="text-slate-600 capitalize">{d.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{fmt(d.value)}</span>
                </div>
              ))}
            </div>
            <button className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium">
              View full breakdown →
            </button>
          </div>

          {/* Unit Performance Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm font-bold text-slate-900 mb-3">Unit Performance</p>
            <p className="text-xs text-slate-400 mb-3">Actual vs Target rent per unit</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barSize={10} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: unknown) => `£${Number(v)}`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v: unknown) => [fmt(Number(v)), ""]} />
                <Bar dataKey="target" name="Target" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
                <Bar dataKey="actual" name="Actual" fill="#2563EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Insights */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div style={{ color: "#7C3AED" }}>
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold text-slate-900">AI Insights</p>
            </div>
            <div className="space-y-3">
              {[
                {
                  text: "3 rooms are priced below the local market average. Consider a £15–£20/month uplift on next renewal.",
                  colour: "#F59E0B",
                },
                {
                  text: `${vacant} unit${vacant !== 1 ? "s" : ""} currently vacant. Based on local demand data, typical re-let time is 18 days.`,
                  colour: "#EF4444",
                },
                {
                  text: "Studio rent targets are 8% above comparable local studios. Review pricing to improve conversion speed.",
                  colour: "#2563EB",
                },
              ].map((insight, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: insight.colour }} />
                  <p className="text-xs text-slate-600 leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl bg-[#7C3AED] text-white text-xs font-bold hover:bg-violet-700 transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI about rooms
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
