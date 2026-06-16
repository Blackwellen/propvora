import StayListingCard from "./StayListingCard"
import type { PublicListingCard } from "@/lib/booking/public"

/* ──────────────────────────────────────────────────────────────────────────
   SimilarStays — "More places to stay" strip on the detail page.

   Renders real PUBLISHED listings (same city / type preferred) from
   getSimilarPublicListings(). Reuses the Airbnb-grade StayListingCard so the
   cards match the browse grid exactly. Renders nothing when there are none.
─────────────────────────────────────────────────────────────────────────── */

export default function SimilarStays({ listings }: { listings: PublicListingCard[] }) {
  if (!listings.length) return null
  return (
    <section className="mt-12 border-t border-[#EEF3FB] pt-8">
      <h2 className="mb-4 text-[18px] font-bold tracking-tight text-[#0B1B3F]">More places to stay</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {listings.map((l) => (
          <StayListingCard key={l.id} listing={l} href={`/stay/${encodeURIComponent(l.slug ?? l.id)}`} />
        ))}
      </div>
    </section>
  )
}
