"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  Search, SlidersHorizontal, LayoutGrid, List, Star, BadgeCheck, Zap,
  ChevronLeft, ChevronRight, X, Lock, GitCompare, Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { MarketplaceEmptyState } from "@/components/marketplace/MarketplaceEmptyState"
import { SupplierCard } from "@/components/suppliers/SupplierCard"
import type { SupplierCard as SupplierCardData } from "@/lib/marketplace/suppliers"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────────────────
   SupplierDirectoryClient — the OPERATOR (buyer) supplier procurement browse.

   Real-data: fetches GET /api/marketplace/suppliers (workspace-scoped auth,
   published supplier listings enriched with the real supplier substrate).
   Filters: service type, zone, rating, verified, emergency, price band. Grid &
   list variants. Multi-select drives the side-by-side COMPARE view.

   Suppliers do NOT browse here — only operators procure. The supplier's own
   leads inbox lives in the supplier workspace (owned elsewhere).
─────────────────────────────────────────────────────────────────────────── */

const PAGE_SIZE = 24
const COMPARE_MAX = 4

// Service-type filter values map to seeded marketplace_categories slugs.
const SERVICE_TYPES: { value: string; label: string }[] = [
  { value: "", label: "All services" },
  { value: "cleaning", label: "Cleaning" },
  { value: "maintenance", label: "Maintenance" },
  { value: "gas-heating", label: "Gas & heating" },
  { value: "electrical", label: "Electrical" },
  { value: "emergency", label: "Emergency" },
  { value: "compliance-services", label: "Compliance" },
]

const PRICE_BANDS: { value: string; label: string; min?: number; max?: number }[] = [
  { value: "", label: "Any price" },
  { value: "budget", label: "Budget (under £50)", max: 4999 },
  { value: "mid", label: "Mid (£50–£120)", min: 5000, max: 12000 },
  { value: "premium", label: "Premium (£120+)", min: 12000 },
]

interface Filters {
  query: string
  serviceCategory: string
  zone: string
  minRating: number
  verifiedOnly: boolean
  emergencyOnly: boolean
  priceBand: string
}

const EMPTY: Filters = {
  query: "",
  serviceCategory: "",
  zone: "",
  minRating: 0,
  verifiedOnly: false,
  emergencyOnly: false,
  priceBand: "",
}

interface Props {
  canBrowse: boolean
  planName: string
  defaultCountry?: string | null
}

