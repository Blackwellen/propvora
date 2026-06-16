import type { Metadata } from "next"
import Link from "next/link"
import { SlidersHorizontal } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { searchPublicListings } from "@/lib/booking"
import { formatMoney } from "@/components/booking/format"
import { STAY_TYPE_LABEL, STAY_POLICY_LABEL } from "@/components/booking/StayListingCard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Compare stays · Propvora",
  description: "Compare direct-booking stays side by side: price, cancellation policy, capacity and type.",
}

/**
 * Real side-by-side comparison of published stays (first 4 by recency). Pure
 * server render over booking_listings — price/type/cancellation are the same
 * fields the search and detail surfaces use.
 */
export default async function StayComparePage() {
  const supabase = await createClient()
  const listings = (await searchPublicListings(supabase, { limit: 4 })).slice(0, 4)

  const rows: { label: string; render: (l: (typeof listings)[number]) => string }[] = [
    { label: "From / night", render: (l) => (l.fromNightlyPence != null ? formatMoney(l.fromNightlyPence, l.currency) : "On request") },
    { label: "Type", render: (l) => STAY_TYPE_LABEL[l.listingType] ?? "Stay" },
    { label: "Sleeps", render: (l) => String(l.maxGuests) },
    { label: "Bedrooms", render: (l) => String(l.bedrooms) },
    { label: "Bathrooms", render: (l) => String(l.bathrooms) },
    { label: "Cancellation", render: (l) => STAY_POLICY_LABEL[l.cancellationPolicy] ?? "—" },
    { label: "Location", render: (l) => [l.city, l.country].filter(Boolean).join(", ") || "—" },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[12px] font-semibold text-blue-700">
        <SlidersHorizontal className="w-3.5 h-3.5" /> Compare
      </div>
      <h1 className="mt-3 text-[22px] sm:text-[26px] font-bold tracking-tight text-[#0B1B3F]">Compare stays</h1>
      <p className="mt-1.5 text-[13.5px] text-slate-600 max-w-2xl">
        See price, cancellation policy, capacity and type side by side before you book.
      </p>

      {listings.length === 0 ? (
        <div className="mt-7 rounded-2xl border border-dashed border-[#D6E0F0] bg-white py-14 text-center">
          <h3 className="text-[15px] font-semibold text-[#0B1B3F]">No stays to compare yet</h3>
          <Link href="/stay/search" className="mt-3 inline-block text-[13px] font-semibold text-[#1D4ED8] hover:underline">
            Browse stays
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-[#E2EAF6] bg-white">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-[#EEF3FB]">
                <th className="p-4 text-[12px] font-semibold text-slate-400 uppercase tracking-wide w-40">Detail</th>
                {listings.map((l) => (
                  <th key={l.id} className="p-4 align-bottom">
                    <Link href={`/stay/${encodeURIComponent(l.slug ?? l.id)}`} className="text-[14px] font-bold text-[#0B1B3F] hover:text-[#1D4ED8]">
                      {l.title}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
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
                      className="inline-flex h-9 px-3.5 rounded-lg bg-[#1D4ED8] text-white text-[12.5px] font-semibold items-center hover:bg-[#1A45BE]"
                    >
                      View & book
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
