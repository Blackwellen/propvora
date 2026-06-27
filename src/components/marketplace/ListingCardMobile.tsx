"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { MapPin, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MarketListing } from "./types"
import { categoryMeta } from "./taxonomy"
import { PriceTag } from "./PriceTag"
import { TransactionTypeBadge } from "./TransactionTypeBadge"
import { ReviewStars } from "./ReviewStars"

/* ──────────────────────────────────────────────────────────────────────────
   ListingCardMobile — dedicated phone branch of ListingCard.

   Rather than reflowing the tall desktop card, the mobile card is a compact
   horizontal row: square thumbnail on the left, title/location/price stacked
   on the right, a chevron affordance. Touch target ≥44px, full-width tap.
─────────────────────────────────────────────────────────────────────────── */

const CATEGORY_GRADIENT: Record<string, string> = {
  maintenance: "linear-gradient(135deg, var(--brand-strong) 0%, var(--brand) 100%)",
  trades: "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
  cleaning: "linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)",
  compliance: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
  professional: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
  property: "linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)",
  supplies: "linear-gradient(135deg, #B45309 0%, #F59E0B 100%)",
  facilities: "linear-gradient(135deg, #475569 0%, #64748B 100%)",
  marketing: "linear-gradient(135deg, #BE185D 0%, #EC4899 100%)",
  other: "linear-gradient(135deg, #374151 0%, #6B7280 100%)",
}

export function ListingCardMobile({
  listing,
  rating = null,
  reviewCount = null,
}: {
  listing: MarketListing
  rating?: number | null
  reviewCount?: number | null
}) {
  const [imgError, setImgError] = useState(false)
  const cat = categoryMeta(listing.category)
  const CatIcon = cat.icon
  const showImage = !!listing.thumbnailUrl && !imgError
  const gradient = CATEGORY_GRADIENT[cat.key] ?? CATEGORY_GRADIENT.other

  return (
    <Link
      href={`/property-manager/marketplace/${listing.id}`}
      className={cn(
        "flex items-stretch gap-3 bg-white rounded-2xl border border-[#E8EEF8] shadow-sm p-2.5",
        "active:scale-[0.99] transition-transform hover:border-[#BFD8FB]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 motion-reduce:active:scale-100"
      )}
    >
      {/* Thumbnail */}
      <div
        className="relative w-[84px] h-[84px] shrink-0 rounded-xl overflow-hidden"
        style={!showImage ? { background: gradient } : undefined}
      >
        {showImage ? (
          <Image
            src={listing.thumbnailUrl!}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="84px"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <CatIcon className="w-7 h-7 text-white" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <TransactionTypeBadge type={listing.transactionType} />
          </div>
          <h3 className="text-[13.5px] font-bold text-[#071B4D] leading-snug line-clamp-2">
            {listing.title}
          </h3>
          {listing.location && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 truncate">
              <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
              <span className="truncate">{listing.location}</span>
            </p>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <PriceTag
            pence={listing.basePricePence}
            currency={listing.currency}
            pricingModel={listing.pricingModel}
            size="sm"
          />
          <ReviewStars rating={rating} count={reviewCount} size="sm" showValue={false} />
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-slate-300 self-center shrink-0" aria-hidden="true" />
    </Link>
  )
}

export default ListingCardMobile
