"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Star, BadgeCheck, Zap, BedDouble, Bath, Siren, Clock, Heart, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { PriceTag } from "@/components/marketplace/PriceTag"
import type { PublicListing } from "@/lib/marketplace/search"
import { intentForTransactionType, publicListingHref } from "./intent"
import { trustFromListing } from "./trust"
import { useMpWishlist } from "./useMpWishlist"

/* ── Wishlist heart (anon-safe, localStorage) ── */
function WishHeart({ id }: { id: string }) {
  const { has, toggle } = useMpWishlist()
  const saved = has(id)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(id)
      }}
      aria-label={saved ? "Remove from saved" : "Save listing"}
      className="absolute right-2.5 top-2.5 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/85 backdrop-blur-sm shadow-sm transition-transform hover:scale-110 active:scale-95"
    >
      <Heart className={cn("h-4 w-4 transition-colors", saved ? "fill-rose-500 text-rose-500" : "text-slate-600")} />
    </button>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Public marketplace cards — bound to REAL search results (PublicListing).

   Three intent-shaped variants share a base shell but surface different signals:
     StayCard      — photo-forward, nightly price, beds/baths, instant-book.
     SupplierCard  — service-forward, price-from, verified/insured trust, rating.
     EmergencyCard  — urgency-forward, "responds now", call-out price.

   Money is integer pence; only PriceTag humanises. Trust badges come ONLY from
   real verification fields (trustFromListing) — never fabricated.
─────────────────────────────────────────────────────────────────────────── */

const INTENT_GRADIENT: Record<string, string> = {
  stays: "linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)",
  suppliers: "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
  emergency: "linear-gradient(135deg, #B91C1C 0%, #EF4444 100%)",
  services: "linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)",
  all: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
}

