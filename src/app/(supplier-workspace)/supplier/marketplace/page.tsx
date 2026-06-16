"use client"

import React, { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { moneyPence, fmtDate } from "@/components/supplier-workspace/format"
import {
  SupplierPageHeader,
  SupplierKpiStrip,
  SupplierStatusBadge,
  SupplierButton,
  SupplierEmptyState,
  SupplierLoadingState,
  SupplierCard,
  SupplierBanner,
} from "@/components/supplier-workspace/ui"
import { Store, MoreVertical, Plus, Eye, Archive, Trash2, Pencil } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Listing {
  id: string
  title: string
  category: string | null
  transaction_type: string
  status: string
  base_price_pence: number | null
  pricing_model: string | null
  currency: string
  updated_at: string
  cover_url?: string | null
}

type StatusFilter =
  | "all"
  | "draft"
  | "pending_review"
  | "published"
  | "paused"
  | "archived"

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All",            value: "all" },
  { label: "Draft",          value: "draft" },
  { label: "Pending Review", value: "pending_review" },
  { label: "Published",      value: "published" },
  { label: "Paused",         value: "paused" },
  { label: "Archived",       value: "archived" },
]

// ─── Listing Card ─────────────────────────────────────────────────────────────

function ListingCard({
  listing,
  onArchive,
  onDelete,
}: {
  listing: Listing
  onArchive: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <SupplierCard className="overflow-hidden flex flex-col">
      {/* Cover image */}
      <div className="h-36 bg-slate-100 relative overflow-hidden">
        {listing.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.cover_url}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store className="w-10 h-10 text-slate-300" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <SupplierStatusBadge status={listing.status} />
        </div>
        {/* More menu */}
        <div className="absolute top-2 right-2">
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-600 hover:bg-white transition-colors"
              aria-label="Listing actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
                <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 text-sm">
                  <Link
                    href={`/supplier/marketplace/${listing.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </Link>
                  <button
                    className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 w-full text-left"
                    onClick={() => { setMenuOpen(false); onArchive(listing.id) }}
                  >
                    <Archive className="w-4 h-4" /> Archive
                  </button>
                  <button
                    className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                    onClick={() => { setMenuOpen(false); onDelete(listing.id) }}
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-1 p-4 flex-1">
        <p className="text-xs text-slate-400 uppercase tracking-wide">
          {listing.category ?? listing.transaction_type.replace(/_/g, " ")}
        </p>
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">{listing.title}</h3>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-slate-900">
              {moneyPence(listing.base_price_pence, listing.currency)}
            </span>
            {listing.pricing_model && (
              <span className="text-xs text-slate-400 ml-1">
                / {listing.pricing_model.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <Link href={`/supplier/marketplace/${listing.id}`}>
            <SupplierButton variant="outline" size="sm">
              <Eye className="w-3.5 h-3.5" /> View
            </SupplierButton>
          </Link>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Updated {fmtDate(listing.updated_at)}
        </p>
      </div>
    </SupplierCard>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)

  // Load listings
  const loadListings = useCallback(async (wsId: string) => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: qErr } = await supabase
        .from("marketplace_listings")
        .select("id, title, category, transaction_type, status, base_price_pence, pricing_model, currency, updated_at")
        .eq("workspace_id", wsId)
        .order("updated_at", { ascending: false })

      if (qErr) throw qErr

      // Fetch cover images
      const ids = (data ?? []).map((l) => l.id)
      let coverMap: Record<string, string> = {}
      if (ids.length > 0) {
        const { data: media } = await supabase
          .from("marketplace_listing_media")
          .select("listing_id, url, sort_order")
          .in("listing_id", ids)
          .order("sort_order", { ascending: true })

        if (media) {
          for (const m of media) {
            if (!coverMap[m.listing_id]) {
              coverMap[m.listing_id] = m.url
            }
          }
        }
      }

      const enriched: Listing[] = (data ?? []).map((l) => ({
        ...l,
        cover_url: coverMap[l.id] ?? null,
      }))
      setListings(enriched)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load listings")
    } finally {
      setLoading(false)
    }
  }, [])

  // Init: get workspace
  useEffect(() => {
    let active = true
    const supabase = createClient()
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !active) return

        const { data: member } = await supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle()

        if (!active) return
        if (member?.workspace_id) {
          setWorkspaceId(member.workspace_id)
          await loadListings(member.workspace_id)
        } else {
          setLoading(false)
        }
      } catch {
        if (active) {
          setError("Could not resolve workspace")
          setLoading(false)
        }
      }
    })()
    return () => { active = false }
  }, [loadListings])

  async function handleArchive(id: string) {
    const supabase = createClient()
    await supabase
      .from("marketplace_listings")
      .update({ status: "archived" })
      .eq("id", id)
    if (workspaceId) loadListings(workspaceId)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this listing? This cannot be undone.")) return
    const supabase = createClient()
    await supabase.from("marketplace_listings").delete().eq("id", id)
    if (workspaceId) loadListings(workspaceId)
  }

  const filtered =
    statusFilter === "all"
      ? listings
      : listings.filter((l) => l.status === statusFilter)

  // KPIs
  const kpis = [
    { label: "Total Listings",   value: listings.length },
    { label: "Published",        value: listings.filter((l) => l.status === "published").length },
    { label: "Pending Review",   value: listings.filter((l) => l.status === "pending_review").length },
    { label: "Draft",            value: listings.filter((l) => l.status === "draft").length },
  ]

  return (
    <div>
      <SupplierPageHeader
        title="Marketplace"
        subtitle="Manage your listings on the Propvora marketplace"
        actions={
          <Link href="/supplier/marketplace/new">
            <SupplierButton>
              <Plus className="w-4 h-4" /> New Listing
            </SupplierButton>
          </Link>
        }
      />

      {/* Mobile header */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <h1 className="text-lg font-semibold text-slate-900">Marketplace</h1>
        <Link href="/supplier/marketplace/new">
          <SupplierButton size="sm">
            <Plus className="w-4 h-4" /> New
          </SupplierButton>
        </Link>
      </div>

      {error && <SupplierBanner tone="red" msg={error} />}

      <SupplierKpiStrip kpis={kpis} />

      {/* Status filter tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 mb-6 pb-0 scrollbar-none">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
              statusFilter === f.value
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SupplierLoadingState rows={6} />
      ) : filtered.length === 0 ? (
        <SupplierEmptyState
          icon={<Store className="w-12 h-12" />}
          title={statusFilter === "all" ? "No listings yet" : `No ${statusFilter.replace("_", " ")} listings`}
          description={
            statusFilter === "all"
              ? "Create your first marketplace listing to start receiving enquiries and bookings."
              : undefined
          }
          action={
            statusFilter === "all" ? (
              <Link href="/supplier/marketplace/new">
                <SupplierButton>
                  <Plus className="w-4 h-4" /> Create Listing
                </SupplierButton>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
