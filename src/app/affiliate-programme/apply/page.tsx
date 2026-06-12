import type { Metadata } from "next"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import ApplyClient from "./ApplyClient"

export const metadata: Metadata = {
  title: "Apply — Propvora Affiliate Programme",
  description:
    "Apply to become a Propvora partner and earn 10% recurring commission for 6 months on every paying customer you refer.",
  robots: { index: true, follow: true },
}

export default function AffiliateApplyPage() {
  return (
    <div className="min-h-screen bg-[#F6FAFF] flex flex-col">
      <PublicNav />
      <main className="flex-1 px-6 pt-28 pb-16">
        <ApplyClient />
      </main>
      <PublicFooter />
    </div>
  )
}