function Cover({
  listing,
  height = "h-44",
  children,
}: {
  listing: PublicListing
  height?: string
  children?: React.ReactNode
}) {
  const [err, setErr] = useState(false)
  const intent = intentForTransactionType(listing.transactionType)
  const show = !!listing.thumbnailUrl && !err
  const gradient = INTENT_GRADIENT[intent.key] ?? INTENT_GRADIENT.all
  const Icon = intent.icon
  return (
    <div className={cn("relative overflow-hidden", height)} style={!show ? { background: gradient } : undefined}>
      {show ? (
        <Image
          src={listing.thumbnailUrl!}
          alt={listing.title}
          fill
          className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 380px"
          onError={() => setErr(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center opacity-25">
          <Icon className="w-12 h-12 text-white" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
      {children}
    </div>
  )
}

function Rating({ rating, count }: { rating: number | null; count: number | null }) {
  if (rating == null || rating <= 0) {
    return <span className="text-[11.5px] text-slate-400">No reviews yet</span>
  }
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-700">
      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      {rating.toFixed(1)}
      {count != null && count > 0 && <span className="font-normal text-slate-400">({count})</span>}
    </span>
  )
}

interface CardProps {
  listing: PublicListing
  className?: string
}

/* ── StayCard ── */
export function StayCard({ listing, className }: CardProps) {
  const href = publicListingHref({ id: listing.id, transactionType: listing.transactionType })
  return (
    <Link href={href} className={cn("block group", className)}>
      <article className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full">
        <Cover listing={listing} height="h-48">
          <WishHeart id={listing.id} />
          {listing.instantBook && (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10.5px] font-bold text-[#2563EB] shadow-sm">
              <Zap className="w-3 h-3" /> Instant book
            </span>
          )}
        </Cover>
        <div className="px-4 pt-3 pb-3.5 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[14px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#2563EB] transition-colors">
              {listing.title}
            </h3>
            <Rating rating={listing.rating} count={listing.reviewCount} />
          </div>
          {(listing.city || listing.location) && (
            <p className="mt-1 flex items-center gap-1 text-[11.5px] text-slate-500 truncate">
              <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
              <span className="truncate">{listing.city ?? listing.location}</span>
            </p>
          )}
          <div className="mt-auto pt-3 flex items-end justify-between gap-2 border-t border-slate-100">
            <span>
              <PriceTag pence={listing.basePricePence} currency={listing.currency} pricingModel={listing.pricingModel} size="md" />
              <span className="block text-[11px] text-slate-400">total shown at checkout</span>
            </span>
            <span className="text-[11px] font-medium text-slate-400">View stay →</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

/* ── SupplierCard ── Airbnb-style full-bleed image + Upwork/Airtasker info ── */
export function SupplierCard({ listing, className }: CardProps) {
  const href = publicListingHref({ id: listing.id, transactionType: listing.transactionType })
  const trust = trustFromListing(listing)
  const isVerified = trust.includes("verified")
  const [imgErr, setImgErr] = useState(false)
  const showImage = !!listing.thumbnailUrl && !imgErr
  const intent = intentForTransactionType(listing.transactionType)
  const Icon = intent.icon

  return (
    <article className={cn("bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full group", className)}>
      {/* Hero image — 16:9 ratio, full-bleed */}
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        <Link href={href} tabIndex={-1} aria-hidden="true">
          {showImage ? (
            <Image
              src={listing.thumbnailUrl!}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: INTENT_GRADIENT.suppliers }}
            >
              <Icon className="w-10 h-10 text-white/25" aria-hidden="true" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
        </Link>
        {/* Verified badge — top left */}
        {isVerified && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-bold text-emerald-700 shadow-sm pointer-events-none">
            <BadgeCheck className="w-3 h-3" aria-hidden="true" /> Verified
          </span>
        )}
        {/* Fast response — top right */}
        {listing.instantBook && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10.5px] font-bold text-[#2563EB] shadow-sm pointer-events-none">
            <Clock className="w-3 h-3" aria-hidden="true" /> Fast response
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-3.5 flex flex-col flex-1">
        <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded">
          <h3 className="text-[14px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#2563EB] transition-colors">
            {listing.title}
          </h3>
        </Link>
        {listing.description && (
          <p className="mt-1 text-[12px] text-slate-500 line-clamp-2">{listing.description}</p>
        )}
        {(listing.location ?? listing.region ?? listing.city) && (
          <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-slate-500 truncate">
            <MapPin className="w-3 h-3 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="truncate">{listing.location ?? listing.region ?? listing.city}</span>
          </p>
        )}
        {/* Rating + trust badges */}
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <Rating rating={listing.rating} count={listing.reviewCount} />
          {isVerified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <ShieldCheck className="w-3 h-3" aria-hidden="true" /> Vetted
            </span>
          )}
        </div>
        {/* Price + CTA */}
        <div className="mt-auto pt-3 flex items-end justify-between gap-2 border-t border-slate-100">
          <div>
            <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">From</span>
            <PriceTag pence={listing.basePricePence} currency={listing.currency} pricingModel={listing.pricingModel} size="md" />
          </div>
          <Link
            href={href}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1"
          >
            Get quote
          </Link>
        </div>
      </div>
    </article>
  )
}

/* ── EmergencyCard — premium hero-image card with red urgent styling ── */
export function EmergencyCard({ listing, className }: CardProps) {
  const href = publicListingHref({ id: listing.id, transactionType: listing.transactionType })
  const [imgErr, setImgErr] = useState(false)
  const showImage = !!listing.thumbnailUrl && !imgErr
  return (
    <article className={cn("bg-white rounded-2xl overflow-hidden border border-red-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_28px_rgba(239,68,68,0.16)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full group", className)}>
      {/* Hero image — 16:9 */}
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        <Link href={href} tabIndex={-1} aria-hidden="true">
          {showImage ? (
            <Image
              src={listing.thumbnailUrl!}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
              <Siren className="w-10 h-10 text-white/30" aria-hidden="true" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
        </Link>
        {/* Emergency badge */}
        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm pointer-events-none">
          <Zap className="w-3 h-3" aria-hidden="true" />
          Emergency
        </span>
        {/* Responds now chip */}
        <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-bold text-red-600 shadow-sm pointer-events-none">
          <Clock className="w-3 h-3" aria-hidden="true" /> Responds now
        </span>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-3.5 flex flex-col flex-1">
        <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded">
          <h3 className="text-[14px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
            {listing.title}
          </h3>
        </Link>
        {listing.description && (
          <p className="mt-1.5 text-[12px] text-slate-500 line-clamp-2">{listing.description}</p>
        )}
        {(listing.location ?? listing.region ?? listing.city) && (
          <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-slate-500 truncate">
            <MapPin className="w-3 h-3 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="truncate">{listing.location ?? listing.region ?? listing.city}</span>
          </p>
        )}
        <div className="mt-auto pt-3 flex items-end justify-between gap-2 border-t border-red-100">
          <div>
            <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">Call-out from</span>
            <PriceTag pence={listing.basePricePence} currency={listing.currency} pricingModel={listing.pricingModel} size="md" />
          </div>
          <Link
            href={href}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-1"
          >
            Request now
          </Link>
        </div>
      </div>
    </article>
  )
}

/* ── Beds/baths inline meta (stays) ── */
export function StayMeta({ bedrooms, bathrooms }: { bedrooms: number | null; bathrooms: number | null }) {
  if (bedrooms == null && bathrooms == null) return null
  return (
    <div className="flex items-center gap-3 text-[12px] text-slate-500">
      {bedrooms != null && (
        <span className="inline-flex items-center gap-1">
          <BedDouble className="w-3.5 h-3.5 text-slate-400" /> {bedrooms} bed{bedrooms === 1 ? "" : "s"}
        </span>
      )}
      {bathrooms != null && (
        <span className="inline-flex items-center gap-1">
          <Bath className="w-3.5 h-3.5 text-slate-400" /> {bathrooms} bath{bathrooms === 1 ? "" : "s"}
        </span>
      )}
    </div>
  )
}

/** Pick the right card variant for a listing based on its intent. */
export function PublicListingCard({ listing }: CardProps) {
  const intent = intentForTransactionType(listing.transactionType)
  if (intent.key === "stays") return <StayCard listing={listing} />
  if (intent.key === "emergency") return <EmergencyCard listing={listing} />
  return <SupplierCard listing={listing} />
}
