"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperties } from "@/hooks/useProperties"
import { useUnits } from "@/hooks/useUnits"
import { useTenancies } from "@/hooks/useTenancies"
import { aggregateByProperty } from "@/lib/portfolio/helpers"
import {
  ArrowLeft,
  Map,
  Search,
  Building2,
  AlertTriangle,
  Wrench,
  ChevronRight,
  X,
  Plus,
  SlidersHorizontal,
  Home,
  PoundSterling,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
export interface MapProperty {
  id: string
  name: string
  address: string
  city: string
  postcode: string
  type: string
  status: "active" | "vacant" | "under_works" | "archived"
  operationProfile: string
  units: number
  occupied: number
  monthlyRent: number
  arrears: number
  openWork: number
  healthScore: "healthy" | "watch" | "at_risk" | "critical"
  lat: number
  lng: number
  coverImage: string
}

/* ------------------------------------------------------------------ */
/* Demo data — no external images                                       */
/* ------------------------------------------------------------------ */
export const MOCK_MAP_PROPERTIES: MapProperty[] = [
  {
    id: "p1", name: "Brunswick Road HMO", address: "12 Brunswick Road", city: "Nottingham", postcode: "NG1 4EX",
    type: "HMO", status: "active", operationProfile: "HMO", units: 6, occupied: 5, monthlyRent: 2850, arrears: 475, openWork: 2,
    healthScore: "watch", lat: 52.9548, lng: -1.1581, coverImage: "",
  },
  {
    id: "p2", name: "Maple Street HMO", address: "34 Maple Street", city: "Birmingham", postcode: "B1 2QR",
    type: "HMO", status: "active", operationProfile: "HMO", units: 8, occupied: 8, monthlyRent: 3600, arrears: 0, openWork: 0,
    healthScore: "healthy", lat: 52.4862, lng: -1.8904, coverImage: "",
  },
  {
    id: "p3", name: "Victoria Terrace", address: "8 Victoria Terrace", city: "Leeds", postcode: "LS1 3XY",
    type: "BTL", status: "vacant", operationProfile: "Long-Term Let", units: 1, occupied: 0, monthlyRent: 0, arrears: 0, openWork: 1,
    healthScore: "at_risk", lat: 53.8008, lng: -1.5491, coverImage: "",
  },
  {
    id: "p4", name: "Oak Lane BTL", address: "22 Oak Lane", city: "Manchester", postcode: "M14 5FG",
    type: "BTL", status: "active", operationProfile: "Long-Term Let", units: 1, occupied: 1, monthlyRent: 1100, arrears: 0, openWork: 0,
    healthScore: "healthy", lat: 53.4808, lng: -2.2426, coverImage: "",
  },
  {
    id: "p5", name: "City Centre SA", address: "15 Piccadilly", city: "Manchester", postcode: "M1 1HP",
    type: "SA", status: "active", operationProfile: "Serviced Accommodation", units: 2, occupied: 1, monthlyRent: 1800, arrears: 0, openWork: 0,
    healthScore: "watch", lat: 53.4792, lng: -2.2372, coverImage: "",
  },
  {
    id: "p6", name: "Elms Road R2R", address: "5 Elms Road", city: "Liverpool", postcode: "L8 3QA",
    type: "R2R", status: "under_works", operationProfile: "Rent-to-Rent", units: 5, occupied: 0, monthlyRent: 0, arrears: 0, openWork: 4,
    healthScore: "critical", lat: 53.4084, lng: -2.9916, coverImage: "",
  },
  {
    id: "p7", name: "Harbour View Flat", address: "1A Harbour View", city: "Bristol", postcode: "BS1 5WA",
    type: "BTL", status: "active", operationProfile: "Long-Term Let", units: 1, occupied: 1, monthlyRent: 1200, arrears: 0, openWork: 0,
    healthScore: "healthy", lat: 51.4545, lng: -2.5879, coverImage: "",
  },
  {
    id: "p8", name: "Regent Street Studio", address: "88 Regent Street", city: "London", postcode: "W1B 4EG",
    type: "BTL", status: "active", operationProfile: "Long-Term Let", units: 1, occupied: 1, monthlyRent: 1950, arrears: 0, openWork: 0,
    healthScore: "healthy", lat: 51.5141, lng: -0.1407, coverImage: "",
  },
  {
    id: "p9", name: "Park Lane Co-Living", address: "45 Park Lane", city: "London", postcode: "W1K 1PN",
    type: "Co-Living", status: "active", operationProfile: "Co-Living", units: 12, occupied: 11, monthlyRent: 9600, arrears: 0, openWork: 1,
    healthScore: "healthy", lat: 51.5074, lng: -0.1526, coverImage: "",
  },
  {
    id: "p10", name: "Meadow Court Student", address: "3 Meadow Court", city: "Sheffield", postcode: "S1 2GT",
    type: "Student", status: "active", operationProfile: "Student Let", units: 7, occupied: 7, monthlyRent: 3850, arrears: 0, openWork: 0,
    healthScore: "healthy", lat: 53.3811, lng: -1.4701, coverImage: "",
  },
]

/* ------------------------------------------------------------------ */
/* Config                                                               */
/* ------------------------------------------------------------------ */
export const STATUS_LABELS: Record<string, string> = {
  active: "Active", vacant: "Vacant", under_works: "Under Works", archived: "Archived",
}

export const HEALTH_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; mapColor: string }> = {
  healthy:  { label: "Healthy",  color: "text-emerald-700", bg: "bg-emerald-50",  dot: "bg-emerald-500", mapColor: "#10B981" },
  watch:    { label: "Watch",    color: "text-amber-700",   bg: "bg-amber-50",    dot: "bg-amber-500",   mapColor: "#F59E0B" },
  at_risk:  { label: "At Risk",  color: "text-red-700",     bg: "bg-red-50",      dot: "bg-red-500",     mapColor: "#EF4444" },
  critical: { label: "Critical", color: "text-red-800",     bg: "bg-red-100",     dot: "bg-red-600",     mapColor: "#DC2626" },
}

