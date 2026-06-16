"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Heart, X } from "lucide-react"
import { formatMoney } from "./format"
import { useWishlist } from "./useWishlist"
import { STAY_TYPE_LABEL, STAY_POLICY_LABEL } from "./StayListingCard"
import type { PublicListingCard } from "@/lib/booking/public"

/* ──────────────────────────────────────────────────────────────────────────
   CompareClient — side-by-side comparison of the user's ACTUAL saved stays.

   The selection set is the real wishlist (useWishlist): localStorage for anon
   visitors, mirrored from `customer_saved_listings` for signed-in customers via
   the heart on every card. The `pool` is real PUBLISHED booking_listings passed
   from the server; we render the intersection (the stays the user actually
   saved). With nothing saved we fall back to a handful of recent stays so the
   page is never empty — clearly labelled as suggestions, not fake "saved" data.
─────────────────────────────────────────────────────────────────────────── */

const ROWS: { label: string; render: (l: PublicListingCard) => string }[] = [
  { label: "From / night", render: (l) => (l.fromNightlyPence != null ? formatMoney(l.fromNightlyPence, l.currency) : "On request") },
  { label: "Type", render: (l) => STAY_TYPE_LABEL[l.listingType] ?? "Stay" },
  { label: "Rating", render: (l) => (l.rating != null && l.rating > 0 ? `${l.rating.toFixed(1)}${l.reviewCount ? ` (${l.reviewCount})` : ""}` : "New") },
  { label: "Sleeps", render: (l) => String(l.maxGuests) },
  { label: "Bedrooms", render: (l) => String(l.bedrooms) },
  { label: "Bathrooms", render: (l) => String(l.bathrooms) },
  { label: "Cancellation", render: (l) => STAY_POLICY_LABEL[l.cancellationPolicy] ?? "—" },
  { label: "Location", render: (l) => [l.city, l.country].filter(Boolean).join(", ") || "—" },
]

export default function CompareClient({ pool }: { pool: PublicListingCard[] }) {
  const { ids, toggle, count } = useWishlist()

  const saved = useMemo(() => pool.filter((l) => ids.has(l.id)).slice(0, 4), [pool, ids])
  const usingFallback = saved.length === 0
  const listings = usingFallback ? pool.slice(0, 4) : saved

  if (listings.length === 0) {
    return (
      <div className="mt-7 rounded-2xl border border-dashed border-[#D6E0F0] bg-white py-14 text-center">
        <h3 className="text-[15px] font-semibold text-[#0B1B3F]">No stays to compare yet</h3>
        <Link href="/stay/search" className="mt-3 inline-block text-[13px] font-semibold text-[#1D4ED8] hover:underline">
          Browse stays
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <p className="mb-3 text-[12.5px] text-slate-500">
        {usingFallback ? (
          <>
            You haven&apos;t saved any stays yet — here are a few to explore. Tap the{" "}
            <Heart className="inline h-3.5 w-3.5 -mt-0.5 text-rose-500" /> on any stay to add it to this comparison.
          </>
        ) : (
          <>
            Comparing <span className="font-semibold text-[#0B1B3F]">{listings.length}</span> of your{" "}
            {count} saved stay{count === 1 ? "" : "s"}.
          </>
        )}
      </p>
      <div className="overflow-x-auto rounded-2xl border border-[#E2EAF6] bg-white">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-[#EEF3FB]">
              <th className="w-40 p-4 text-[12px] font-semibold uppercase tracking-wide text-slate-400">Detail</th>
              {listings.map((l) => (
                <th key={l.id} className="p-4 align-bottom">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/stay/${encodeURIComponent(l.slug ?? l.id)}`}
                      className="text-[14px] font-bold text-[#0B1B3F] hover:text-[#1D4ED8]"
                    >
                      {l.title}
                    </Link>
                    {!usingFallback && (
                      <button
                        type="button"
                        onClick={() => toggle(l.id)}
                        aria-label="Remove from comparison"
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label} className="border-b border-[#F1F5FB] last:border-0">
                <td className="p-4 text-[12.5px] font-semibold text-slate-500">{r.label}</td>
                {listings.map((l) => (
                  <td key={l.id} className="p-4 text-[13.5px] text-[#0B1B3F]">
                    {r.render(l)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-4" />
              {listings.map((l) => (
                <td key={l.id} className="p-4">
                  <Link
                    href={`/stay/${encodeURIComponent(l.slug ?? l.id)}`}
                    className="inline-flex h-9 items-center rounded-lg bg-[#1D4ED8] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[#1A45BE]"
                  >
                    View &amp; book
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
