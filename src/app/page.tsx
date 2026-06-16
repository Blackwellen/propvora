import type { Metadata } from "next"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import HeroSection from "@/components/marketing/landing/HeroSection"
import SocialProofBar from "@/components/marketing/landing/SocialProofBar"
import FeaturesGrid from "@/components/marketing/landing/FeaturesGrid"
import OperatingModesSection from "@/components/marketing/landing/OperatingModesSection"
import BuiltForSection from "@/components/marketing/landing/BuiltForSection"
import ToolsSection from "@/components/marketing/landing/ToolsSection"
import MarketplaceTeaser from "@/components/marketing/landing/MarketplaceTeaser"
import WhyTeamsSection from "@/components/marketing/landing/WhyTeamsSection"
import PricingTeaser from "@/components/marketing/landing/PricingTeaser"
import TestimonialsSection from "@/components/marketing/landing/TestimonialsSection"
import CtaSection from "@/components/marketing/landing/CtaSection"

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
        <SocialProofBar />
        <FeaturesGrid />
        <OperatingModesSection />
        <BuiltForSection />
        <ToolsSection />
        <MarketplaceTeaser />
        <WhyTeamsSection />
        <PricingTeaser />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <PublicFooter />
    </div>
  )
}