export const STATUS_BADGE: Record<string, "success" | "warning" | "primary" | "default"> = {
  active: "success", vacant: "warning", under_works: "primary", archived: "default",
}

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)
}

const TYPE_GRADIENTS: Record<string, string> = {
  HMO:          "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
  BTL:          "linear-gradient(135deg, #059669 0%, #10B981 100%)",
  SA:           "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
  R2R:          "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
  "Co-Living":  "linear-gradient(135deg, #DB2777 0%, #EC4899 100%)",
  Student:      "linear-gradient(135deg, #0891B2 0%, #0EA5E9 100%)",
  other:        "linear-gradient(135deg, #374151 0%, #6B7280 100%)",
}

/* ------------------------------------------------------------------ */
/* OpenStreetMap component (dynamic import — no SSR)                   */
/* ------------------------------------------------------------------ */
const LeafletMap = dynamic(() => import("@/components/portfolio/LeafletMap"), { ssr: false, loading: () => <Skeleton className="flex-1 h-full rounded-2xl" /> })

/* ------------------------------------------------------------------ */
/* Side list card                                                       */
/* ------------------------------------------------------------------ */
function PropertyListCard({ property, selected, onClick }: { property: MapProperty; selected: boolean; onClick: () => void }) {
  const health = HEALTH_CONFIG[property.healthScore]
  const occupancyPct = property.units > 0 ? Math.round((property.occupied / property.units) * 100) : 0

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-xl border transition-all duration-150 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30",
        selected
          ? "border-[#2563EB] bg-blue-50/70 shadow-sm ring-1 ring-[#2563EB]/20"
          : "border-transparent hover:border-slate-200 hover:bg-slate-50/80"
      )}
    >
      <div className="flex gap-3">
        {/* Cover thumbnail */}
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-sm flex items-center justify-center"
          style={{ background: TYPE_GRADIENTS[property.type] ?? TYPE_GRADIENTS.other }}>
          <Building2 size={20} className="text-white opacity-60" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5">
            <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{property.name}</p>
            <Badge variant={STATUS_BADGE[property.status] ?? "default"} size="sm" className="shrink-0 text-[10px]">
              {STATUS_LABELS[property.status]}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{property.city} · {property.postcode}</p>

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md", health.bg, health.color)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", health.dot)} />
              {health.label}
            </span>
            <span className="text-[11px] text-slate-500">{property.units}u</span>
            <span className={cn("text-[11px] font-medium", occupancyPct === 100 ? "text-emerald-600" : occupancyPct >= 70 ? "text-amber-600" : "text-red-600")}>
              {occupancyPct}%
            </span>
            {property.monthlyRent > 0 && (
              <span className="text-[11px] text-emerald-700 font-semibold">{formatCurrency(property.monthlyRent)}</span>
            )}
            {property.arrears > 0 && (
              <span className="text-[10px] text-red-600 font-medium flex items-center gap-0.5 bg-red-50 px-1.5 py-0.5 rounded-md">
                <AlertTriangle className="w-2.5 h-2.5" />Arrears
              </span>
            )}
            {property.openWork > 0 && (
              <span className="text-[10px] text-amber-700 font-medium flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-md">
                <Wrench className="w-2.5 h-2.5" />{property.openWork}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function PortfolioMapPage() {
  const { workspace, isLoading: wsLoading } = useWorkspace()
  const { data: rawProps, isLoading: propsLoading } = useProperties(workspace?.id)
  const { data: rawUnits } = useUnits(workspace?.id)
  const { data: rawTenancies } = useTenancies(workspace?.id)

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterHealth, setFilterHealth] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const isLive = !!workspace?.id
  const loading = wsLoading || propsLoading

  /* All live properties (mapped), regardless of whether they have coordinates. */
  const allProperties: MapProperty[] = useMemo(() => {
    if (!isLive) return MOCK_MAP_PROPERTIES
    if (!rawProps?.length) return []
    const agg = aggregateByProperty(
      (rawUnits ?? []).map(u => ({ property_id: u.property_id, status: u.status, target_rent: u.target_rent })),
      (rawTenancies ?? []).map(t => ({ property_id: t.property_id, status: t.status, rent_amount: t.rent_amount })),
    )
    return rawProps.map((p) => {
      const a = agg.get(p.id)
      const units = a && a.units > 0 ? a.units : 1
      const occupied = a && a.units > 0 ? a.occupied : (p.status === "active" ? 1 : 0)
      return {
        id: p.id,
        name: p.name,
        address: p.address_line1 ?? "",
        city: p.city ?? "",
        postcode: p.postcode ?? "",
        type: p.property_type ?? "other",
        status: (p.status ?? "active") as MapProperty["status"],
        operationProfile: p.operation_profile ?? "Unassigned",
        units,
        occupied,
        monthlyRent: p.target_rent ?? 0,
        arrears: 0,
        openWork: 0,
        // No health-score column yet: keep neutral rather than fabricating risk.
        healthScore: "healthy" as const,
        lat: p.latitude ?? NaN,
        lng: p.longitude ?? NaN,
        coverImage: p.cover_image_url ?? "",
      }
    })
  }, [rawProps, rawUnits, rawTenancies, isLive])

  /* Only properties with real coordinates can be plotted. */
  const properties = useMemo(
    () => allProperties.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
    [allProperties],
  )
  const unmappedCount = allProperties.length - properties.length

  const filtered = useMemo(() => {
    let r = [...properties]
    if (search) r = r.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.postcode.toLowerCase().includes(search.toLowerCase())
    )
    if (filterStatus !== "all") r = r.filter((p) => p.status === filterStatus)
    if (filterHealth !== "all") r = r.filter((p) => p.healthScore === filterHealth)
    return r
  }, [properties, search, filterStatus, filterHealth])

  function handleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  const totalRent = filtered.filter((p) => p.status === "active").reduce((s, p) => s + p.monthlyRent, 0)
  const vacantCount = filtered.filter((p) => p.status === "vacant").length
  const atRiskCount = filtered.filter((p) => p.healthScore === "at_risk" || p.healthScore === "critical").length

  return (
    <DashboardContainer>
      <PageHeader
        title="Portfolio Map"
        description={`${filtered.length} of ${properties.length} mapped${unmappedCount > 0 ? ` · ${unmappedCount} without coordinates` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" asChild>
              <Link href="/app/portfolio"><ArrowLeft className="w-4 h-4" />Portfolio</Link>
            </Button>
            <Button variant="primary" size="md" asChild>
              <Link href="/app/portfolio/properties/new"><Plus className="w-4 h-4" />Add property</Link>
            </Button>
          </div>
        }
      />

      {/* Summary strip */}
      <div className="flex items-center gap-4 mb-4">
        {[
          { label: "Total rent roll", value: formatCurrency(totalRent), icon: PoundSterling, color: "text-emerald-600" },
          { label: "Vacant", value: String(vacantCount), icon: Home, color: vacantCount > 0 ? "text-amber-600" : "text-slate-400" },
          { label: "At risk", value: String(atRiskCount), icon: AlertTriangle, color: atRiskCount > 0 ? "text-red-600" : "text-slate-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-sm">
            <Icon className={cn("w-4 h-4", color)} />
            <span className={cn("font-semibold", color)}>{value}</span>
            <span className="text-slate-400 text-xs">{label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex gap-4 h-[calc(100vh-240px)]">
          <Skeleton className="w-80 h-full rounded-2xl shrink-0" />
          <Skeleton className="flex-1 h-full rounded-2xl" />
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm h-[calc(100vh-240px)] min-h-[520px] gap-5 text-center px-6">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
            <Map className="w-10 h-10 text-slate-300" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-700">
              {allProperties.length === 0 ? "No properties to map yet" : "No mapped properties"}
            </p>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              {allProperties.length === 0
                ? "Add a property to see it plotted on the map."
                : `${unmappedCount} propert${unmappedCount === 1 ? "y has" : "ies have"} no coordinates. Add a latitude and longitude to plot ${unmappedCount === 1 ? "it" : "them"}.`}
            </p>
          </div>
          <Button variant="primary" size="md" asChild>
            <Link href="/app/portfolio/properties/new"><Plus className="w-4 h-4" />Add property</Link>
          </Button>
        </div>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-240px)] min-h-[520px]">
          {/* ── Side list ──────────────────────────────────────────── */}
          <div className="w-80 shrink-0 flex flex-col gap-2.5">
            {/* Search + filter header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className={cn("w-8 h-8 rounded-lg flex items-center justify-center border transition-colors shrink-0", showFilters ? "bg-[#2563EB] border-[#2563EB] text-white" : "border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300")}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>

              {showFilters && (
                <div className="flex gap-2 pt-1 border-t border-slate-100">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="flex-1 h-7 px-2 rounded-lg text-[11px] bg-slate-50 border border-slate-200 text-slate-600 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="vacant">Vacant</option>
                    <option value="under_works">Under Works</option>
                  </select>
                  <select
                    value={filterHealth}
                    onChange={(e) => setFilterHealth(e.target.value)}
                    className="flex-1 h-7 px-2 rounded-lg text-[11px] bg-slate-50 border border-slate-200 text-slate-600 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All health</option>
                    <option value="healthy">Healthy</option>
                    <option value="watch">Watch</option>
                    <option value="at_risk">At Risk</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              )}

              <p className="text-[10px] text-slate-400">{filtered.length} propert{filtered.length !== 1 ? "ies" : "y"}</p>
            </div>

            {/* Scrollable property list */}
            <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex flex-col gap-0.5">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-3 py-12">
                  <Building2 className="w-10 h-10 text-slate-200" />
                  <p className="text-xs text-slate-400 text-center">No properties match your filters</p>
                  <button
                    onClick={() => { setSearch(""); setFilterStatus("all"); setFilterHealth("all") }}
                    className="text-xs text-[#2563EB] hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                filtered.map((p) => (
                  <PropertyListCard
                    key={p.id}
                    property={p}
                    selected={selectedId === p.id}
                    onClick={() => handleSelect(p.id)}
                  />
                ))
              )}
            </div>

            {/* Health legend */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Health Score</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(HEALTH_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setFilterHealth((prev) => prev === key ? "all" : key)}
                    className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border transition-all",
                      filterHealth === key ? cn(cfg.bg, cfg.color, "border-current/30 shadow-sm") : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Map ───────────────────────────────────────────────── */}
          <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <LeafletMap
              properties={filtered}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </div>
        </div>
      )}
    </DashboardContainer>
  )
}
