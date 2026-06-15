"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Store } from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { Skeleton } from "@/components/ui/Skeleton"
import { Button } from "@/components/ui/Button"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import {
  ListingDetail,
  MarketplaceEmptyState,
  normaliseListing,
  type MarketListing,
} from "@/components/marketplace"
import type { TrustKind } from "@/components/marketplace/TrustBadge"

/* ──────────────────────────────────────────────────────────────────────────
   MarketplaceDetailClient — fetches one listing and renders ListingDetail.

   Consumes `GET /api/marketplace/listings/[id]` defensively: that route may
   not exist yet in this branch (sibling agent owns it). Any non-200 → a real,
   premium "listing unavailable" state, never a crash. The detail surface reads
   safe public fields only; seller trust signals are rendered ONLY when the
   payload genuinely provides them.
─────────────────────────────────────────────────────────────────────────── */

interface Props {
  listingId: string
}

interface SellerInfo {
  name?: string | null
  rating?: number | null
  reviewCount?: number | null
  trust?: TrustKind[]
  memberSince?: string | null
}

const TRUST_KEYS: TrustKind[] = ["verified", "insured", "responsive", "top_rated"]

function extractListing(json: unknown): MarketListing | null {
  if (!json || typeof json !== "object") return null
  const obj = json as Record<string, unknown>
  // Tolerate { listing }, { item } or a bare row.
  const row = (obj.listing ?? obj.item ?? obj) as Record<string, unknown>
  if (!row || typeof row !== "object" || !row.id) return null
  return normaliseListing(row)
}

function extractSeller(json: unknown): SellerInfo | undefined {
  if (!json || typeof json !== "object") return undefined
  const obj = json as Record<string, unknown>
  const s = obj.seller as Record<string, unknown> | undefined
  if (!s || typeof s !== "object") return undefined
  const trust = Array.isArray(s.trust)
    ? (s.trust as unknown[]).filter((t): t is TrustKind => TRUST_KEYS.includes(t as TrustKind))
    : undefined
  return {
    name: typeof s.name === "string" ? s.name : null,
    rating: typeof s.rating === "number" ? s.rating : null,
    reviewCount: typeof s.reviewCount === "number" ? s.reviewCount : null,
    trust,
    memberSince: typeof s.memberSince === "string" ? s.memberSince : null,
  }
}

function extractMedia(json: unknown): string[] {
  if (!json || typeof json !== "object") return []
  const obj = json as Record<string, unknown>
  const media = obj.media ?? (obj.listing as Record<string, unknown> | undefined)?.media
  if (!Array.isArray(media)) return []
  return media
    .map((m) => (typeof m === "string" ? m : (m as Record<string, unknown>)?.url))
    .filter((u): u is string => typeof u === "string" && u.length > 0)
}

export function MarketplaceDetailClient({ listingId }: Props) {
  const [listing, setListing] = useState<MarketListing | null>(null)
  const [media, setMedia] = useState<string[]>([])
  const [seller, setSeller] = useState<SellerInfo | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setNotFound(false)
    fetch(`/api/marketplace/listings/${encodeURIComponent(listingId)}`, {
      headers: { accept: "application/json" },
    })
      .then(async (res) => {
        if (!active) return
        if (!res.ok) {
          setNotFound(true)
          return
        }
        const json = await res.json().catch(() => null)
        const parsed = extractListing(json)
        if (!parsed) {
          setNotFound(true)
          return
        }
        setListing(parsed)
        setMedia(extractMedia(json))
        setSeller(extractSeller(json))
      })
      .catch(() => {
        if (active) setNotFound(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [listingId])

  return (
    <DashboardContainer>
      <MobileTopBar title="Listing" showBack backHref="/app/marketplace" />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-5">
            <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-60 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      ) : notFound || !listing ? (
        <MarketplaceEmptyState
          variant="no-results"
          title="This listing is unavailable"
          description="It may have been unpublished, archived, or it isn't ready yet. Browse the marketplace to find what you need."
          action={{ label: "Back to marketplace", href: "/app/marketplace", icon: Store }}
        />
      ) : (
        <ListingDetail listing={listing} media={media} seller={seller} />
      )}

      {/* Desktop back-to-browse fallback when there is no detail */}
      {!loading && (notFound || !listing) && (
        <div className="hidden md:flex justify-center mt-4">
          <Button variant="outline" size="md" asChild>
            <Link href="/app/marketplace">Return to marketplace</Link>
          </Button>
        </div>
      )}
    </DashboardContainer>
  )
}

export default MarketplaceDetailClient
