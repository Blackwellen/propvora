"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Store, Plus, ChevronLeft, ChevronRight, Lock } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import {
  CategoryNav,
  FilterBar,
  ListingGrid,
  MarketplaceEmptyState,
  normaliseSearchResponse,
  type MarketListing,
  type MarketplaceFilters,
} from "@/components/marketplace"

/* ──────────────────────────────────────────────────────────────────────────
   MarketplaceBrowseClient — interactive browse island.

   The server page resolves workspace + entitlement and hands the result in.
   This island owns filtering, pagination and data fetching against
   `GET /api/marketplace/search`. It tolerates a non-200 / cold API gracefully:
   skeletons while loading, a real premium empty state otherwise — never a crash.

   `canBrowse` reflects the server-side entitlement (marketplaceBrowsing). When
   false we still render the shell but surface an upgrade affordance instead of
   results — we never silently hide the surface.
─────────────────────────────────────────────────────────────────────────── */

const PAGE_SIZE = 24

const EMPTY_FILTERS: MarketplaceFilters = {
  query: "",
  transactionType: "",
  countryCode: "",
  location: "",
  minPence: null,
  maxPence: null,
}

interface Props {
  /** Entitlement: may the workspace browse the marketplace? */
  canBrowse: boolean
  /** Entitlement: may the workspace publish listings (drives the header CTA)? */
  canPublish: boolean
  /** Plan name for the upgrade prompt copy. */
  planName: string
  /** Default country from the workspace context (pre-seeds the filter). */
  defaultCountry?: string | null
  /** Lock the browse to a single category slug (sub-route landings). */
  initialCategory?: string
  /** Hide the category nav when the category is locked. */
  lockCategory?: boolean
  /** Override the header. */
  title?: string
  description?: string
}

