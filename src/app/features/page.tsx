import type { Metadata } from "next"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import FeaturesPremium from "@/components/marketing/FeaturesPremium"

export const metadata: Metadata = {
  title: "Features | Propvora Property Operations Platform",
  description: "Explore Propvora portfolio, tenancy, work, PPM, calendar, messages, money, invoices, compliance, Copilot, automations and participant portals.",
  alternates: { canonical: "/features" },
  openGraph: {
    title: "Features | Propvora Property Operations Platform",
    description: "Portfolio, work, money, compliance, Copilot and portals — one connected workspace.",
    type: "website",
    url: "/features",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
}

export default function FeaturesPage() {
  return <div className="min-h-screen bg-white"><PublicNav /><main id="main-content" tabIndex={-1} className="focus:outline-none"><FeaturesPremium /></main><PublicFooter /></div>
}
