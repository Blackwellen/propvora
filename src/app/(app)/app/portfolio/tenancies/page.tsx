"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { TenancyCard, type TenancyCardData } from "@/components/portfolio/TenancyCard"
import { useWorkspace } from "@/providers/AuthProvider"
import { useTenancies } from "@/hooks/useTenancies"
import { useProperties } from "@/hooks/useProperties"
import {
  Plus, Search, Users, ChevronLeft, ChevronRight, X,
  AlertTriangle, Calendar, SlidersHorizontal, MapPin, Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { normaliseOperationProfile, exportCsv } from "@/lib/portfolio/helpers"

/* ------------------------------------------------------------------ */
/* 13 Operational Profiles (shared constant)                            */
/* ------------------------------------------------------------------ */
const ALL_PROFILES = [
  { key: "HMO",                    label: "HMO",                    shortLabel: "HMO",        color: "#1D4ED8" },
  { key: "Long-Term Let",          label: "Long-Term Let",          shortLabel: "LTL",        color: "#059669" },
  { key: "Serviced Accommodation", label: "Serviced Accommodation", shortLabel: "SA",         color: "#7C3AED" },
  { key: "Rent-to-Rent",           label: "Rent-to-Rent",           shortLabel: "R2R",        color: "#EA580C" },
  { key: "Student Let",            label: "Student Let",            shortLabel: "Student",    color: "#0891B2" },
  { key: "Co-Living",              label: "Co-Living",              shortLabel: "Co-Living",  color: "#DB2777" },
  { key: "Holiday Let",            label: "Holiday Let",            shortLabel: "Holiday",    color: "#D97706" },
  { key: "Social Housing",         label: "Social Housing",         shortLabel: "Social",     color: "#16A34A" },
  { key: "Supported Living",       label: "Supported Living",       shortLabel: "Supported",  color: "#0369A1" },
  { key: "Commercial",             label: "Commercial",             shortLabel: "Commercial", color: "#374151" },
  { key: "Mixed Use",              label: "Mixed Use",              shortLabel: "Mixed",      color: "#6B21A8" },
  { key: "Development",            label: "Development",            shortLabel: "Dev",        color: "#B45309" },
  { key: "Buy-to-Sell",            label: "Buy-to-Sell",            shortLabel: "BTS",        color: "#BE123C" },
]

const PAGE_SIZE = 12

function daysUntil(d: string) { return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) }

/* ── Chip ── */
function Chip({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all whitespace-nowrap",
        active ? "text-white border-transparent shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm"
      )}
      style={active ? { background: color ?? "#2563EB", borderColor: color ?? "#2563EB" } : undefined}
    >
      {children}
    </button>
  )
}

function FLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{children}</p>
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function TenanciesListPage() {
  const router = useRouter()
  const { workspace, isLoading: wsLoading } = useWorkspace()
  const { data: rawTenancies, isLoading: tenanciesLoading } = useTenancies(workspace?.id)
  const { data: rawProperties } = useProperties(workspace?.id)

  /* Filters */
  const [search, setSearch]               = useState("")
  const [filterStatus, setFilterStatus]   = useState("all")
  const [filterArrears, setFilterArrears] = useState(false)
  const [filterEndingSoon, setFilterEndingSoon] = useState(false)
  const [filterProp, setFilterProp]       = useState("all")
  const [filterProfile, setFilterProfile] = useState("all")
  const [filterMinRent, setFilterMinRent] = useState("")
  const [filterMaxRent, setFilterMaxRent] = useState("")
  const [filterCity, setFilterCity]       = useState("")
  const [showAdv, setShowAdv]             = useState(false)
  const [page, setPage]                   = useState(1)

  const loading = wsLoading || tenanciesLoading

  const allTenancies: TenancyCardData[] = useMemo(() => {
    if (!workspace?.id || !rawTenancies?.length) return []
    const propName = new Map((rawProperties ?? []).map(p => [p.id, p.name]))
    return rawTenancies.map((t) => ({
      id: t.id, property_id: t.property_id, unit_id: t.unit_id,
      property_name: propName.get(t.property_id),
      status: t.status, start_date: t.start_date, end_date: t.end_date,
      rent_amount: t.rent_amount, deposit_amount: t.deposit_amount,
      deposit_held_by: t.deposit_held_by, rent_frequency: t.rent_frequency,
    }))
  }, [rawTenancies, rawProperties, workspace?.id])

  const propertyOptions = useMemo(() => {
    if (!workspace?.id || !rawProperties?.length) return []
    return rawProperties.map(p => ({ id: p.id, name: p.name, operationProfile: normaliseOperationProfile(p.operation_profile) }))
  }, [rawProperties, workspace?.id])

  const filtered = useMemo(() => {
    let r = [...allTenancies]
    const q = search.toLowerCase()
    if (q) r = r.filter(t =>
      (t.tenant_name ?? "").toLowerCase().includes(q) ||
      (t.property_name ?? "").toLowerCase().includes(q) ||
      (t.unit_name ?? "").toLowerCase().includes(q)
    )
    if (filterStatus !== "all") r = r.filter(t => t.status === filterStatus)
    if (filterArrears) r = r.filter(t => (t.arrears ?? 0) > 0)
    if (filterEndingSoon) r = r.filter(t => t.end_date && daysUntil(t.end_date) >= 0 && daysUntil(t.end_date) <= 60)
    if (filterProp !== "all") r = r.filter(t => t.property_id === filterProp)
    if (filterMinRent) r = r.filter(t => t.rent_amount >= Number(filterMinRent))
    if (filterMaxRent) r = r.filter(t => t.rent_amount <= Number(filterMaxRent))
    if (filterProfile !== "all") r = r.filter(t => {
      const prop = propertyOptions.find(p => p.id === t.property_id)
      return prop?.operationProfile === filterProfile
    })
    if (filterCity) r = r.filter(t => (t.property_name ?? "").toLowerCase().includes(filterCity.toLowerCase()))
    return r
  }, [allTenancies, propertyOptions, search, filterStatus, filterArrears, filterEndingSoon, filterProp, filterMinRent, filterMaxRent, filterProfile, filterCity])

  const paginated    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages   = Math.ceil(filtered.length / PAGE_SIZE)
  const activeCount  = allTenancies.filter(t => t.status === "active").length
  const endingSoonCount = allTenancies.filter(t => t.end_date && daysUntil(t.end_date) >= 0 && daysUntil(t.end_date) <= 60).length
  const arrearsCount = allTenancies.filter(t => (t.arrears ?? 0) > 0).length

  const activeFilters = [
    search,
    filterStatus !== "all" ? "1" : "",
    filterArrears ? "1" : "",
    filterEndingSoon ? "1" : "",
    filterProp !== "all" ? "1" : "",
    filterProfile !== "all" ? "1" : "",
    filterMinRent, filterMaxRent, filterCity,
  ].filter(Boolean).length

  const clearAll = () => {
    setSearch(""); setFilterStatus("all"); setFilterArrears(false); setFilterEndingSoon(false)
    setFilterProp("all"); setFilterProfile("all"); setFilterMinRent(""); setFilterMaxRent(""); setFilterCity("")
    setPage(1)
  }

  function handleExport() {
    exportCsv(
      filtered.map(t => ({
        tenant: t.tenant_name ?? "", property: t.property_name ?? "", unit: t.unit_name ?? "",
        status: t.status, start_date: t.start_date ?? "", end_date: t.end_date ?? "",
        rent_amount: t.rent_amount, deposit_amount: t.deposit_amount ?? "",
      })),
      `tenancies-${new Date().toISOString().slice(0, 10)}.csv`,
    )
  }

  return (
    <DashboardContainer>
      <PageHeader
        title="Tenancies"
        description={`${activeCount} active · ${endingSoonCount} ending soon · ${arrearsCount} in arrears`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="md" asChild><Link href="/app/portfolio">← Portfolio</Link></Button>
            <Button variant="outline" size="md" onClick={handleExport} disabled={filtered.length === 0}><Download className="w-4 h-4" />Export</Button>
            <Button variant="primary" size="md" asChild>
              <Link href="/app/portfolio/tenancies/new"><Plus className="w-4 h-4" />Create tenancy</Link>
            </Button>
          </div>
        }
      />

      {/* Ending soon alert */}
      {endingSoonCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl mb-5 text-sm">
          <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-amber-800 font-medium">
            {endingSoonCount} {endingSoonCount !== 1 ? "tenancies" : "tenancy"} ending within 60 days
          </span>
          <button onClick={() => { setFilterEndingSoon(true); setPage(1) }}
            className="ml-auto text-xs font-semibold text-amber-700 hover:underline">View →</button>
        </div>
      )}

      {/* Filter panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-5">
        {/* Row 1: search + toggle */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tenant, property, unit..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full h-9 pl-9 pr-4 rounded-xl text-[12.5px] bg-slate-50 border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
            />
          </div>
          <button
            onClick={() => setShowAdv(v => !v)}
            className={cn(
              "flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[12px] font-semibold transition-all shadow-sm whitespace-nowrap",
              showAdv || activeFilters > 0
                ? "bg-blue-50 border-blue-200 text-[#2563EB]"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />Filters
            {activeFilters > 0 && (
              <span className="ml-0.5 w-4 h-4 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">{activeFilters}</span>
            )}
          </button>
        </div>

        {/* Status + quick filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {["all", "draft", "active", "ended", "terminated", "uncollectable"].map(s => (
            <Chip key={s} active={filterStatus === s} onClick={() => { setFilterStatus(s); setPage(1) }}>
              {s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
            </Chip>
          ))}
          <div className="h-4 w-px bg-slate-200 mx-0.5" />
          <Chip active={filterEndingSoon} onClick={() => { setFilterEndingSoon(v => !v); setPage(1) }} color="#EA580C">
            <Calendar className="w-3 h-3 inline mr-1" />Ending soon
          </Chip>
          {arrearsCount > 0 && (
            <Chip active={filterArrears} onClick={() => { setFilterArrears(v => !v); setPage(1) }} color="#EF4444">
              <AlertTriangle className="w-3 h-3 inline mr-1" />Arrears ({arrearsCount})
            </Chip>
          )}
        </div>

        {/* Advanced filters */}
        {showAdv && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
            {/* Operation profile */}
            <div>
              <FLabel>Operation profile</FLabel>
              <div className="flex flex-wrap gap-1.5">
                <Chip active={filterProfile === "all"} onClick={() => setFilterProfile("all")}>All profiles</Chip>
                {ALL_PROFILES.map(p => (
                  <Chip key={p.key} active={filterProfile === p.key}
                    onClick={() => setFilterProfile(filterProfile === p.key ? "all" : p.key)}
                    color={p.color}>
                    {p.shortLabel}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Grid of filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <FLabel>Property</FLabel>
                <select value={filterProp} onChange={e => { setFilterProp(e.target.value); setPage(1) }}
                  className="w-full h-8 rounded-lg border border-slate-200 text-[12px] text-slate-700 bg-white px-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] shadow-sm">
                  <option value="all">All properties</option>
                  {propertyOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <FLabel>Location / city</FLabel>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <input
                    value={filterCity}
                    onChange={e => { setFilterCity(e.target.value); setPage(1) }}
                    placeholder="e.g. London"
                    className="w-full h-8 pl-7 pr-2 rounded-lg border border-slate-200 text-[12px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] shadow-sm"
                  />
                </div>
              </div>
              <div>
                <FLabel>Min rent / mo</FLabel>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 font-medium">£</span>
                  <input
                    type="number"
                    value={filterMinRent}
                    onChange={e => { setFilterMinRent(e.target.value); setPage(1) }}
                    placeholder="0"
                    className="w-full h-8 pl-6 pr-2 rounded-lg border border-slate-200 text-[12px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] shadow-sm"
                  />
                </div>
              </div>
              <div>
                <FLabel>Max rent / mo</FLabel>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 font-medium">£</span>
                  <input
                    type="number"
                    value={filterMaxRent}
                    onChange={e => { setFilterMaxRent(e.target.value); setPage(1) }}
                    placeholder="Any"
                    className="w-full h-8 pl-6 pr-2 rounded-lg border border-slate-200 text-[12px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] shadow-sm"
                  />
                </div>
              </div>
            </div>

            {activeFilters > 0 && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-[12px] text-slate-500">{filtered.length} of {allTenancies.length} tenancies</p>
                <button onClick={clearAll} className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-3.5 h-3.5" />Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results summary */}
      <p className="text-[12.5px] text-slate-500 mb-4">
        Showing {filtered.length} of {allTenancies.length} tenancies
        {activeFilters > 0 && (
          <button onClick={clearAll} className="ml-2 text-[#2563EB] hover:underline">Clear filters</button>
        )}
      </p>

      {/* Tenancy list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-600">No tenancies found</p>
          <p className="text-xs text-slate-400">Try adjusting your filters or create a new tenancy</p>
          <div className="flex items-center gap-2">
            {activeFilters > 0 && (
              <button onClick={clearAll} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Clear filters
              </button>
            )}
            <Button variant="primary" size="sm" asChild>
              <Link href="/app/portfolio/tenancies/new"><Plus className="w-4 h-4" />Create tenancy</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {paginated.map(t => (
            <TenancyCard
              key={t.id}
              tenancy={t}
              onView={id => router.push(`/app/portfolio/tenancies/${id}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = i + 1
              return (
                <button key={i} onClick={() => setPage(pageNum)}
                  className={cn("w-8 h-8 rounded-lg text-sm font-semibold",
                    page === pageNum ? "bg-[#2563EB] text-white" : "text-slate-500 hover:bg-slate-100")}>
                  {pageNum}
                </button>
              )
            })}
            {totalPages > 5 && <span className="text-slate-400 text-sm">…{totalPages}</span>}
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </DashboardContainer>
  )
}