export function SupplierDirectoryClient({ canBrowse, planName, defaultCountry }: Props) {
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<SupplierCardData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [errored, setErrored] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [compare, setCompare] = useState<string[]>([])

  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [debouncedZone, setDebouncedZone] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(filters.query), 300)
    return () => clearTimeout(t)
  }, [filters.query])
  useEffect(() => {
    const t = setTimeout(() => setDebouncedZone(filters.zone), 300)
    return () => clearTimeout(t)
  }, [filters.zone])

  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, debouncedZone, filters.serviceCategory, filters.minRating, filters.verifiedOnly, filters.emergencyOnly, filters.priceBand])

  const reqId = useRef(0)
  const fetchSuppliers = useCallback(async () => {
    if (!canBrowse) {
      setLoading(false)
      return
    }
    const myReq = ++reqId.current
    setLoading(true)
    setErrored(false)
    const p = new URLSearchParams()
    if (debouncedQuery) p.set("q", debouncedQuery)
    if (filters.serviceCategory) p.set("serviceCategory", filters.serviceCategory)
    if (debouncedZone) p.set("zone", debouncedZone)
    if (defaultCountry) p.set("countryCode", defaultCountry)
    if (filters.minRating > 0) p.set("minRating", String(filters.minRating))
    if (filters.verifiedOnly) p.set("verifiedOnly", "true")
    if (filters.emergencyOnly) p.set("emergencyOnly", "true")
    const bandDef = PRICE_BANDS.find((b) => b.value === filters.priceBand)
    if (bandDef?.min != null) p.set("minPence", String(bandDef.min))
    if (bandDef?.max != null) p.set("maxPence", String(bandDef.max))
    p.set("page", String(page))
    p.set("pageSize", String(PAGE_SIZE))

    try {
      const res = await fetch(`/api/marketplace/suppliers?${p.toString()}`, { headers: { accept: "application/json" } })
      if (myReq !== reqId.current) return
      if (!res.ok) {
        setItems([])
        setTotal(0)
        setErrored(res.status >= 500)
        return
      }
      const json = (await res.json().catch(() => null)) as { items?: SupplierCardData[]; total?: number } | null
      setItems(Array.isArray(json?.items) ? json!.items : [])
      setTotal(typeof json?.total === "number" ? json!.total : 0)
    } catch {
      if (myReq !== reqId.current) return
      setItems([])
      setTotal(0)
      setErrored(true)
    } finally {
      if (myReq === reqId.current) setLoading(false)
    }
  }, [canBrowse, debouncedQuery, filters.serviceCategory, debouncedZone, defaultCountry, filters.minRating, filters.verifiedOnly, filters.emergencyOnly, filters.priceBand, page])

  useEffect(() => {
    void fetchSuppliers()
  }, [fetchSuppliers])

  const patch = (p: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...p }))
  const clear = () => setFilters({ ...EMPTY })

  const toggleCompare = (id: string) =>
    setCompare((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= COMPARE_MAX ? prev : [...prev, id]))

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const activeCount =
    (filters.query ? 1 : 0) + (filters.serviceCategory ? 1 : 0) + (filters.zone ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) + (filters.verifiedOnly ? 1 : 0) + (filters.emergencyOnly ? 1 : 0) + (filters.priceBand ? 1 : 0)

  const emptyState = useMemo(() => {
    if (errored)
      return <MarketplaceEmptyState variant="no-results" title="We couldn't load suppliers" description="There was a problem reaching the supplier directory. Please try again in a moment." action={{ label: "Retry", onClick: () => void fetchSuppliers() }} />
    if (activeCount > 0)
      return <MarketplaceEmptyState variant="no-results" title="No suppliers match your filters" description="Try widening the service type, zone or rating filters to see more vetted suppliers." action={{ label: "Clear filters", onClick: clear }} />
    return <MarketplaceEmptyState variant="browse" title="No suppliers published yet" description="Vetted suppliers across cleaning, gas, electrical and maintenance will appear here as they join Propvora." />
  }, [errored, activeCount, fetchSuppliers])

  return (
    <DashboardContainer>
      <MobileTopBar title="Suppliers" subtitle="Browse & procure vetted suppliers" showBack backHref="/property-manager/marketplace" />
      <div className="hidden md:block">
        <PageHeader
          title="Supplier directory"
          description="Browse, compare and request quotes from vetted suppliers across Propvora"
          actions={
            compare.length > 0 ? (
              <Button variant="primary" size="md" asChild>
                <Link href={`/property-manager/marketplace/suppliers/compare?ids=${compare.join(",")}`}>
                  <GitCompare className="w-4 h-4" /> Compare ({compare.length})
                </Link>
              </Button>
            ) : undefined
          }
        />
      </div>

      {!canBrowse ? (
        <div className="mt-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center text-center py-20 px-6">
            <div className="w-20 h-20 rounded-3xl bg-[var(--brand-soft)] flex items-center justify-center mb-5"><Lock className="w-9 h-9 text-[var(--brand)]" /></div>
            <h3 className="text-base font-bold text-slate-800">Supplier procurement isn&apos;t on your plan</h3>
            <p className="mt-1.5 max-w-md text-sm text-slate-500">Your {planName} plan doesn&apos;t include the supplier marketplace yet. Upgrade to browse and procure from vetted suppliers.</p>
            <div className="mt-6"><Button variant="primary" size="md" asChild><Link href="/property-manager/workspace-settings/subscription">View plans</Link></Button></div>
          </div>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={filters.query}
                  onChange={(e) => patch({ query: e.target.value })}
                  placeholder="Search suppliers, trades or services…"
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-[13.5px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                />
              </div>
              <button onClick={() => setShowFilters((v) => !v)} className={cn("inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border text-[13px] font-semibold shadow-sm transition-colors", activeCount > 0 ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
                <SlidersHorizontal className="w-4 h-4" /> Filters{activeCount > 0 && <span className="ml-0.5 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-[var(--brand)] text-white text-[10px]">{activeCount}</span>}
              </button>
              <div className="hidden sm:inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
                {(["grid", "list"] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)} aria-label={`${v} view`} className={cn("inline-flex items-center justify-center w-9 h-9 rounded-[9px] transition-colors", view === v ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600")}>
                    {v === "grid" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap items-center gap-2">
              <FilterChip active={filters.verifiedOnly} onClick={() => patch({ verifiedOnly: !filters.verifiedOnly })} icon={<BadgeCheck className="w-3.5 h-3.5" />}>Verified only</FilterChip>
              <FilterChip active={filters.emergencyOnly} onClick={() => patch({ emergencyOnly: !filters.emergencyOnly })} icon={<Zap className="w-3.5 h-3.5" />}>Emergency available</FilterChip>
              <FilterChip active={filters.minRating >= 4} onClick={() => patch({ minRating: filters.minRating >= 4 ? 0 : 4 })} icon={<Star className="w-3.5 h-3.5" />}>4★ and up</FilterChip>
              {SERVICE_TYPES.filter((t) => t.value).slice(0, 4).map((t) => (
                <FilterChip key={t.value} active={filters.serviceCategory === t.value} onClick={() => patch({ serviceCategory: filters.serviceCategory === t.value ? "" : t.value })} icon={<Wrench className="w-3.5 h-3.5" />}>{t.label}</FilterChip>
              ))}
            </div>

            {/* Expanded filter panel */}
            {showFilters && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Service type">
                  <select value={filters.serviceCategory} onChange={(e) => patch({ serviceCategory: e.target.value })} className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20">
                    {SERVICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Zone / area">
                  <input value={filters.zone} onChange={(e) => patch({ zone: e.target.value })} placeholder="e.g. London, SE1" className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
                </Field>
                <Field label="Price band">
                  <select value={filters.priceBand} onChange={(e) => patch({ priceBand: e.target.value })} className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20">
                    {PRICE_BANDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </Field>
                <Field label="Minimum rating">
                  <div className="flex items-center gap-1">
                    {[0, 3, 4, 4.5].map((r) => (
                      <button key={r} onClick={() => patch({ minRating: r })} className={cn("inline-flex items-center gap-0.5 h-9 px-2.5 rounded-lg border text-[12px] font-semibold transition-colors", filters.minRating === r ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50")}>
                        {r === 0 ? "Any" : <><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{r}+</>}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="sm:col-span-3 flex justify-end">
                  <button onClick={clear} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-slate-500 hover:text-slate-700"><X className="w-3.5 h-3.5" /> Clear all filters</button>
                </div>
              </div>
            )}

            {/* Result count */}
            {!loading && <p className="text-[12.5px] text-slate-500">{total} {total === 1 ? "supplier" : "suppliers"}{activeCount > 0 ? " match your filters" : " available"}</p>}
          </div>

          {/* Results */}
          {loading ? (
            <div className={view === "grid" ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4" : "flex flex-col gap-3"}>
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className={cn("rounded-2xl bg-slate-100 animate-pulse", view === "grid" ? "h-64" : "h-32")} />)}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">{emptyState}</div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((s) => <SupplierCard key={s.id} supplier={s} variant="grid" selectable selected={compare.includes(s.id)} onToggleSelect={toggleCompare} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((s) => <SupplierCard key={s.id} supplier={s} variant="list" selectable selected={compare.includes(s.id)} onToggleSelect={toggleCompare} />)}
            </div>
          )}

          {/* Pagination */}
          {!loading && items.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="inline-flex items-center gap-1 h-9 px-3 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 transition-all"><ChevronLeft className="w-4 h-4" /> Previous</button>
              <span className="px-3 text-[12.5px] font-medium text-slate-500 tabular-nums">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="inline-flex items-center gap-1 h-9 px-3 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 transition-all">Next <ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </>
      )}

      {/* Sticky compare bar (mobile-friendly) */}
      {compare.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.14)]">
          <span className="text-[12.5px] font-semibold text-slate-700">{compare.length} selected</span>
          <Link href={`/property-manager/marketplace/suppliers/compare?ids=${compare.join(",")}`} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[var(--brand)] text-white text-[12.5px] font-semibold hover:bg-[var(--brand-strong)] transition-colors"><GitCompare className="w-4 h-4" /> Compare</Link>
          <button onClick={() => setCompare([])} aria-label="Clear comparison" className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
      )}
    </DashboardContainer>
  )
}

function FilterChip({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[12px] font-semibold transition-colors", active ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
      {icon}{children}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </div>
  )
}

export default SupplierDirectoryClient
