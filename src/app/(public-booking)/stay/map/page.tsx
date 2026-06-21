import type { Metadata } from "next"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { searchPublicListings } from "@/lib/booking"
import StaySearchExperience from "@/components/booking/StaySearchExperience"
import StayMapHero from "@/features/marketplace/components/sections/StayMapHero"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Stay map · Propvora",
  description: "Browse direct-booking stays on the map, with nightly prices and availability.",
}

export default async function StayMapPage() {
  const supabase = await createClient()
  const listings = await searchPublicListings(supabase, { limit: 90 })

  return (
    <div>
      <StayMapHero />

      <Suspense fallback={<div className="mx-auto max-w-[1500px] px-4 sm:px-6 py-7 text-[13px] text-slate-400">Loading map…</div>}>
        <StaySearchExperience listings={listings} initialView="map" />
      </Suspense>
    </div>
  )
}
