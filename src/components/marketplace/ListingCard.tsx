"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MarketListing } from "./types"
import { categoryMeta } from "./taxonomy"
import { PriceTag } from "./PriceTag"
import { TransactionTypeBadge } from "./TransactionTypeBadge"
import { ReviewStars } from "./ReviewStars"
import { TrustBadge, type TrustKind } from "./TrustBadge"

/* ──────────────────────────────────────────────────────────────────────────
   ListingCard — the canonical browse card (desktop / tablet).

   Cover photo (or category gradient fallback), transaction-type pill, title,
   location, price (pence→currency at the edge), and a display-only rating row.
   Trust signals are passed through ONLY when the data layer provides them.
─────────────────────────────────────────────────────────────────────────── */

const CATEGORY_GRADIENT: Record<string, string> = {
  maintenance: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
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

export interface ListingCardProps {
  listing: MarketListing
  /** Display-only rating (data layer supplies; null → "no reviews yet"). */
  rating?: number | null
  reviewCount?: number | null
  /** Trust signals proven by the data layer (never fabricated by the UI). */
  trust?: TrustKind[]
  className?: string
}

export function ListingCard({ listing, rating = null, reviewCount = null, trust, className }: ListingCardProps) {
  const [imgError, setImgError] = useState(false)
  const cat = categoryMeta(listing.category)
  const CatIcon = cat.icon
  const showImage = !!listing.thumbnailUrl && !imgError
  const gradient = CATEGORY_GRADIENT[cat.key] ?? CATEGORY_GRADIENT.other

  return (
    <Link href={`/app/marketplace/${listing.id}`} className={cn("block group", className)}>
      <article
        className={cn(
          "relative bg-white rounded-2xl overflow-hidden border border-slate-200/80",
          "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]",
          "hover:shadow-[0_8px_24px_rgba(0,0,0,0.10),0_2px_6px_rgba(0,0,0,0.06)]",
          "hover:-translate-y-0.5 transition-all duration-250 flex flex-col h-full"
        )}
      >
        {/* Cover */}
        <div className="relative h-40 overflow-hidden" style={!showImage ? { background: gradient } : undefined}>
          {showImage ? (
            <Image
              src={listing.thumbnailUrl!}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 360px"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-25">
              <CatIcon className="w-12 h-12 text-white" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />

          {/* Transaction type */}
          <span className="absolute top-2.5 left-2.5">
            <TransactionTypeBadge type={listing.transactionType} className="shadow-sm backdrop-blur-sm" />
          </span>

          {/* Category chip */}
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">
            <CatIcon className={cn("w-3 h-3", cat.color)} />
            {cat.label}
          </span>
        </div>

        {/* Body */}
        <div className="px-3.5 pt-2.5 pb-3 flex flex-col flex-1">
          <h3 className="text-[13.5px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#2563EB] transition-colors">
            {listing.title}
          </h3>

          {listing.location && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 truncate">
              <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
              <span className="truncate">{listing.location}</span>
            </p>
          )}

          {trust && trust.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {trust.slice(0, 2).map((t) => (
                <TrustBadge key={t} kind={t} />
              ))}
            </div>
          )}

          <div className="mt-auto pt-2.5 flex items-end justify-between gap-2 border-t border-slate-100">
            <PriceTag
              pence={listing.basePricePence}
              currency={listing.currency}
              pricingModel={listing.pricingModel}
              size="md"
            />
            <ReviewStars rating={rating} count={reviewCount} size="sm" showValue />
          </div>
        </div>
      </article>
    </Link>
  )
}

export default ListingCard
