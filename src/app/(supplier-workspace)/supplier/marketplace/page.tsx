"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Plus, Store, Eye, Pencil, Pause, Play, Copy, Archive,
  ChevronDown, Star, ShoppingBag, BarChart2, X,
  Check, SlidersHorizontal, Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader,
  SupplierCard,
  SupplierEmptyState,
  SupplierLoadingState,
  SupplierKpiStrip,
  SupplierNotReady,
  SupplierStatusBadge,
  SupplierButton,
  SupplierBanner,
  SupplierDrawer,
  toneForStatus,
  type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import {
  normaliseOwn,
  categoryMeta,
  PriceTag,
  type OwnListing,
  type OwnListingStatus,
} from "@/components/marketplace"
import { ListingStatusPill } from "@/components/marketplace/ListingStatusPill"
import { moneyPence, shortDate } from "@/components/supplier-workspace/format"

/* ──────────────────────────────────────────────────────────────────────────
   Supplier Marketplace Dashboard — premium card-grid for the supplier's own
   marketplace listings. Features:
   - Card grid with cover image, category, status badge, price, order count
   - Comparison drawer: select up to 3 listings, side-by-side stat comparison
   - Quick actions: Edit, View public, Duplicate, Pause/Resume, Archive
   - Sort/filter bar: status, category, price range
   - Empty state with template suggestions
   Constraints: no dark: classes, all data from Supabase via /api routes.
─────────────────────────────────────────────────────────────────────────── */

type SortKey = "newest" | "oldest" | "price_asc" | "price_desc" | "title"
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
  { key: "title", label: "Title A–Z" },
]

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending review" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
]

const TEMPLATE_SUGGESTIONS = [
  { title: "Residential Cleaning", category: "cleaning", description: "Standard one-off or recurring property clean." },
  { title: "Emergency Plumbing", category: "trades", description: "24hr callout for leaks, bursts, and blockages." },
  { title: "Electrical Safety Check", category: "compliance", description: "EICR and certificate issuance for landlords." },
  { title: "Garden Maintenance", category: "maintenance", description: "Regular lawn, hedge, and border upkeep." },
]

function sortListings(listings: OwnListing[], sort: SortKey): OwnListing[] {
  const arr = [...listings]
  switch (sort) {
    case "newest":
      return arr.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    case "oldest":
      return arr.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))
    case "price_asc":
      return arr.sort((a, b) => (a.basePricePence ?? 0) - (b.basePricePence ?? 0))
    case "price_desc":
      return arr.sort((a, b) => (b.basePricePence ?? 0) - (a.basePricePence ?? 0))
    case "title":
      return arr.sort((a, b) => a.title.localeCompare(b.title))
    default:
      return arr
  }
}

