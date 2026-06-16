"use client"

import Link from "next/link"
import { MapPin, Users, BedDouble, Bath, ShieldCheck, Star } from "lucide-react"
import { formatMoney } from "./format"
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

/** Premium result card for a published booking_listing. Real data only. */
export default function StayListingCard({
  listing,
  href,
  onHover,
}: {
  listing: PublicListingCard
  href: string
  onHover?: (id: string | null) => void
}) {
  const place = [listing.city, listing.country].filter(Boolean).join(", ")
  return (
    <Link
      href={href}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
      className="group block rounded-2xl border border-[#E2EAF6] bg-white overflow-hidden hover:shadow-[0_8px_28px_rgba(15,23,42,0.10)] hover:border-[#C9D8F0] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
    >
      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr]">
        {/* Photo */}
        <div className="aspect-[4/3] sm:aspect-auto sm:h-full bg-gradient-to-br from-blue-50 via-slate-100 to-emerald-50 relative overflow-hidden">
          {listing.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.coverUrl}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-blue-300">
              <MapPin className="w-8 h-8" />
            </div>
          )}
          {listing.complianceStatus === "passed" && (
            <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700 shadow-sm">
              <ShieldCheck className="w-3 h-3" /> Licence verified
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-4 min-w-0 flex flex-col">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10.5px] font-semibold text-blue-700">
              {TYPE_LABEL[listing.listingType] ?? "Stay"}
            </span>
            {listing.bookingMode === "instant" && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700">
                Instant book
              </span>
            )}
          </div>

          <h3 className="text-[15px] font-bold text-[#0B1B3F] truncate">{listing.title}</h3>
          {place && (
            <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-slate-500 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {place}
            </p>
          )}
          {listing.summary && (
            <p className="mt-1.5 text-[12.5px] text-slate-500 line-clamp-2">{listing.summary}</p>
          )}

          <div className="mt-2.5 flex items-center gap-3.5 text-[12px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" /> {listing.maxGuests}
            </span>
            <span className="inline-flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5 text-slate-400" /> {listing.beds}
            </span>
            <span className="inline-flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-slate-400" /> {listing.bathrooms}
            </span>
          </div>

          <div className="mt-auto pt-3 flex items-end justify-between gap-3">
            <span className="text-[11.5px] text-slate-400">
              {POLICY_LABEL[listing.cancellationPolicy] ?? "Direct booking"}
            </span>
            {listing.fromNightlyPence != null ? (
              <span className="text-right">
                <span className="text-[16px] font-bold text-[#0B1B3F]">
                  {formatMoney(listing.fromNightlyPence, listing.currency)}
                </span>
                <span className="text-[12px] text-slate-500"> / night</span>
              </span>
            ) : (
              <span className="text-[13px] font-semibold text-[#0B1B3F]">Request a price</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export { TYPE_LABEL as STAY_TYPE_LABEL, POLICY_LABEL as STAY_POLICY_LABEL, Star }
