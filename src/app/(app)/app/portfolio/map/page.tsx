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
  List,
} from "lucide-react"
import { cn } from "@/lib/utils"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { MobileSheet, useIsMobile } from "@/components/mobile"

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
          <p className="text-[11px] text-slate-500 truncate mt-0.5">{property.city} · {property.postcode}</p>

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
  const [listSheetOpen, setListSheetOpen] = useState(false)

  const isMobile = useIsMobile()
  const isLive = !!workspace?.id
  const loading = wsLoading || propsLoading

  /* All live properties (mapped), regardless of whether they have coordinates. */
  const allProperties: MapProperty[] = useMemo(() => {
    if (!isLive || !rawProps?.length) return []
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

  /* On mobile the list lives in a bottom sheet; picking a property should
     dismiss the sheet so the map (and its popup) becomes visible. */
  function handleSelectFromList(id: string) {
    handleSelect(id)
    if (isMobile) setListSheetOpen(false)
  }

  const totalRent = filtered.filter((p) => p.status === "active").reduce((s, p) => s + p.monthlyRent, 0)
  const vacantCount = filtered.filter((p) => p.status === "vacant").length
  const atRiskCount = filtered.filter((p) => p.healthScore === "at_risk" || p.healthScore === "critical").length

  /* Shared side-list content — rendered inline as the desktop rail and inside
     the MobileSheet on phones. `inSheet` drops the rail's own scroll wrapper so
     the sheet owns scrolling. */
  function renderSideContent(inSheet: boolean) {
    return (
      <>
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
                className="w-full h-9 pl-8 pr-3 rounded-lg text-sm bg-slate-50 border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              aria-label="Toggle filters"
              className={cn("w-9 h-9 rounded-lg flex items-center justify-center border transition-colors shrink-0", showFilters ? "bg-[#2563EB] border-[#2563EB] text-white" : "border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300")}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {showFilters && (
            <div className="flex gap-2 pt-1 border-t border-slate-100">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 h-9 px-2 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-600 focus:outline-none cursor-pointer"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="vacant">Vacant</option>
                <option value="under_works">Under Works</option>
              </select>
              <select
                value={filterHealth}
                onChange={(e) => setFilterHealth(e.target.value)}
                className="flex-1 h-9 px-2 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-600 focus:outline-none cursor-pointer"
              >
                <option value="all">All health</option>
                <option value="healthy">Healthy</option>
                <option value="watch">Watch</option>
                <option value="at_risk">At Risk</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          )}

          <p className="text-[10px] text-slate-500">{filtered.length} propert{filtered.length !== 1 ? "ies" : "y"}</p>
        </div>

        {/* Scrollable property list */}
        <div className={cn(
          "bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex flex-col gap-0.5",
          inSheet ? "" : "flex-1 overflow-y-auto",
        )}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 py-12">
              <Building2 className="w-10 h-10 text-slate-200" />
              <p className="text-xs text-slate-500 text-center">No properties match your filters</p>
              <button
                onClick={() => { setSearch(""); setFilterStatus("all"); setFilterHealth("all") }}
                className="text-xs text-[#2563EB] hover:underline min-h-[44px]"
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
                onClick={() => handleSelectFromList(p.id)}
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
                  "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-full border transition-all",
                  filterHealth === key ? cn(cfg.bg, cfg.color, "border-current/30 shadow-sm") : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </>
    )
  }

  return (
    <DashboardContainer>
      {/* Mobile top bar */}
      <MobileTopBar
        title="Portfolio Map"
        subtitle={`${filtered.length} of ${properties.length} mapped`}
        showBack
        backHref="/app/portfolio"
        primaryAction={{ label: "Add property", icon: Plus, href: "/app/portfolio/properties/new" }}
      />

      {/* Desktop header — hidden on phones */}
      <div className="hidden md:block">
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
      </div>

      {/* Summary strip */}
      <div className="flex items-center gap-4 mb-4 overflow-x-auto">
        {[
          { label: "Total rent roll", value: formatCurrency(totalRent), icon: PoundSterling, color: "text-emerald-600" },
          { label: "Vacant", value: String(vacantCount), icon: Home, color: vacantCount > 0 ? "text-amber-600" : "text-slate-400" },
          { label: "At risk", value: String(atRiskCount), icon: AlertTriangle, color: atRiskCount > 0 ? "text-red-600" : "text-slate-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-sm">
            <Icon className={cn("w-4 h-4", color)} />
            <span className={cn("font-semibold", color)}>{value}</span>
            <span className="text-slate-500 text-xs">{label}</span>
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
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
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
        <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-240px)] lg:min-h-[520px]">
          {/* ── Side list (desktop rail only) ──────────────────────── */}
          <div className="hidden lg:flex lg:w-80 shrink-0 flex-col gap-2.5">
            {renderSideContent(false)}
          </div>

          {/* ── Map ───────────────────────────────────────────────── */}
          {/* Full-bleed on phones so the map isn't crushed by the rail;
             the list moves into the bottom sheet below. The phone height
             leaves clearance above the fixed bottom nav. */}
          <div className="relative flex-1 h-[calc(100vh-300px)] min-h-[360px] lg:h-auto lg:min-h-[420px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <LeafletMap
              properties={filtered}
              selectedId={selectedId}
              onSelect={handleSelect}
            />

            {/* Floating "N results" button — opens the list sheet (phones only). */}
            <button
              onClick={() => setListSheetOpen(true)}
              className="lg:hidden absolute left-1/2 -translate-x-1/2 bottom-4 z-[400] inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[#2563EB] text-white text-sm font-semibold shadow-[0_6px_24px_rgba(37,99,235,0.4)] active:scale-95 transition-transform"
            >
              <List className="w-4 h-4" />
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </button>
          </div>

          {/* ── Mobile list sheet ─────────────────────────────────── */}
          <MobileSheet
            open={listSheetOpen}
            onClose={() => setListSheetOpen(false)}
            title="Properties"
            description={`${filtered.length} of ${properties.length} mapped`}
          >
            <div className="flex flex-col gap-2.5 pb-2">
              {renderSideContent(true)}
            </div>
          </MobileSheet>
        </div>
      )}
    </DashboardContainer>
  )
}
