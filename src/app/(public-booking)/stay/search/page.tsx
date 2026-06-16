import type { Metadata } from "next"
import { Sparkles } from "lucide-react"
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

export default async function StaySearchPage() {
  const supabase = await createClient()
  const listings = await searchPublicListings(supabase, { limit: 90 })

  return (
    <div>
      <section className="border-b border-[#E2EAF6] bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-7 sm:py-9">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[12px] font-semibold text-blue-700">
            <Sparkles className="w-3.5 h-3.5" /> Direct booking
          </div>
          <h1 className="mt-3 text-[26px] sm:text-[32px] font-bold tracking-tight text-[#0B1B3F]">
            Find your stay
          </h1>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-slate-600">
            Book directly with professional property managers. You see the full trip price, the cancellation
            policy and who you&apos;re booking with — before you pay.
          </p>
        </div>
      </section>

      <StaySearchExperience listings={listings} initialView="list" />
    </div>
  )
}
