import type { Metadata } from "next"
import { SlidersHorizontal } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { searchPublicListings } from "@/lib/booking"
import CompareClient from "@/components/booking/CompareClient"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Compare stays · Propvora",
  description: "Compare the direct-booking stays you've saved side by side: price, rating, cancellation policy, capacity and type.",
}

/**
 * Compare stays. The server provides a real pool of PUBLISHED booking_listings;
 * the client filters it to the visitor's ACTUAL saved set (the wishlist —
 * localStorage for anon, mirrored from customer_saved_listings when signed in)
 * and renders the side-by-side table. No fabricated "saved" data; an empty
 * wishlist falls back to a few clearly-labelled suggestions.
 */
export default async function StayComparePage() {
  const supabase = await createClient()
  const pool = await searchPublicListings(supabase, { limit: 60 })

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[12px] font-semibold text-blue-700">
        <SlidersHorizontal className="w-3.5 h-3.5" /> Compare
      </div>
      <h1 className="mt-3 text-[22px] sm:text-[26px] font-bold tracking-tight text-[#0B1B3F]">Compare stays</h1>
      <p className="mt-1.5 max-w-2xl text-[13.5px] text-slate-600">
        See price, rating, cancellation policy, capacity and type side by side before you book.
      </p>

      <CompareClient pool={pool} />
    </div>
  )
}
