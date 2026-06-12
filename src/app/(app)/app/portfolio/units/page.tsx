"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { UnitCard, type UnitCardData } from "@/components/portfolio/UnitCard"
import { useWorkspace } from "@/providers/AuthProvider"
import { useUnits } from "@/hooks/useUnits"
import { useProperties } from "@/hooks/useProperties"
import { Plus, Search, Home, ChevronLeft, ChevronRight, X, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { exportCsv } from "@/lib/portfolio/helpers"

const MOCK: UnitCardData[] = [
  { id: "u1", property_id: "p1", property_name: "Brunswick Road HMO",  unit_name: "Room 1",  unit_type: "room",   floor: 1, bedrooms: 1, floor_area_sqm: 16, target_rent: 550, status: "occupied",    tenant_name: "James Wilson",   tenancy_end: "2026-08-31" },
  { id: "u2", property_id: "p1", property_name: "Brunswick Road HMO",  unit_name: "Room 2",  unit_type: "room",   floor: 1, bedrooms: 1, floor_area_sqm: 14, target_rent: 475, status: "occupied",    tenant_name: "Sarah Chen",     tenancy_end: "2026-07-31" },
  { id: "u3", property_id: "p1", property_name: "Brunswick Road HMO",  unit_name: "Room 3",  unit_type: "room",   floor: 1, bedrooms: 1, floor_area_sqm: 14, target_rent: 475, status: "vacant" },
  { id: "u4", property_id: "p2", property_name: "Maple Street HMO",    unit_name: "Room A",  unit_type: "room",   floor: 1, bedrooms: 1, floor_area_sqm: 18, target_rent: 520, status: "occupied",    tenant_name: "Mohammed Ali",   tenancy_end: "2026-10-31" },
  { id: "u5", property_id: "p5", property_name: "City Centre SA",       unit_name: "Studio 1",unit_type: "studio",floor: 2, bedrooms: 1, floor_area_sqm: 35, target_rent: 900, status: "occupied",    tenant_name: "Booking guest" },
  { id: "u6", property_id: "p6", property_name: "Elms Road R2R",        unit_name: "Room 1",  unit_type: "room",   floor: 1, bedrooms: 1, floor_area_sqm: 12, target_rent: 480, status: "under_works" },
  { id: "u7", property_id: "p9", property_name: "Park Lane Co-Living",  unit_name: "Suite 3", unit_type: "suite",  floor: 3, bedrooms: 1, floor_area_sqm: 22, target_rent: 850, status: "occupied",    tenant_name: "Aisha Okonkwo",  tenancy_end: "2027-01-31" },
  { id: "u8", property_id: "p3", property_name: "Victoria Terrace",     unit_name: "Flat",    unit_type: "flat",   floor: 0, bedrooms: 3, floor_area_sqm: 85, target_rent: 1100,status: "vacant" },
  { id: "u9", property_id: "p10",property_name: "Meadow Court Student", unit_name: "Room 3",  unit_type: "room",   floor: 1, bedrooms: 1, floor_area_sqm: 14, target_rent: 550, status: "occupied",    tenant_name: "Tom Chen",       tenancy_end: "2026-09-30" },
]

const PAGE_SIZE = 12
const STATUSES = [
  { value: "all", label: "All" }, { value: "occupied", label: "Occupied" },
  { value: "vacant", label: "Vacant" }, { value: "under_works", label: "Maintenance" },
  { value: "reserved", label: "Reserved" },
]

export default function UnitsListPage() {
  const { workspace, isLoading: wsLoading } = useWorkspace()
  const { data: rawUnits, isLoading: unitsLoading } = useUnits(workspace?.id)
  const { data: rawProps } = useProperties(workspace?.id)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterProperty, setFilterProperty] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [page, setPage] = useState(1)

  const isLive = !!workspace?.id
  const loading = wsLoading || unitsLoading

  const allUnits: UnitCardData[] = useMemo(() => {
    if (!isLive) return MOCK
    if (!rawUnits?.length) return []
    const propName = new Map((rawProps ?? []).map(p => [p.id, p.name]))
    return rawUnits.map((u) => ({
      id: u.id, property_id: u.property_id,
      property_name: propName.get(u.property_id),
      unit_name: u.unit_name,
      unit_type: u.unit_type, floor: u.floor, bedrooms: u.bedrooms,
      floor_area_sqm: u.floor_area_sqm, target_rent: u.target_rent, status: u.status,
    }))
  }, [rawUnits, rawProps, isLive])

  /* Property filter options derived from the data itself (id + name). */
  const propertyOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const u of allUnits) {
      if (u.property_id && !seen.has(u.property_id)) seen.set(u.property_id, u.property_name ?? "Property")
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [allUnits])

  const filtered = useMemo(() => {
    let r = [...allUnits]
    if (search) r = r.filter((u) => u.unit_name.toLowerCase().includes(search.toLowerCase()) || (u.property_name ?? "").toLowerCase().includes(search.toLowerCase()))
    if (filterStatus !== "all") r = r.filter((u) => u.status === filterStatus)
    if (filterProperty !== "all") r = r.filter((u) => u.property_id === filterProperty)
    r.sort((a, b) => sortBy === "rent" ? (b.target_rent ?? 0) - (a.target_rent ?? 0) : a.unit_name.localeCompare(b.unit_name))
    return r
  }, [allUnits, search, filterStatus, filterProperty, sortBy])

  function handleExport() {
    exportCsv(
      filtered.map(u => ({
        unit_name: u.unit_name, property: u.property_name ?? "",
        type: u.unit_type ?? "", status: u.status,
        bedrooms: u.bedrooms ?? "", floor_area_sqm: u.floor_area_sqm ?? "",
        target_rent: u.target_rent ?? "",
      })),
      `units-${new Date().toISOString().slice(0, 10)}.csv`,
    )
  }

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const vacantCount = filtered.filter((u) => u.status === "vacant").length
  const occupiedCount = filtered.filter((u) => u.status === "occupied").length

  return (
    <DashboardContainer>
      <PageHeader
        title="Units & Rooms"
        description={`${filtered.length} total · ${occupiedCount} occupied · ${vacantCount} vacant`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="md" asChild><Link href="/app/portfolio">← Portfolio</Link></Button>
            <Button variant="outline" size="md" onClick={handleExport} disabled={filtered.length === 0}><Download className="w-4 h-4" />Export</Button>
            <Button variant="primary" size="md" asChild><Link href="/app/portfolio/units/new"><Plus className="w-4 h-4" />Add unit</Link></Button>
          </div>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search units..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full h-9 pl-9 pr-4 rounded-xl text-sm bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all shadow-sm"
          />
        </div>

        {/* Status chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUSES.map(({ value, label }) => (
            <button key={value} onClick={() => { setFilterStatus(value); setPage(1) }}
              className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all",
                filterStatus === value ? "bg-[#2563EB] border-[#2563EB] text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm")}
            >{label}</button>
          ))}
        </div>

        <select
          value={filterProperty}
          onChange={(e) => { setFilterProperty(e.target.value); setPage(1) }}
          className="h-9 px-3 rounded-xl text-sm bg-white border border-slate-200 text-slate-600 focus:outline-none shadow-sm cursor-pointer ml-auto"
        >
          <option value="all">All properties</option>
          {propertyOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-9 px-3 rounded-xl text-sm bg-white border border-slate-200 text-slate-600 focus:outline-none shadow-sm cursor-pointer"
        >
          <option value="name">Sort: Name</option>
          <option value="rent">Sort: Rent ↓</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center"><Home className="w-8 h-8 text-slate-300" /></div>
          <p className="text-sm font-semibold text-slate-600">No units found</p>
          <Button variant="outline" size="sm" onClick={() => { setSearch(""); setFilterStatus("all"); setFilterProperty("all") }}><X className="w-3.5 h-3.5" />Clear</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map((u) => <UnitCard key={u.id} unit={u} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">{((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={cn("w-8 h-8 rounded-lg text-sm font-semibold", page === i + 1 ? "bg-[#2563EB] text-white" : "text-slate-500 hover:bg-slate-100")}>{i + 1}</button>
            ))}
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </DashboardContainer>
  )
}
