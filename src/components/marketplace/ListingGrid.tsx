"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/Skeleton"
import { useIsMobile, useHasMounted } from "@/components/mobile/useBreakpoint"
import type { MarketListing } from "./types"
import { ListingCard } from "./ListingCard"
import { ListingCardMobile } from "./ListingCardMobile"

/* ──────────────────────────────────────────────────────────────────────────
   ListingGrid — responsive listing collection.

   Desktop/tablet: a responsive card grid (ListingCard).
   Mobile (<768): a stacked list of compact ListingCardMobile rows.

   It owns only presentation: loading skeletons + the swap between the two
   branches. Empty/error states are decided by the page and passed via
   `emptyState`.
─────────────────────────────────────────────────────────────────────────── */

interface ListingGridProps {
  listings: MarketListing[]
  loading?: boolean
  /** Number of skeleton placeholders while loading. */
  skeletonCount?: number
  /** Shown when there are no listings and not loading. */
  emptyState?: React.ReactNode
  className?: string
}

export function ListingGrid({
  listings,
  loading = false,
  skeletonCount = 8,
  emptyState,
  className,
}: ListingGridProps) {
  const mounted = useHasMounted()
  const mobileMatch = useIsMobile()
  const isMobile = mounted && mobileMatch

  if (loading) {
    // Mobile shows row skeletons; desktop shows card skeletons.
    if (mounted && isMobile) {
      return (
        <div className="space-y-2.5">
          {Array.from({ length: Math.min(skeletonCount, 6) }).map((_, i) => (
            <Skeleton key={i} className="h-[104px] rounded-2xl" />
          ))}
        </div>
      )
    }
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4", className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className="h-[300px] rounded-2xl" />
        ))}
      </div>
    )
  }

  if (listings.length === 0) {
    return <>{emptyState}</>
  }

  // Mobile branch — dedicated compact list.
  if (mounted && isMobile) {
    return (
      <div className="space-y-2.5" role="list">
        {listings.map((l) => (
          <ListingCardMobile key={l.id} listing={l} />
        ))}
      </div>
    )
  }

  // Desktop / tablet grid.
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4", className)}>
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  )
}

export default ListingGrid
