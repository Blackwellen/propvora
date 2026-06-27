"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Plus, Store, Lock, Pencil, Eye, Pause, Play, Archive,
  ExternalLink, MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { StatCard } from "@/components/ui/StatCard"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  MarketplaceEmptyState,
  PriceTag,
  categoryMeta,
  normaliseOwn,
  type OwnListing,
  type OwnListingStatus,
} from "@/components/marketplace"
import { ListingStatusPill } from "./ListingStatusPill"
import { ListingFormDialog, type ListingFormPayload } from "./ListingFormDialog"

/* ──────────────────────────────────────────────────────────────────────────
   MyListingsClient — manage the workspace's OWN listings.

   Lists all statuses from `GET /api/marketplace/listings?workspaceId=…`.
   Create/edit affordances are gated by the server-resolved `canPublish`
   entitlement: when false we show an explicit upgrade prompt (never hide
   silently). Status changes + edits PATCH the listing; create POSTs. All
   network calls tolerate non-200 (incl. 402 upgrade + 503 not-ready) and
   surface a readable message rather than crashing.
─────────────────────────────────────────────────────────────────────────── */

interface Props {
  canPublish: boolean
  planName: string
  defaultCountry?: string | null
}

export function MyListingsClient({ canPublish, planName, defaultCountry }: Props) {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id ?? null
  const searchParams = useSearchParams()

  const [listings, setListings] = useState<OwnListing[]>([])
  const [loading, setLoading] = useState(true)
  const [errored, setErrored] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<OwnListing | null>(null)

  const fetchListings = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setErrored(false)
    try {
      const res = await fetch(`/api/marketplace/listings?workspaceId=${encodeURIComponent(workspaceId)}`, {
        headers: { accept: "application/json" },
      })
      if (!res.ok) {
        setListings([])
        setErrored(res.status >= 500)
        return
      }
      const json = await res.json().catch(() => null)
      const rows = Array.isArray(json?.items) ? (json.items as Record<string, unknown>[]) : []
      setListings(rows.map(normaliseOwn))
    } catch {
      setListings([])
      setErrored(true)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void fetchListings()
  }, [fetchListings])

  // Deep-link: /my-listings?new=1 opens the create dialog (when entitled).
  useEffect(() => {
    if (canPublish && searchParams.get("new") === "1") {
      setEditTarget(null)
      setDialogOpen(true)
    }
  }, [canPublish, searchParams])

  /* ── Mutations ── */
  const createListing = async (payload: ListingFormPayload): Promise<string | null> => {
    if (!workspaceId) return "No active workspace."
    try {
      const res = await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, ...payload }),
      })
      if (res.status === 201 || res.ok) {
        setBanner("Listing created.")
        await fetchListings()
        return null
      }
      const json = await res.json().catch(() => null)
      if (res.status === 402) return json?.error ?? "Your plan doesn't include publishing."
      if (res.status === 503) return "Marketplace isn't ready yet. Try again shortly."
      return json?.error ?? "Couldn't create the listing."
    } catch {
      return "Network error — please try again."
    }
  }

  const updateListing = async (id: string, payload: Partial<ListingFormPayload>): Promise<string | null> => {
    try {
      const res = await fetch(`/api/marketplace/listings/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, ...payload }),
      })
      if (res.ok) {
        await fetchListings()
        return null
      }
      const json = await res.json().catch(() => null)
      if (res.status === 402) return json?.error ?? "Your plan doesn't include publishing."
      if (res.status === 404 || res.status === 503) return "This action isn't available yet."
      return json?.error ?? "Couldn't update the listing."
    } catch {
      return "Network error — please try again."
    }
  }

  const handleSubmit = async (payload: ListingFormPayload): Promise<string | null> => {
    if (editTarget) return updateListing(editTarget.id, payload)
    return createListing(payload)
  }

  const setStatus = async (listing: OwnListing, status: OwnListingStatus) => {
    const err = await updateListing(listing.id, { status })
    setBanner(err ?? `Listing ${status === "published" ? "published" : status}.`)
  }

  /* ── Derived KPIs ── */
  const stats = useMemo(() => {
    const count = (s: OwnListingStatus) => listings.filter((l) => l.status === s).length
    return {
      total: listings.length,
      published: count("published"),
      draft: count("draft"),
      paused: count("paused"),
    }
  }, [listings])

  const openCreate = () => {
    setEditTarget(null)
    setDialogOpen(true)
  }
  const openEdit = (l: OwnListing) => {
    setEditTarget(l)
    setDialogOpen(true)
  }

  return (
    <DashboardContainer>
      <MobileTopBar
        title="My listings"
        subtitle={`${listings.length} listing${listings.length === 1 ? "" : "s"}`}
        showBack
        backHref="/property-manager/marketplace"
        primaryAction={canPublish ? { label: "New listing", icon: Plus, onClick: openCreate } : undefined}
      />

      <div className="hidden md:block">
        <PageHeader
          title="My listings"
          description="Manage the listings your workspace publishes to the marketplace"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="md" asChild>
                <Link href="/property-manager/marketplace">
                  <Store className="w-4 h-4" />
                  Browse marketplace
                </Link>
              </Button>
              {canPublish && (
                <Button variant="primary" size="md" onClick={openCreate}>
                  <Plus className="w-4 h-4" />
                  New listing
                </Button>
              )}
            </div>
          }
        />
      </div>

      {banner && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-[var(--color-brand-100)] bg-[var(--brand-soft)] px-3.5 py-2.5">
          <p className="text-[13px] font-medium text-[var(--brand-strong)]">{banner}</p>
          <button onClick={() => setBanner(null)} className="text-[12px] font-semibold text-[var(--brand)] hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Not entitled — explicit upgrade prompt (never hide the surface). */}
      {!canPublish ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center text-center py-20 px-6">
            <div className="w-20 h-20 rounded-3xl bg-[#F5F3FF] flex items-center justify-center mb-5">
              <Lock className="w-9 h-9 text-[#7C3AED]" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Publishing isn&apos;t on your plan</h3>
            <p className="mt-1.5 max-w-md text-sm text-slate-500 text-pretty">
              Your {planName} plan can browse the marketplace, but publishing listings needs a higher tier.
              Upgrade to list your services and reach operators and customers across Propvora.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <Button variant="primary" size="md" asChild>
                <Link href="/property-manager/workspace-settings/subscription">View plans</Link>
              </Button>
              <Button variant="outline" size="md" asChild>
                <Link href="/property-manager/marketplace">Browse marketplace</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : loading ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        </>
      ) : errored ? (
        <MarketplaceEmptyState
          variant="own"
          title="We couldn't load your listings"
          description="There was a problem reaching the marketplace. Please try again in a moment."
          action={{ label: "Retry", onClick: () => void fetchListings() }}
        />
      ) : listings.length === 0 ? (
        <MarketplaceEmptyState
          variant="own"
          action={{ label: "Create your first listing", onClick: openCreate, icon: Plus }}
          secondaryAction={{ label: "Browse marketplace", href: "/property-manager/marketplace" }}
        />
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <StatCard icon={Store} accent="blue" label="Total listings" value={String(stats.total)} size="sm" />
            <StatCard icon={Eye} accent="emerald" label="Published" value={String(stats.published)} size="sm" />
            <StatCard icon={Pencil} accent="slate" label="Drafts" value={String(stats.draft)} size="sm" />
            <StatCard icon={Pause} accent="amber" label="Paused" value={String(stats.paused)} size="sm" />
          </div>

          {/* List */}
          <ul className="space-y-2.5" role="list">
            {listings.map((l) => (
              <li key={l.id}>
                <ListingRow
                  listing={l}
                  onEdit={() => openEdit(l)}
                  onSetStatus={(s) => void setStatus(l, s)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <ListingFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        listing={editTarget}
        onSubmit={handleSubmit}
        defaultCountry={defaultCountry}
      />
    </DashboardContainer>
  )
}

/* ── Row: works on desktop and mobile via responsive flex ── */
function ListingRow({
  listing,
  onEdit,
  onSetStatus,
}: {
  listing: OwnListing
  onEdit: () => void
  onSetStatus: (s: OwnListingStatus) => void
}) {
  const cat = categoryMeta(listing.category)
  const CatIcon = cat.icon

  const actions: { label: string; icon: typeof Pencil; onClick: () => void; variant?: "danger" }[] = [
    { label: "Edit listing", icon: Pencil, onClick: onEdit },
    ...(listing.status === "published"
      ? [{ label: "Pause", icon: Pause, onClick: () => onSetStatus("paused") }]
      : [{ label: "Publish", icon: Play, onClick: () => onSetStatus("published") }]),
    ...(listing.status !== "archived"
      ? [{ label: "Archive", icon: Archive, onClick: () => onSetStatus("archived"), variant: "danger" as const }]
      : [{ label: "Restore to draft", icon: Play, onClick: () => onSetStatus("draft") }]),
  ]

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-3 hover:border-[#BFD8FB] hover:shadow-md transition-all">
      {/* Icon chip */}
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", cat.bg)}>
        <CatIcon className={cn("w-5 h-5", cat.color)} />
      </div>

      {/* Title block */}
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

      {/* Price */}
      <div className="hidden sm:block text-right shrink-0">
        <PriceTag
          pence={listing.basePricePence}
          currency={listing.currency}
          pricingModel={listing.pricingModel}
          size="sm"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {listing.status === "published" && (
          <Link
            href={`/property-manager/marketplace/${listing.id}`}
            className="hidden sm:inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View
          </Link>
        )}
        <ActionMenu align="right" items={actions} />
      </div>
    </div>
  )
}

export default MyListingsClient