export default function SupplierMarketplacePage() {
  const { workspaceId, ready } = useSupplierWorkspace()
  const wsLoading = !ready

  const [listings, setListings] = useState<OwnListing[]>([])
  const [loading, setLoading] = useState(true)
  const [notReady, setNotReady] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)

  // Filters & sort
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortKey, setSortKey] = useState<SortKey>("newest")
  const [showFilters, setShowFilters] = useState(false)

  // Comparison
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)

  const fetchListings = useCallback(async () => {
    if (!workspaceId) { setLoading(false); return }
    setLoading(true); setNotReady(false)
    try {
      const res = await fetch(
        `/api/marketplace/listings?workspaceId=${encodeURIComponent(workspaceId)}`,
        { headers: { accept: "application/json" } }
      )
      if (!res.ok) { setListings([]); setNotReady(true); return }
      const json = await res.json().catch(() => null)
      const rows = Array.isArray(json?.items) ? (json.items as Record<string, unknown>[]) : []
      setListings(rows.map(normaliseOwn))
    } catch {
      setListings([]); setNotReady(true)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    if (!wsLoading) void fetchListings()
  }, [wsLoading, fetchListings])

  async function patchStatus(l: OwnListing, status: OwnListingStatus) {
    if (!workspaceId) return
    try {
      const res = await fetch(`/api/marketplace/listings/${encodeURIComponent(l.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, status }),
      })
      if (res.ok) {
        setBanner(`Listing "${l.title}" ${status}.`)
        await fetchListings()
      } else if (res.status === 402) {
        setBanner("Publishing isn't available on your current plan.")
      } else {
        setBanner("That action isn't available right now.")
      }
    } catch {
      setBanner("Network error — please try again.")
    }
  }

  async function duplicateListing(l: OwnListing) {
    if (!workspaceId) return
    try {
      const res = await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          title: `${l.title} (copy)`,
          category: l.category,
          base_price_pence: l.basePricePence,
          pricing_model: l.pricingModel,
          currency: l.currency ?? "GBP",
          status: "draft",
          description: null,
        }),
      })
      if (res.ok) {
        setBanner(`Duplicated "${l.title}" as a draft.`)
        await fetchListings()
      } else {
        setBanner("Couldn't duplicate — marketplace may not be ready.")
      }
    } catch {
      setBanner("Network error during duplicate.")
    }
  }

  const stats = useMemo(() => {
    const count = (s: string) => listings.filter((l) => l.status === s).length
    return {
      total: listings.length,
      published: count("published"),
      draft: count("draft"),
      paused: count("paused"),
    }
  }, [listings])

  const kpis: SupplierKpi[] = [
    { icon: Store, iconBg: "bg-blue-50", iconColor: "text-blue-600", value: stats.total, label: "Total listings", sub: "All statuses", subColor: "text-slate-500" },
    { icon: Eye, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", value: stats.published, label: "Published", sub: "Live in marketplace", subColor: "text-emerald-600" },
    { icon: Pencil, iconBg: "bg-slate-100", iconColor: "text-slate-600", value: stats.draft, label: "Drafts", sub: "Not yet live", subColor: "text-slate-500" },
    { icon: Pause, iconBg: "bg-amber-50", iconColor: "text-amber-600", value: stats.paused, label: "Paused", sub: "Hidden from search", subColor: "text-amber-600" },
  ]

  const filteredListings = useMemo(() => {
    let items = listings
    if (statusFilter !== "all") items = items.filter((l) => l.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (l) => l.title.toLowerCase().includes(q) || (l.category ?? "").toLowerCase().includes(q)
      )
    }
    return sortListings(items, sortKey)
  }, [listings, statusFilter, search, sortKey])

  const compareListings = useMemo(
    () => listings.filter((l) => compareIds.includes(l.id)),
    [listings, compareIds]
  )

  function toggleCompare(id: string) {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  const showLoading = wsLoading || loading
  const wizardHref = "/supplier/marketplace/new"

  return (
    <div className="space-y-5">
      <MobileTopBar
        title="Marketplace"
        subtitle={`${listings.length} listing${listings.length === 1 ? "" : "s"}`}
        primaryAction={{ label: "New listing", icon: Plus, href: wizardHref }}
      />

      <SupplierPageHeader
        title="Marketplace listings"
        subtitle="Publish and manage your services in the Propvora marketplace. Listings are reviewed before going live."
        actions={
          <Link
            href={wizardHref}
            className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> New listing
          </Link>
        }
      />

      {banner && (
        <SupplierBanner tone="blue" onDismiss={() => setBanner(null)}>{banner}</SupplierBanner>
      )}

      {!showLoading && listings.length > 0 && <SupplierKpiStrip kpis={kpis} />}

      {/* Filter + Sort bar */}
      {!showLoading && !notReady && listings.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search listings…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-9 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "h-9 px-3 rounded-xl border text-sm font-semibold inline-flex items-center gap-1.5 transition-colors",
              showFilters
                ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </button>

          {compareIds.length > 0 && (
            <button
              onClick={() => setCompareOpen(true)}
              className="h-9 px-3 rounded-xl border border-violet-200 bg-violet-50 text-sm font-semibold text-violet-700 inline-flex items-center gap-1.5 hover:bg-violet-100 transition-colors"
            >
              Compare {compareIds.length} selected
            </button>
          )}
        </div>
      )}

      {/* Main content */}
      {showLoading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={4} /></SupplierCard>
      ) : notReady ? (
        <SupplierCard className="p-5">
          <SupplierNotReady
            icon={Store}
            title="Marketplace coming online"
            description="Your listings appear here once the marketplace service is connected to your workspace."
          />
        </SupplierCard>
      ) : listings.length === 0 ? (
        /* Empty state with template suggestions */
        <div className="space-y-4">
          <SupplierCard className="p-5">
            <SupplierEmptyState
              icon={Store}
              title="No listings yet"
              description="Create your first marketplace listing to reach property managers across Propvora. You can save drafts and submit for review when ready."
              action={
                <Link
                  href={wizardHref}
                  className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create your first listing
                </Link>
              }
            />
          </SupplierCard>

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 px-0.5">
            Popular templates to get started
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TEMPLATE_SUGGESTIONS.map((t) => {
              const cat = categoryMeta(t.category)
              const CatIcon = cat.icon
              return (
                <Link
                  key={t.title}
                  href={`${wizardHref}?template=${encodeURIComponent(t.category)}&title=${encodeURIComponent(t.title)}`}
                  className="flex items-start gap-3 bg-white border border-slate-200 rounded-2xl p-4 hover:border-[#BFD8FB] hover:shadow-sm transition-all group"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cat.bg)}>
                    <CatIcon className={cn("w-5 h-5", cat.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-[#2563EB] transition-colors">{t.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ) : filteredListings.length === 0 ? (
        <SupplierCard className="p-5">
          <SupplierEmptyState
            icon={Search}
            title="No listings match your filters"
            description="Try adjusting the status filter or search term."
            action={
              <SupplierButton variant="secondary" size="sm" onClick={() => { setSearch(""); setStatusFilter("all") }}>
                Clear filters
              </SupplierButton>
            }
          />
        </SupplierCard>
      ) : (
        /* Card grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredListings.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              selected={compareIds.includes(l.id)}
              onToggleSelect={() => toggleCompare(l.id)}
              onSetStatus={(s) => void patchStatus(l, s)}
              onDuplicate={() => void duplicateListing(l)}
            />
          ))}
        </div>
      )}

      {/* Comparison drawer */}
      <CompareDrawer
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        listings={compareListings}
        onClear={() => { setCompareIds([]); setCompareOpen(false) }}
      />
    </div>
  )
}

/* ── Listing card ────────────────────────────────────────────────────────── */

function ListingCard({
  listing: l,
  selected,
  onToggleSelect,
  onSetStatus,
  onDuplicate,
}: {
  listing: OwnListing
  selected: boolean
  onToggleSelect: () => void
  onSetStatus: (s: OwnListingStatus) => void
  onDuplicate: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const cat = categoryMeta(l.category)
  const CatIcon = cat.icon

  return (
    <div
      className={cn(
        "relative bg-white border rounded-2xl shadow-sm flex flex-col overflow-hidden transition-all",
        selected ? "border-violet-400 ring-2 ring-violet-200" : "border-slate-200 hover:border-[#BFD8FB] hover:shadow-md"
      )}
    >
      {/* Cover / category header */}
      <div className={cn("relative h-32 flex items-center justify-center", cat.bg)}>
        <CatIcon className={cn("w-12 h-12 opacity-30", cat.color)} />
        <div className="absolute top-3 left-3">
          <ListingStatusPill status={l.status} />
        </div>
        {/* Compare checkbox */}
        <button
          onClick={onToggleSelect}
          aria-label={selected ? "Remove from comparison" : "Add to comparison"}
          className={cn(
            "absolute top-3 right-3 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors",
            selected
              ? "bg-violet-600 border-violet-600 text-white"
              : "bg-white/80 border-slate-300 hover:border-violet-400"
          )}
        >
          {selected && <Check className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/supplier/marketplace/${l.id}`} className="block group">
              <h3 className="text-[14px] font-bold text-slate-900 truncate group-hover:text-[#2563EB] transition-colors leading-snug">
                {l.title}
              </h3>
            </Link>
            <p className="text-xs text-slate-500 mt-0.5 capitalize">{cat.label}</p>
          </div>
          <div className="shrink-0 text-right">
            <PriceTag pence={l.basePricePence} currency={l.currency} pricingModel={l.pricingModel} size="sm" />
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {(l as unknown as Record<string, unknown>).views != null ? String((l as unknown as Record<string, unknown>).views) : "—"} views
          </span>
          <span className="inline-flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            {(l as unknown as Record<string, unknown>).order_count != null ? String((l as unknown as Record<string, unknown>).order_count) : "0"} orders
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="w-3.5 h-3.5" />
            {(l as unknown as Record<string, unknown>).avg_rating != null ? String((l as unknown as Record<string, unknown>).avg_rating) : "—"}
          </span>
        </div>

        {l.updatedAt && (
          <p className="mt-2 text-[11px] text-slate-400">Updated {shortDate(l.updatedAt)}</p>
        )}
      </div>

      {/* Actions footer */}
      <div className="border-t border-slate-100 px-4 py-2.5 flex items-center gap-1">
        <Link
          href={`/supplier/marketplace/${l.id}`}
          className="flex-1 inline-flex items-center justify-center gap-1 h-8 rounded-lg text-[12px] font-semibold text-[#2563EB] hover:bg-blue-50 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </Link>

        {l.status === "published" && (
          <Link
            href={`/marketplace/${l.id}`}
            target="_blank"
            className="flex-1 inline-flex items-center justify-center gap-1 h-8 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> View
          </Link>
        )}

        {l.status === "published" ? (
          <button
            onClick={() => onSetStatus("paused")}
            className="flex-1 inline-flex items-center justify-center gap-1 h-8 rounded-lg text-[12px] font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
          >
            <Pause className="w-3.5 h-3.5" /> Pause
          </button>
        ) : l.status === "paused" ? (
          <button
            onClick={() => onSetStatus("published")}
            className="flex-1 inline-flex items-center justify-center gap-1 h-8 rounded-lg text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            <Play className="w-3.5 h-3.5" /> Resume
          </button>
        ) : null}

        {/* More menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="More actions"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <div className="absolute right-0 bottom-10 z-20 w-44 bg-white rounded-xl border border-slate-200 shadow-lg py-1 overflow-hidden">
                <button
                  onClick={() => { onDuplicate(); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="w-4 h-4 text-slate-400" /> Duplicate
                </button>
                {l.status !== "archived" && (
                  <button
                    onClick={() => { onSetStatus("archived"); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50"
                  >
                    <Archive className="w-4 h-4" /> Archive
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Comparison drawer ───────────────────────────────────────────────────── */

function CompareDrawer({
  open,
  onClose,
  listings,
  onClear,
}: {
  open: boolean
  onClose: () => void
  listings: OwnListing[]
  onClear: () => void
}) {
  if (!open) return null

  const metrics: { key: keyof OwnListing | string; label: string }[] = [
    { key: "status", label: "Status" },
    { key: "category", label: "Category" },
    { key: "basePricePence", label: "Base price" },
    { key: "pricingModel", label: "Pricing model" },
    { key: "createdAt", label: "Created" },
    { key: "updatedAt", label: "Last updated" },
  ]

  function formatVal(l: OwnListing, key: string): string {
    const raw = (l as unknown as Record<string, unknown>)[key]
    if (raw == null || raw === "") return "—"
    if (key === "basePricePence") return moneyPence(raw as number)
    if (key === "createdAt" || key === "updatedAt") return shortDate(raw as string)
    return String(raw).replace(/_/g, " ")
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label="Compare listings">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 motion-reduce:animate-none">
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-semibold text-slate-900">Compare listings</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onClear}
              className="text-[12px] font-semibold text-slate-500 hover:text-slate-700"
            >
              Clear all
            </button>
            <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-5 py-5">
          {/* Header row */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `120px repeat(${listings.length}, 1fr)` }}>
            <div />
            {listings.map((l) => {
              const cat = categoryMeta(l.category)
              const CatIcon = cat.icon
              return (
                <div key={l.id} className="text-center">
                  <div className={cn("w-12 h-12 rounded-xl mx-auto flex items-center justify-center", cat.bg)}>
                    <CatIcon className={cn("w-6 h-6", cat.color)} />
                  </div>
                  <p className="text-[13px] font-bold text-slate-900 mt-2 leading-snug line-clamp-2">{l.title}</p>
                  <ListingStatusPill status={l.status} />
                </div>
              )
            })}
          </div>

          <div className="mt-6 space-y-0 border border-slate-200 rounded-xl overflow-hidden">
            {metrics.map((m, i) => (
              <div
                key={m.key}
                className={cn(
                  "grid gap-4 px-4 py-3",
                  i % 2 === 0 ? "bg-slate-50" : "bg-white"
                )}
                style={{ gridTemplateColumns: `120px repeat(${listings.length}, 1fr)` }}
              >
                <span className="text-[12px] font-semibold text-slate-500">{m.label}</span>
                {listings.map((l) => (
                  <span key={l.id} className="text-[13px] text-slate-800 text-center capitalize">
                    {formatVal(l, m.key)}
                  </span>
                ))}
              </div>
            ))}
          </div>

          {/* Performance row (stat fields from DB) */}
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Performance</p>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              {[
                { key: "views", label: "Views", icon: Eye },
                { key: "order_count", label: "Orders", icon: ShoppingBag },
                { key: "avg_rating", label: "Avg. rating", icon: Star },
              ].map(({ key, label, icon: Icon }, i) => (
                <div
                  key={key}
                  className={cn(
                    "grid gap-4 px-4 py-3 items-center",
                    i % 2 === 0 ? "bg-slate-50" : "bg-white"
                  )}
                  style={{ gridTemplateColumns: `120px repeat(${listings.length}, 1fr)` }}
                >
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </span>
                  {listings.map((l) => {
                    const raw = (l as unknown as Record<string, unknown>)[key]
                    return (
                      <span key={l.id} className="text-[13px] font-semibold text-slate-800 text-center">
                        {raw != null ? String(raw) : "—"}
                      </span>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 shrink-0 flex items-center justify-between">
          <p className="text-xs text-slate-500">Comparing {listings.length} listing{listings.length === 1 ? "" : "s"}</p>
          <Link
            href={listings[0] ? `/supplier/marketplace/${listings[0].id}` : "/supplier/marketplace"}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
          >
            <BarChart2 className="w-4 h-4" /> View top listing
          </Link>
        </div>
      </div>
    </div>
  )
}