export function MarketplaceBrowseClient({
  canBrowse,
  canPublish,
  planName,
  defaultCountry,
  initialCategory = "",
  lockCategory = false,
  title = "Marketplace",
  description = "Discover services, suppliers and listings across Propvora",
}: Props) {
  const [category, setCategory] = useState(initialCategory)
  const [filters, setFilters] = useState<MarketplaceFilters>({
    ...EMPTY_FILTERS,
    countryCode: defaultCountry ?? "",
  })
  const [page, setPage] = useState(1)

  const [items, setItems] = useState<MarketListing[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [errored, setErrored] = useState(false)

  // Debounce text-driven filters so we don't fetch on every keystroke.
  const [debouncedQuery, setDebouncedQuery] = useState(filters.query)
  const [debouncedLocation, setDebouncedLocation] = useState(filters.location)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(filters.query), 300)
    return () => clearTimeout(t)
  }, [filters.query])
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocation(filters.location), 300)
    return () => clearTimeout(t)
  }, [filters.location])

  // Reset to page 1 whenever a filter dimension changes.
  useEffect(() => {
    setPage(1)
  }, [category, debouncedQuery, debouncedLocation, filters.transactionType, filters.countryCode, filters.minPence, filters.maxPence])

  const reqId = useRef(0)

  const fetchListings = useCallback(async () => {
    if (!canBrowse) {
      setLoading(false)
      return
    }
    const myReq = ++reqId.current
    setLoading(true)
    setErrored(false)
    const params = new URLSearchParams()
    if (debouncedQuery) params.set("query", debouncedQuery)
    if (category) params.set("category", category)
    if (filters.transactionType) params.set("transactionType", filters.transactionType)
    if (filters.countryCode) params.set("countryCode", filters.countryCode)
    if (debouncedLocation) params.set("location", debouncedLocation)
    if (filters.minPence !== null) params.set("minPence", String(filters.minPence))
    if (filters.maxPence !== null) params.set("maxPence", String(filters.maxPence))
    params.set("page", String(page))
    params.set("pageSize", String(PAGE_SIZE))

    try {
      const res = await fetch(`/api/marketplace/search?${params.toString()}`, {
        headers: { accept: "application/json" },
      })
      if (myReq !== reqId.current) return // stale
      if (!res.ok) {
        // Tolerate non-200: present an empty/error-aware state, not a crash.
        setItems([])
        setTotal(0)
        setErrored(res.status >= 500)
        return
      }
      const json = await res.json().catch(() => null)
      const parsed = normaliseSearchResponse(json, page, PAGE_SIZE)
      setItems(parsed.items)
      setTotal(parsed.total)
    } catch {
      if (myReq !== reqId.current) return
      setItems([])
      setTotal(0)
      setErrored(true)
    } finally {
      if (myReq === reqId.current) setLoading(false)
    }
  }, [canBrowse, debouncedQuery, category, filters.transactionType, filters.countryCode, debouncedLocation, filters.minPence, filters.maxPence, page])

  useEffect(() => {
    void fetchListings()
  }, [fetchListings])

  const patchFilters = (patch: Partial<MarketplaceFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch }))
  const clearFilters = () => {
    setFilters({ ...EMPTY_FILTERS })
    setCategory("")
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasActiveFilters =
    !!category ||
    !!filters.query ||
    !!filters.transactionType ||
    !!filters.countryCode ||
    !!filters.location ||
    filters.minPence !== null ||
    filters.maxPence !== null

  const emptyState = useMemo(() => {
    if (errored) {
      return (
        <MarketplaceEmptyState
          variant="no-results"
          title="We couldn't load the marketplace"
          description="There was a problem reaching the marketplace just now. Please try again in a moment."
          action={{ label: "Retry", onClick: () => void fetchListings() }}
        />
      )
    }
    if (hasActiveFilters) {
      return (
        <MarketplaceEmptyState
          variant="no-results"
          action={{ label: "Clear filters", onClick: clearFilters }}
        />
      )
    }
    return <MarketplaceEmptyState variant="browse" />
  }, [errored, hasActiveFilters, fetchListings])

  return (
    <DashboardContainer>
      <MobileTopBar
        title={title}
        subtitle="Browse services, suppliers & listings"
        primaryAction={
          canPublish
            ? { label: "My listings", icon: Plus, href: "/app/marketplace/my-listings" }
            : undefined
        }
        overflowActions={[{ label: "My listings", icon: Store, href: "/app/marketplace/my-listings" }]}
      />

      <div className="hidden md:block">
        <PageHeader
          title={title}
          description={description}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="md" asChild>
                <Link href="/app/marketplace/my-listings">
                  <Store className="w-4 h-4" />
                  My listings
                </Link>
              </Button>
              {canPublish && (
                <Button variant="primary" size="md" asChild>
                  <Link href="/app/marketplace/my-listings?new=1">
                    <Plus className="w-4 h-4" />
                    New listing
                  </Link>
                </Button>
              )}
            </div>
          }
        />
      </div>

      {!canBrowse ? (
        /* Entitlement-gated: show the shell + a real upgrade prompt, never hide. */
        <div className="mt-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center text-center py-20 px-6">
            <div className="w-20 h-20 rounded-3xl bg-[#EFF6FF] flex items-center justify-center mb-5">
              <Lock className="w-9 h-9 text-[#2563EB]" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Marketplace browsing isn&apos;t on your plan</h3>
            <p className="mt-1.5 max-w-md text-sm text-slate-500 text-pretty">
              Your {planName} plan doesn&apos;t include the marketplace yet. Upgrade to browse services,
              suppliers and listings from across Propvora.
            </p>
            <div className="mt-6">
              <Button variant="primary" size="md" asChild>
                <Link href="/app/workspace-settings/subscription">View plans</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="mb-4 space-y-3">
            <FilterBar
              filters={filters}
              onChange={patchFilters}
              onClear={clearFilters}
              resultCount={loading ? undefined : total}
            />
            {!lockCategory && <CategoryNav value={category} onChange={setCategory} />}
          </div>

          {/* Results */}
          <ListingGrid listings={items} loading={loading} emptyState={emptyState} />

          {/* Pagination */}
          {!loading && items.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 h-9 px-3 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="px-3 text-[12.5px] font-medium text-slate-500 tabular-nums">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 h-9 px-3 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </DashboardContainer>
  )
}

export default MarketplaceBrowseClient
