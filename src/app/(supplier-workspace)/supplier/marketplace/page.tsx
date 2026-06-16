"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Store, MapPin, Pencil, Pause, Play, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader,
  SupplierCard,
  SupplierEmptyState,
  SupplierLoadingState,
  SupplierKpiStrip,
  SupplierNotReady,
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

/* ──────────────────────────────────────────────────────────────────────────
   Supplier marketplace listings — the supplier's OWN published listings,
   managed via the P2 `/api/marketplace/listings` API (owner-scoped by
   workspaceId). Reuses P2 presentational primitives (PriceTag, status pill,
   category meta) but is self-contained so it does not depend on the operator
   AuthProvider that the P2 MyListingsClient assumes. Tolerant of every non-200
   (incl. table-not-ready) → premium empty / not-ready states.
─────────────────────────────────────────────────────────────────────────── */

export default function SupplierMarketplacePage() {
  const { workspaceId, ready } = useSupplierWorkspace()
  const wsLoading = !ready
  const [listings, setListings] = useState<OwnListing[]>([])
  const [loading, setLoading] = useState(true)
  const [notReady, setNotReady] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)

  const fetchListings = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setNotReady(false)
    try {
      const res = await fetch(`/api/marketplace/listings?workspaceId=${encodeURIComponent(workspaceId)}`, {
        headers: { accept: "application/json" },
      })
      if (!res.ok) {
        setListings([])
        setNotReady(true)
        return
      }
      const json = await res.json().catch(() => null)
      const rows = Array.isArray(json?.items) ? (json.items as Record<string, unknown>[]) : []
      setListings(rows.map(normaliseOwn))
    } catch {
      setListings([])
      setNotReady(true)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    if (!wsLoading) void fetchListings()
  }, [wsLoading, fetchListings])

  const setStatus = async (l: OwnListing, status: OwnListingStatus) => {
    if (!workspaceId) return
    try {
      const res = await fetch(`/api/marketplace/listings/${encodeURIComponent(l.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, status }),
      })
      if (res.ok) {
        setBanner(`Listing ${status === "published" ? "published" : status}.`)
        await fetchListings()
      } else if (res.status === 402) {
        setBanner("Publishing isn't included on your current plan.")
      } else {
        setBanner("That action isn't available yet.")
      }
    } catch {
      setBanner("Network error — please try again.")
    }
  }

  const stats = useMemo(() => {
    const count = (s: OwnListingStatus) => listings.filter((l) => l.status === s).length
    return { total: listings.length, published: count("published"), draft: count("draft"), paused: count("paused") }
  }, [listings])

  const kpis: SupplierKpi[] = [
    { icon: Store, iconBg: "bg-blue-50", iconColor: "text-blue-600", value: stats.total, label: "Total listings", sub: "All statuses", subColor: "text-slate-500" },
    { icon: Eye, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", value: stats.published, label: "Published", sub: "Live in marketplace", subColor: "text-emerald-600" },
    { icon: Pencil, iconBg: "bg-slate-100", iconColor: "text-slate-600", value: stats.draft, label: "Drafts", sub: "Not yet live", subColor: "text-slate-500" },
    { icon: Pause, iconBg: "bg-amber-50", iconColor: "text-amber-600", value: stats.paused, label: "Paused", sub: "Hidden from search", subColor: "text-amber-600" },
  ]

  const showLoading = wsLoading || loading
  const createHref = "/app/marketplace?new=1"

  return (
    <div className="space-y-5">
      <MobileTopBar
        title="Marketplace"
        subtitle={`${listings.length} listing${listings.length === 1 ? "" : "s"}`}
        primaryAction={{ label: "New listing", icon: Plus, href: createHref }}
      />

      <SupplierPageHeader
        title="Marketplace listings"
        subtitle="Publish and manage the services your workspace lists in the Propvora marketplace"
        actions={
          <Link
            href={createHref}
            className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> New listing
          </Link>
        }
      />

      {banner && (
        <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-[#EFF6FF] px-3.5 py-2.5">
          <p className="text-[13px] font-medium text-[#1d4ed8]">{banner}</p>
          <button onClick={() => setBanner(null)} className="text-[12px] font-semibold text-[#2563EB] hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {!showLoading && listings.length > 0 && <SupplierKpiStrip kpis={kpis} />}

      <SupplierCard className="p-5">
        {showLoading ? (
          <SupplierLoadingState rows={4} />
        ) : notReady ? (
          <SupplierNotReady
            icon={Store}
            title="Marketplace coming online"
            description="Your listings appear here as soon as the marketplace service is connected to your workspace."
          />
        ) : listings.length === 0 ? (
          <SupplierEmptyState
            icon={Store}
            title="No listings yet"
            description="Create your first marketplace listing to reach property managers and customers across Propvora. You can save drafts and publish when you're ready."
            action={
              <Link
                href={createHref}
                className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" /> Create your first listing
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2.5" role="list">
            {listings.map((l) => (
              <li key={l.id}>
                <ListingRow listing={l} onSetStatus={(s) => void setStatus(l, s)} />
              </li>
            ))}
          </ul>
        )}
      </SupplierCard>
    </div>
  )
}

function ListingRow({ listing, onSetStatus }: { listing: OwnListing; onSetStatus: (s: OwnListingStatus) => void }) {
  const cat = categoryMeta(listing.category)
  const CatIcon = cat.icon
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-3 hover:border-[#BFD8FB] hover:shadow-md transition-all">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", cat.bg)}>
        <CatIcon className={cn("w-5 h-5", cat.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[13.5px] font-bold text-slate-900 truncate">{listing.title}</h3>
          <ListingStatusPill status={listing.status} />
        </div>
        <div className="mt-0.5 flex items-center gap-2.5 text-[11.5px] text-slate-500">
          <span className="capitalize">{cat.label}</span>
          {listing.location && (
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-slate-400" />
              {listing.location}
            </span>
          )}
        </div>
      </div>
      <div className="hidden sm:block text-right shrink-0">
        <PriceTag pence={listing.basePricePence} currency={listing.currency} pricingModel={listing.pricingModel} size="sm" />
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {listing.status === "published" ? (
          <button
            onClick={() => onSetStatus("paused")}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
          >
            <Pause className="w-3.5 h-3.5" /> Pause
          </button>
        ) : (
          <button
            onClick={() => onSetStatus("published")}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            <Play className="w-3.5 h-3.5" /> Publish
          </button>
        )}
      </div>
    </div>
  )
}
