import type { Metadata } from "next"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import EarningsClient from "./EarningsClient"

export const metadata: Metadata = {
  title: "Earnings examples — Propvora Affiliate Programme",
  description:
    "See illustrative affiliate earnings for referring property operators to Propvora at 10% recurring commission for 6 months.",
}

export default function AffiliateEarningsPage() {
  return (
    <div className="min-h-screen bg-[#F6FAFF] flex flex-col">
      <PublicNav />
      <main id="main-content" tabIndex={-1} className="focus:outline-none flex-1 px-6 pt-28 pb-16">
        <EarningsClient />
      </main>
      <PublicFooter />
    </div>
  )
}
