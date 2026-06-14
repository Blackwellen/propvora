"use client"

import React, { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { PropertyCard, type PropertyCardData } from "@/components/portfolio/PropertyCard"
import { PropertyTable } from "@/components/portfolio/PropertyTable"
import { OperationProfileBadge, ALL_OPERATION_PROFILES } from "@/components/portfolio/OperationProfileBadge"
import { CommercialHealthBadge } from "@/components/portfolio/CommercialHealthScore"
import type { HealthLevel } from "@/components/portfolio/CommercialHealthScore"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperties } from "@/hooks/useProperties"
import { useUnits } from "@/hooks/useUnits"
import { useTenancies } from "@/hooks/useTenancies"
import { LayoutGrid, List, Plus, Search, Building2, ChevronLeft, ChevronRight, X, SlidersHorizontal, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { aggregateByProperty, normaliseOperationProfile, normalisePropertyStatus, normalisePropertyType, exportCsv } from "@/lib/portfolio/helpers"
import { createClient } from "@/lib/supabase/client"
import { resolvePropertyCoverUrls } from "@/lib/files/coverUrl"
import { getPropertyTypeOption } from "@/lib/constants/propertyTypes"

/* ------------------------------------------------------------------ */
/* Mock data — no external images                                      */
/* ------------------------------------------------------------------ */
const MOCK: PropertyCardData[] = [
  { id: "p1",  name: "Brunswick Road HMO",   address: "12 Brunswick Road, Nottingham",postcode: "NG1 4EX",  type: "HMO", status: "Active",       units: 6, occupied: 5, tenants: 5, monthlyRent: 2850, operationProfile: "HMO",                   bedrooms: 6, bathrooms: 3, arrears: 475, openWork: 2, healthScore: "watch" },
  { id: "p2",  name: "Maple Street HMO",     address: "34 Maple Street, Birmingham",  postcode: "B1 2QR",   type: "HMO", status: "Active",       units: 8, occupied: 8, tenants: 8, monthlyRent: 3600, operationProfile: "HMO",                   bedrooms: 8, bathrooms: 4, arrears: 0,   openWork: 0, healthScore: "healthy" },
  { id: "p3",  name: "Victoria Terrace",     address: "8 Victoria Terrace, Leeds",    postcode: "LS1 3XY",  type: "BTL", status: "Vacant",       units: 1, occupied: 0, tenants: 0, monthlyRent: 0,    operationProfile: "Long-Term Let",          bedrooms: 3, bathrooms: 1, arrears: 0,   openWork: 1, healthScore: "at_risk" },
  { id: "p4",  name: "Oak Lane BTL",          address: "22 Oak Lane, Manchester",      postcode: "M14 5FG",  type: "BTL", status: "Active",       units: 1, occupied: 1, tenants: 2, monthlyRent: 1100, operationProfile: "Long-Term Let",          bedrooms: 2, bathrooms: 1, arrears: 0,   openWork: 0, healthScore: "healthy" },
  { id: "p5",  name: "City Centre SA",        address: "15 Piccadilly, Manchester",    postcode: "M1 1HP",   type: "SA",  status: "Active",       units: 2, occupied: 1, tenants: 0, monthlyRent: 1800, operationProfile: "Serviced Accommodation", bedrooms: 2, bathrooms: 2, arrears: 0,   openWork: 0, healthScore: "watch" },
  { id: "p6",  name: "Elms Road R2R",         address: "5 Elms Road, Liverpool",       postcode: "L8 3QA",   type: "R2R", status: "Under Works",  units: 5, occupied: 0, tenants: 0, monthlyRent: 0,    operationProfile: "Rent-to-Rent",           bedrooms: 5, bathrooms: 2, arrears: 0,   openWork: 4, healthScore: "critical" },
  { id: "p7",  name: "Harbour View Flat",     address: "1A Harbour View, Bristol",     postcode: "BS1 5WA",  type: "BTL", status: "Active",       units: 1, occupied: 1, tenants: 1, monthlyRent: 1200, operationProfile: "Long-Term Let",          bedrooms: 1, bathrooms: 1, arrears: 0,   openWork: 0, healthScore: "healthy" },
  { id: "p8",  name: "Regent Street Studio",  address: "88 Regent Street, London",    postcode: "W1B 4EG",  type: "BTL", status: "Active",       units: 1, occupied: 1, tenants: 1, monthlyRent: 1950, operationProfile: "Long-Term Let",          bedrooms: 1, bathrooms: 1, arrears: 0,   openWork: 0, healthScore: "healthy" },
  { id: "p9",  name: "Park Lane Co-Living",   address: "45 Park Lane, London",         postcode: "W1K 1PN",  type: "Other",status: "Active",      units: 12,occupied: 11,tenants: 11,monthlyRent: 9600, operationProfile: "Co-Living",              bedrooms: 12,bathrooms: 6, arrears: 0,   openWork: 1, healthScore: "healthy" },
  { id: "p10", name: "Meadow Court Student",  address: "3 Meadow Court, Sheffield",    postcode: "S1 2GT",   type: "Other",status: "Active",      units: 7, occupied: 7, tenants: 7, monthlyRent: 3850, operationProfile: "Student Let",            bedrooms: 7, bathrooms: 3, arrears: 0,   openWork: 0, healthScore: "healthy" },
]

const PAGE_SIZE = 12

const HEALTH_OPTIONS: { key: string; label: string }[] = [
  { key: "all", label: "All health" },
  { key: "healthy", label: "Healthy" },
  { key: "watch",   label: "Watch" },
  { key: "at_risk", label: "At Risk" },
  { key: "critical","label": "Critical" },
]

export default function PropertiesListPage() {
  const router = useRouter()
  const { workspace, isLoading: wsLoading } = useWorkspace()
  const [view, setView] = useState<"cards" | "table">("cards")
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterProfile, setFilterProfile] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [filterHealth, setFilterHealth] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const { data: rawProps, isLoading: propsLoading, error } = useProperties(workspace?.id)
  const { data: rawUnits } = useUnits(workspace?.id)
  const { data: rawTenancies } = useTenancies(workspace?.id)
  const loading = wsLoading || propsLoading

  /* Real uploaded cover photos (cover_file_id → /api/files URL), keyed by
     property id. Empty when none/unavailable → cards keep gradient fallback. */
  const [coverUrls, setCoverUrls] = useState<Map<string, string>>(new Map())
  useEffect(() => {
    if (!workspace?.id) { setCoverUrls(new Map()); return }
    let active = true
    resolvePropertyCoverUrls(createClient(), workspace.id)
      .then((m) => { if (active) setCoverUrls(m) })
      .catch(() => { if (active) setCoverUrls(new Map()) })
    return () => { active = false }
  }, [workspace?.id, rawProps])

  const allProperties: PropertyCardData[] = useMemo(() => {
    if (!workspace?.id) return MOCK
    if (!rawProps?.length) return []
    const agg = aggregateByProperty(
      (rawUnits ?? []).map(u => ({ property_id: u.property_id, status: u.status, target_rent: u.target_rent })),
      (rawTenancies ?? []).map(t => ({ property_id: t.property_id, status: t.status, rent_amount: t.rent_amount })),
    )
    return rawProps.map((p) => {
      const a = agg.get(p.id)
      const unitCount = a && a.units > 0 ? a.units : 1
      const occupied = a && a.units > 0 ? a.occupied : (p.status === "active" ? 1 : 0)
      return {
        id: p.id, name: p.name,
        address: [p.address_line1, p.city].filter(Boolean).join(", ") ?? "",
        postcode: p.postcode ?? "",
        type: normalisePropertyType(p.property_type) as PropertyCardData["type"],
        category: p.category ?? null,
        status: normalisePropertyStatus(p.status) as PropertyCardData["status"],
        units: unitCount, occupied, tenants: a?.tenants ?? 0,
        monthlyRent: (a && a.unitRent > 0 ? a.unitRent : p.target_rent) ?? 0,
        operationProfile: normaliseOperationProfile(p.operation_profile),
        bedrooms: p.bedrooms ?? undefined, bathrooms: p.bathrooms ?? undefined,
        coverImageUrl: coverUrls.get(p.id) ?? p.cover_image_url ?? undefined,
      }
    })
  }, [rawProps, rawUnits, rawTenancies, workspace?.id, coverUrls])

  /* Distinct dwelling types present in the live data — drives the Type filter. */
  const typeOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const p of allProperties) {
      if (!p.category || seen.has(p.category)) continue
      seen.set(p.category, getPropertyTypeOption(p.category)?.label ?? p.category)
    }
    return Array.from(seen, ([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [allProperties])

  const filtered = useMemo(() => {
    let r = [...allProperties]
    if (search) r = r.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase()) || p.postcode.toLowerCase().includes(search.toLowerCase()))
    if (filterStatus !== "all") r = r.filter((p) => p.status === filterStatus)
    if (filterProfile !== "all") r = r.filter((p) => p.operationProfile === filterProfile)
    if (filterType !== "all") r = r.filter((p) => p.category === filterType)
    if (filterHealth !== "all") r = r.filter((p) => p.healthScore === filterHealth)
    r.sort((a, b) => {
      if (sortBy === "rent") return b.monthlyRent - a.monthlyRent
      if (sortBy === "updated") return b.id.localeCompare(a.id)
      return a.name.localeCompare(b.name)
    })
    return r
  }, [allProperties, search, filterStatus, filterProfile, filterType, filterHealth, sortBy])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const activeFilters = [filterStatus !== "all", filterProfile !== "all", filterType !== "all", filterHealth !== "all"].filter(Boolean).length

  function clearFilters() { setSearch(""); setFilterStatus("all"); setFilterProfile("all"); setFilterType("all"); setFilterHealth("all"); setPage(1) }

  /* Health filter only meaningful when the data carries health scores (mock/demo). */
  const hasHealthScores = allProperties.some(p => p.healthScore)

  function handleExport() {
    exportCsv(
      filtered.map(p => ({
        name: p.name, address: p.address, postcode: p.postcode,
        type: p.type, dwelling_type: p.category ? (getPropertyTypeOption(p.category)?.label ?? p.category) : "",
        operation_profile: p.operationProfile, status: p.status,
        units: p.units, occupied: p.occupied ?? 0, monthly_rent: p.monthlyRent,
      })),
      `properties-${new Date().toISOString().slice(0, 10)}.csv`,
    )
  }

  return (
    <DashboardContainer>
      <PageHeader
        title="Properties"
        description={`${filtered.length} propert${filtered.length !== 1 ? "ies" : "y"}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" onClick={handleExport} disabled={filtered.length === 0}>
              <Download className="w-4 h-4" />Export
            </Button>
            <Button variant="primary" size="md" asChild>
              <Link href="/app/portfolio/properties/new"><Plus className="w-4 h-4" />Add property</Link>
            </Button>
          </div>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search properties..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full h-9 pl-9 pr-4 rounded-xl text-sm bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all shadow-sm"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className={cn("relative flex items-center gap-1.5 h-9 px-3 rounded-xl border text-sm font-medium transition-all shadow-sm",
            showFilters ? "bg-[#2563EB] border-[#2563EB] text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300")}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />Filters
          {activeFilters > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{activeFilters}</span>
          )}
        </button>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-9 px-3 rounded-xl text-sm bg-white border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 shadow-sm cursor-pointer"
        >
          <option value="name">Sort: Name</option>
          <option value="rent">Sort: Rent ↓</option>
          <option value="updated">Sort: Recent</option>
        </select>

        {/* View switcher */}
        <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-100 ml-auto">
          <button onClick={() => setView("cards")} className={cn("p-1.5 rounded-lg transition-all", view === "cards" ? "bg-white shadow-sm text-[#2563EB]" : "text-slate-400 hover:text-slate-600")}><LayoutGrid className="w-4 h-4" /></button>
          <button onClick={() => setView("table")} className={cn("p-1.5 rounded-lg transition-all", view === "table" ? "bg-white shadow-sm text-[#2563EB]" : "text-slate-400 hover:text-slate-600")}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
              className="w-full h-9 px-3 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
            >
              <option value="all">All statuses</option>
              <option value="Active">Active</option>
              <option value="Vacant">Vacant</option>
              <option value="Under Works">Under Works</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Operation Profile</label>
            <select
              value={filterProfile}
              onChange={(e) => { setFilterProfile(e.target.value); setPage(1) }}
              className="w-full h-9 px-3 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
            >
              <option value="all">All profiles</option>
              {ALL_OPERATION_PROFILES.filter(p => p !== "Unassigned").map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {typeOptions.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Property Type</label>
              <select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setPage(1) }}
                className="w-full h-9 px-3 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
              >
                <option value="all">All types</option>
                {typeOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          )}
          {hasHealthScores && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Health Score</label>
              <div className="flex flex-wrap gap-1.5">
                {HEALTH_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setFilterHealth(key); setPage(1) }}
                    className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all",
                      filterHealth === key ? "bg-[#2563EB] border-[#2563EB] text-white" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {activeFilters > 0 && (
            <div className="sm:col-span-3 flex justify-end">
              <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                <X className="w-3.5 h-3.5" />Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center"><Building2 className="w-7 h-7 text-red-300" /></div>
          <p className="text-sm font-semibold text-slate-600">Could not load properties</p>
        </div>
      ) : workspace?.id && allProperties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center"><Building2 className="w-10 h-10 text-slate-300" /></div>
          <div><p className="text-base font-bold text-slate-700">No properties yet</p><p className="text-sm text-slate-400 mt-1">Add your first property to get started</p></div>
          <Button variant="primary" size="md" asChild><Link href="/app/portfolio/properties/new"><Plus className="w-4 h-4" />Add first property</Link></Button>
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center"><Search className="w-7 h-7 text-slate-300" /></div>
          <p className="text-sm font-semibold text-slate-600">No properties match your filters</p>
          <Button variant="outline" size="sm" onClick={clearFilters}><X className="w-3.5 h-3.5" />Clear filters</Button>
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      ) : (
        <PropertyTable properties={paginated} onRowClick={(id) => router.push(`/app/portfolio/properties/${id}`)} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={cn("w-8 h-8 rounded-lg text-sm font-semibold transition-colors", page === i + 1 ? "bg-[#2563EB] text-white" : "text-slate-500 hover:bg-slate-100")}>{i + 1}</button>
            ))}
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </DashboardContainer>
  )
}
