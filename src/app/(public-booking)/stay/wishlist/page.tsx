import type { Metadata } from "next"
import Link from "next/link"
import { Heart, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { searchPublicListings } from "@/lib/booking"
import StayListingCard from "@/components/booking/StayListingCard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Saved stays · Propvora",
  description: "Save stays to your Propvora account and revisit them before you book.",
}

/**
 * Public wishlist entry. Saved stays are a CUSTOMER-account feature (they live in
 * `customer_saved_listings`, scoped per account), so the anonymous /stay surface
 * honestly points to the account area and shows a handful of available stays to
 * explore. No fake "saved" data is invented for anon visitors.
 */
export default async function StayWishlistPage() {
  const supabase = await createClient()
  const listings = await searchPublicListings(supabase, { limit: 6 })

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="rounded-2xl border border-[#E2EAF6] bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-[12px] font-semibold text-rose-600">
            <Heart className="w-3.5 h-3.5" /> Saved stays
          </div>
          <h1 className="mt-3 text-[22px] font-bold tracking-tight text-[#0B1B3F]">Keep your favourites</h1>
          <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-slate-600">
            Sign in to your Propvora account to save stays and pick up where you left off. Your saved stays stay
            private to you.
          </p>
        </div>
        <div className="flex gap-2.5 shrink-0">
          <Link
            href="/customer/saved"
            className="h-11 px-4 rounded-xl bg-[#1D4ED8] text-white text-[13.5px] font-semibold inline-flex items-center hover:bg-[#1A45BE]"
          >
            Go to saved
          </Link>
          <Link
            href="/stay/search"
            className="h-11 px-4 rounded-xl border border-[#D6E0F0] text-slate-600 text-[13.5px] font-semibold inline-flex items-center gap-1.5 hover:border-slate-300"
          >
            <Search className="w-4 h-4" /> Browse stays
          </Link>
        </div>
      </div>

      {listings.length > 0 && (
        <div className="mt-7">
          <h2 className="text-[15px] font-semibold text-[#0B1B3F] mb-3">Stays to explore</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {listings.map((l) => (
              <StayListingCard key={l.id} listing={l} href={`/stay/${encodeURIComponent(l.slug ?? l.id)}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
