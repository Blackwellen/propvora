"use client"

import Link from "next/link"
import { MapPin, Users, BedDouble, Bath, ShieldCheck, Star, Heart, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatMoney } from "./format"
import CardCarousel from "./CardCarousel"
import { useWishlist } from "./useWishlist"
import type { PublicListingCard } from "@/lib/booking/public"

const TYPE_LABEL: Record<string, string> = {
  entire_home: "Entire home",
  private_room: "Private room",
  shared_room: "Shared room",
  serviced_accommodation: "Serviced apartment",
  student_room: "Student room",
  hmo_room: "Room in shared house",
  unit: "Unit",
  other: "Stay",
}

const POLICY_LABEL: Record<string, string> = {
  flexible: "Flexible cancellation",
  moderate: "Moderate cancellation",
  strict: "Strict cancellation",
  non_refundable: "Non-refundable",
  custom: "Custom policy",
}

/**
 * Airbnb-grade result card for a published booking_listing. Photo carousel,
 * wishlist heart, instant-book badge, real rating, price/night. Real data only.
 * `layout="row"` renders the compact horizontal variant used in map split rails.
 */
export default function StayListingCard({
  listing,
  href,
  onHover,
  layout = "grid",
}: {
  listing: PublicListingCard
  href: string
  onHover?: (id: string | null) => void
  layout?: "grid" | "row"
}) {
  const { has, toggle } = useWishlist()
  const saved = has(listing.id)
  const place = [listing.city, listing.country].filter(Boolean).join(", ")
  const photos = listing.photoUrls?.length ? listing.photoUrls : listing.coverUrl ? [listing.coverUrl] : []

  const Wishlist = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(listing.id)
      }}
      aria-label={saved ? "Remove from saved" : "Save stay"}
      className="absolute right-2.5 top-2.5 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/85 backdrop-blur-sm shadow-sm transition-transform hover:scale-110 active:scale-95"
    >
      <Heart className={cn("h-4 w-4 transition-colors", saved ? "fill-rose-500 text-rose-500" : "text-slate-600")} />
    </button>
  )

  const Badges = (
    <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1">
      {listing.bookingMode === "instant" && (
        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10.5px] font-bold text-[var(--brand)] shadow-sm">
          <Zap className="h-3 w-3" /> Instant book
        </span>
      )}
      {listing.complianceStatus === "passed" && (
        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700 shadow-sm">
          <ShieldCheck className="h-3 w-3" /> Licence verified
        </span>
      )}
    </div>
  )

  const Meta = (
    <div className="mt-2 flex items-center gap-3 text-[12px] text-slate-500">
      <span className="inline-flex items-center gap-1">
        <Users className="h-3.5 w-3.5 text-slate-400" /> {listing.maxGuests}
      </span>
      <span className="inline-flex items-center gap-1">
        <BedDouble className="h-3.5 w-3.5 text-slate-400" /> {listing.beds}
      </span>
      <span className="inline-flex items-center gap-1">
        <Bath className="h-3.5 w-3.5 text-slate-400" /> {listing.bathrooms}
      </span>
    </div>
  )

  const RatingChip =
    listing.rating != null && listing.rating > 0 ? (
      <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-slate-800">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        {listing.rating.toFixed(1)}
        {listing.reviewCount != null && listing.reviewCount > 0 && (
          <span className="font-normal text-slate-400">({listing.reviewCount})</span>
        )}
      </span>
    ) : (
      <span className="text-[11.5px] text-slate-400">New</span>
    )

  const Price =
    listing.fromNightlyPence != null ? (
      <span className="text-[#0B1B3F]">
        <span className="text-[15.5px] font-bold">{formatMoney(listing.fromNightlyPence, listing.currency)}</span>
        <span className="text-[12.5px] font-normal text-slate-500"> / night</span>
      </span>
    ) : (
      <span className="text-[13px] font-semibold text-[#0B1B3F]">Request a price</span>
    )

  if (layout === "row") {
    return (
      <Link
        href={href}
        onMouseEnter={() => onHover?.(listing.id)}
        onMouseLeave={() => onHover?.(null)}
        className="group flex gap-3 rounded-2xl border border-[#E2EAF6] bg-white p-2.5 transition-all hover:border-[#C9D8F0] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
      >
        <div className="relative w-[112px] shrink-0 overflow-hidden rounded-xl">
          <CardCarousel photos={photos.slice(0, 1)} alt={listing.title} aspect="aspect-square" fallback={<FallbackArt />} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="truncate text-[13.5px] font-bold text-[#0B1B3F]">{listing.title}</h3>
            {RatingChip}
          </div>
          {place && <p className="mt-0.5 truncate text-[12px] text-slate-500">{place}</p>}
          <div className="mt-auto pt-1.5">{Price}</div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
    >
      <div className="relative overflow-hidden rounded-2xl">
        {Wishlist}
        {Badges}
        <CardCarousel photos={photos} alt={listing.title} aspect="aspect-[4/3]" fallback={<FallbackArt />} />
      </div>
      <div className="px-0.5 pt-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-[14.5px] font-bold text-[#0B1B3F]">{listing.title}</h3>
          {RatingChip}
        </div>
        {place && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-[12.5px] text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {place}
          </p>
        )}
        <p className="mt-0.5 text-[12px] text-slate-400">{TYPE_LABEL[listing.listingType] ?? "Stay"}</p>
        {Meta}
        <div className="mt-2 flex items-end justify-between gap-2">
          {Price}
          <span className="text-[11px] text-slate-400">{POLICY_LABEL[listing.cancellationPolicy] ?? "Direct booking"}</span>
        </div>
      </div>
    </Link>
  )
}

function FallbackArt() {
  return (
    <div className="flex h-full w-full items-center justify-center text-[var(--color-brand-300)]">
      <MapPin className="h-8 w-8" />
    </div>
  )
}

export { TYPE_LABEL as STAY_TYPE_LABEL, POLICY_LABEL as STAY_POLICY_LABEL, Star }
