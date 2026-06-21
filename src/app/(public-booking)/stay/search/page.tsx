import type { Metadata } from "next"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { searchPublicListings } from "@/lib/booking"
import StaySearchExperience from "@/components/booking/StaySearchExperience"
import StaySearchHero from "@/features/marketplace/components/sections/StaySearchHero"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Find a stay · Propvora",
  description:
    "Search direct-booking stays. Real availability, transparent total pricing, cancellation policy and host identity shown before you book.",
}

export default async function StaySearchPage() {
  const supabase = await createClient()
  const listings = await searchPublicListings(supabase, { limit: 90 })

  return (
    <div>
      <StaySearchHero />

      <Suspense
        fallback={
          <div className="mx-auto max-w-[1500px] px-4 sm:px-6 py-7">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[300px] animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          </div>
        }
      >
        <StaySearchExperience listings={listings} initialView="list" />
      </Suspense>
    </div>
  )
}
