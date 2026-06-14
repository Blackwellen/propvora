import type { Metadata } from "next"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import HeroSection from "@/components/marketing/landing/HeroSection"
import BuiltForSection from "@/components/marketing/landing/BuiltForSection"
import ToolsSection from "@/components/marketing/landing/ToolsSection"
import WhyTeamsSection from "@/components/marketing/landing/WhyTeamsSection"
import PricingSection from "@/components/marketing/landing/PricingSection"

export const metadata: Metadata = {
  title: "Propvora — Property Management Software",
  description:
    "Propvora — property management software for landlords and letting agents. Manage portfolios, tenants, maintenance, compliance and finances.",
  openGraph: {
    title: "Propvora — Property Management Software",
    description:
      "Propvora — property management software for landlords and letting agents. Manage portfolios, tenants, maintenance, compliance and finances.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Propvora — Property Management Software",
    description:
      "Propvora — property management software for landlords and letting agents. Manage portfolios, tenants, maintenance, compliance and finances.",
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <HeroSection />
        <BuiltForSection />
        <ToolsSection />
        <WhyTeamsSection />
        <PricingSection />
      </main>
      <PublicFooter />
    </div>
  )
}
