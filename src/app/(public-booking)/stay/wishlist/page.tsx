import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { searchPublicListings } from "@/lib/booking"
import StayListingCard from "@/components/booking/StayListingCard"
import StayWishlistHero from "@/features/marketplace/components/sections/StayWishlistHero"

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
      <StayWishlistHero />

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
