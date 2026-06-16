import type { Metadata } from "next"
import { Suspense } from "react"
import { MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { searchPublicListings } from "@/lib/booking"
import StaySearchExperience from "@/components/booking/StaySearchExperience"

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
      <section className="border-b border-[#E2EAF6] bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-7">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[12px] font-semibold text-blue-700">
            <MapPin className="w-3.5 h-3.5" /> Map search
          </div>
          <h1 className="mt-3 text-[24px] sm:text-[28px] font-bold tracking-tight text-[#0B1B3F]">
            Stays on the map
          </h1>
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-slate-600">
            Compare stays by area and nightly price. Listings without a plotted location still appear in the list.
          </p>
        </div>
      </section>

      <Suspense fallback={<div className="mx-auto max-w-[1500px] px-4 sm:px-6 py-7 text-[13px] text-slate-400">Loading map…</div>}>
        <StaySearchExperience listings={listings} initialView="map" />
      </Suspense>
    </div>
  )
}
