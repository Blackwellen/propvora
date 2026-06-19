import type { Metadata } from "next"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import FeaturesPremium from "@/components/marketing/FeaturesPremium"

export const metadata: Metadata = {
  title: "Features | Propvora Property Operations Platform",
  description: "Explore Propvora portfolio, tenancy, work, PPM, calendar, messages, money, invoices, compliance, Copilot, automations and participant portals.",
}

export default function FeaturesPage() {
  return <div className="min-h-screen bg-white"><PublicNav /><main id="main-content" tabIndex={-1} className="focus:outline-none"><FeaturesPremium /></main><PublicFooter /></div>
}
