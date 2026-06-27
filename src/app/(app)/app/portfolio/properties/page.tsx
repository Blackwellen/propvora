"use client"

import React, { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import { PortfolioSectionTabs } from "@/components/portfolio/PortfolioSectionTabs"
import { PortfolioSegmentsRail } from "@/components/portfolio/PortfolioSegmentsRail"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { PropertyCard, type PropertyCardData } from "@/components/portfolio/PropertyCard"
import { PropertyTable } from "@/components/portfolio/PropertyTable"
import { ALL_OPERATION_PROFILES } from "@/components/portfolio/OperationProfileBadge"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperties } from "@/hooks/useProperties"
import { useUnits } from "@/hooks/useUnits"
import { useTenancies } from "@/hooks/useTenancies"
import { LayoutGrid, List, Plus, Search, Building2, ChevronLeft, ChevronRight, X, SlidersHorizontal, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import MobilePageHeader from "@/components/mobile/MobilePageHeader"
import MobileFilterSheet, { type FilterGroup } from "@/components/mobile/MobileFilterSheet"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile/ResponsiveTable"
import { aggregateByProperty, normaliseOperationProfile, normalisePropertyStatus, normalisePropertyType, exportCsv } from "@/lib/portfolio/helpers"
import { createClient } from "@/lib/supabase/client"
import { resolvePropertyCoverUrls } from "@/lib/files/coverUrl"
import { getPropertyTypeOption } from "@/lib/constants/propertyTypes"

const PAGE_SIZE = 12

export default function PropertiesListPage() {
  const router = useRouter()
  const { workspace, isLoading: wsLoading } = useWorkspace()
  const [view, setView] = useState<"cards" | "table">("cards")
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterProfile, setFilterProfile] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

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
    if (!workspace?.id || !rawProps?.length) return []
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
    r.sort((a, b) => {
      if (sortBy === "rent") return b.monthlyRent - a.monthlyRent
      if (sortBy === "updated") return b.id.localeCompare(a.id)
      return a.name.localeCompare(b.name)
    })
    return r
  }, [allProperties, search, filterStatus, filterProfile, filterType, sortBy])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const activeFilters = [filterStatus !== "all", filterProfile !== "all", filterType !== "all"].filter(Boolean).length

  function clearFilters() { setSearch(""); setFilterStatus("all"); setFilterProfile("all"); setFilterType("all"); setPage(1) }

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

  /* ── Mobile filter groups (mirror the desktop filter panel) ───────────── */
  const mobileFilterGroups: FilterGroup[] = [
    {
      key: "status",
      label: "Status",
      value: filterStatus,
      onChange: (v) => { setFilterStatus(v); setPage(1) },
      options: [
        { value: "all", label: "All" },
        { value: "Active", label: "Active" },
        { value: "Vacant", label: "Vacant" },
        { value: "Under Works", label: "Under Works" },
        { value: "Archived", label: "Archived" },
      ],
    },
    {
      key: "profile",
      label: "Operation Profile",
      value: filterProfile,
      onChange: (v) => { setFilterProfile(v); setPage(1) },
      options: [
        { value: "all", label: "All" },
        ...ALL_OPERATION_PROFILES.filter((p) => p !== "Unassigned").map((p) => ({ value: p, label: p })),
      ],
    },
    ...(typeOptions.length > 0
      ? [{
          key: "type",
          label: "Property Type",
          value: filterType,
          onChange: (v: string) => { setFilterType(v); setPage(1) },
          options: [{ value: "all", label: "All" }, ...typeOptions],
        } as FilterGroup]
      : []),
  ]

  /* ── Row → card mapping for the mobile card list ──────────────────────── */
  const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
    Active: { label: "Occupied", cls: "bg-emerald-50 text-emerald-700" },
    Vacant: { label: "Vacant", cls: "bg-amber-50 text-amber-700" },
    "Under Works": { label: "In Progress", cls: "bg-[var(--brand-soft)] text-[var(--brand)]" },
    Archived: { label: "Archived", cls: "bg-slate-100 text-slate-600" },
  }
  const propertyCardMapping: MobileCardMapping<PropertyCardData> = {
    getKey: (p) => p.id,
    title: (p) => p.name,
    subtitle: (p) => [p.address, p.postcode].filter(Boolean).join(", ") || "—",
    leading: (p) => (
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[#0EA5E9] flex items-center justify-center shrink-0">
        <Building2 className="w-5 h-5 text-white/80" />
      </div>
    ),
    badge: (p) => {
      const s = STATUS_CHIP[p.status] ?? STATUS_CHIP.Active
      return <span className={cn("inline-flex text-[10.5px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap", s.cls)}>{s.label}</span>
    },
    fields: [
      { label: "Type", render: (p) => p.type },
      { label: "Units", render: (p) => String(p.units) },
      {
        label: "Occupancy",
        render: (p) => p.units > 0 ? `${Math.round(((p.occupied ?? p.tenants) / p.units) * 100)}%` : "—",
      },
      {
        label: "Rent / mo",
        render: (p) => p.monthlyRent > 0
          ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p.monthlyRent)
          : "—",
      },
    ],
    onRowClick: (p) => router.push(`/property-manager/portfolio/properties/${p.id}`),
  }

  return (
    <DashboardContainer>
      <PortfolioSectionTabs />
      {/* Mobile top bar — compact title + primary "Add" + Export overflow */}
      <MobileTopBar
        title="Properties"
        subtitle={`${filtered.length} propert${filtered.length !== 1 ? "ies" : "y"}`}
        primaryAction={{ label: "Add property", icon: Plus, href: "/property-manager/portfolio/properties/new" }}
        overflowActions={[
          { label: "Export CSV", icon: Download, onClick: handleExport },
        ]}
      />

      {/* Mobile page header — search + filter sheet trigger (replaces desktop toolbar on phones) */}
      <MobilePageHeader hideTitle
        title="Properties"
        count={`${filtered.length} shown`}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Search properties…"
        onOpenFilters={() => setShowMobileFilters(true)}
        activeFilterCount={activeFilters}
        actions={
          <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-100">
            <button onClick={() => setView("cards")} aria-label="Card view" aria-pressed={view === "cards"} className={cn("w-9 h-9 rounded-lg flex items-center justify-center transition-all", view === "cards" ? "bg-white shadow-sm text-[var(--brand)]" : "text-slate-400")}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setView("table")} aria-label="List view" aria-pressed={view === "table"} className={cn("w-9 h-9 rounded-lg flex items-center justify-center transition-all", view === "table" ? "bg-white shadow-sm text-[var(--brand)]" : "text-slate-400")}><List className="w-4 h-4" /></button>
          </div>
        }
      />

      <MobileFilterSheet
        open={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        groups={mobileFilterGroups}
        activeCount={activeFilters}
        onClear={clearFilters}
      />

      {/* Browse-by-segment rail — the 13-profile hero ported from the Portfolio
          Overview. Counts use the full (unfiltered) set; clicking toggles the
          page's profile filter so the rail and the list stay in lockstep. */}
      {!loading && allProperties.length > 0 && (
        <PortfolioSegmentsRail
          properties={allProperties}
          activeProfile={filterProfile}
          onSelect={(label) => { setFilterProfile(label); setPage(1) }}
        />
      )}

      {/* Desktop header — hidden on phones (MobileTopBar/Header own mobile) */}
      <div className="hidden md:block">
      <PageHeader
        title="Properties"
        description={`${filtered.length} propert${filtered.length !== 1 ? "ies" : "y"}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" onClick={handleExport} disabled={filtered.length === 0}>
              <Download className="w-4 h-4" />Export
            </Button>
            <Button variant="primary" size="md" asChild>
              <Link href="/property-manager/portfolio/properties/new"><Plus className="w-4 h-4" />Add property</Link>
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
            className="w-full h-9 pl-9 pr-4 rounded-xl text-sm bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all shadow-sm"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className={cn("relative flex items-center gap-1.5 h-9 px-3 rounded-xl border text-sm font-medium transition-all shadow-sm",
            showFilters ? "bg-[var(--brand)] border-[var(--brand)] text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300")}
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
          className="h-9 px-3 rounded-xl text-sm bg-white border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 shadow-sm cursor-pointer"
        >
          <option value="name">Sort: Name</option>
          <option value="rent">Sort: Rent ↓</option>
          <option value="updated">Sort: Recent</option>
        </select>

        {/* View switcher */}
        <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-100 ml-auto">
          <button onClick={() => setView("cards")} className={cn("p-1.5 rounded-lg transition-all", view === "cards" ? "bg-white shadow-sm text-[var(--brand)]" : "text-slate-400 hover:text-slate-600")}><LayoutGrid className="w-4 h-4" /></button>
          <button onClick={() => setView("table")} className={cn("p-1.5 rounded-lg transition-all", view === "table" ? "bg-white shadow-sm text-[var(--brand)]" : "text-slate-400 hover:text-slate-600")}><List className="w-4 h-4" /></button>
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
              className="w-full h-9 px-3 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer"
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
              className="w-full h-9 px-3 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer"
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
                className="w-full h-9 px-3 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer"
              >
                <option value="all">All types</option>
                {typeOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
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
      </div>
      {/* end desktop header/toolbar (hidden on phones) */}

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
          <div><p className="text-base font-bold text-slate-700">No properties yet</p><p className="text-sm text-slate-500 mt-1">Add your first property to get started</p></div>
          <Button variant="primary" size="md" asChild><Link href="/property-manager/portfolio/properties/new"><Plus className="w-4 h-4" />Add first property</Link></Button>
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
        /* Desktop renders the existing PropertyTable; phones get a stacked card
           list via the column→card mapping. No data/logic change. */
        <ResponsiveTable rows={paginated} mobile={propertyCardMapping}>
          <PropertyTable properties={paginated} onRowClick={(id) => router.push(`/property-manager/portfolio/properties/${id}`)} />
        </ResponsiveTable>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={cn("w-8 h-8 rounded-lg text-sm font-semibold transition-colors", page === i + 1 ? "bg-[var(--brand)] text-white" : "text-slate-500 hover:bg-slate-100")}>{i + 1}</button>
            ))}
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </DashboardContainer>
  )
}
