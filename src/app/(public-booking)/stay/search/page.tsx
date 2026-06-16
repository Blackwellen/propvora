import type { Metadata } from "next"
import { Suspense } from "react"
import { ShieldCheck, Star, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { searchPublicListings } from "@/lib/booking"
import StaySearchExperience from "@/components/booking/StaySearchExperience"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Find a stay · Propvora",
  description:
    "Search direct-booking stays. Real availability, transparent total pricing, cancellation policy and host identity shown before you book.",
}

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Licence verified hosts" },
  { icon: Zap, label: "Instant booking available" },
  { icon: Star, label: "Genuine guest reviews" },
]

export default async function StaySearchPage() {
  const supabase = await createClient()
  const listings = await searchPublicListings(supabase, { limit: 90 })

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-[#E2EAF6] bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-11">
          <h1 className="text-[28px] sm:text-[36px] font-bold tracking-tight text-[#0B1B3F] leading-tight">
            Find your next stay
          </h1>
          <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-slate-600">
            Book direct with professional property managers — real availability, transparent total pricing and
            verified host identity shown before you pay.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600">
                <Icon className="w-4 h-4 text-[#1D4ED8]" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

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
