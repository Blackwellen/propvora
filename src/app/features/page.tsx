import type { Metadata } from "next"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import FeaturesHero from "@/components/marketing/features/FeaturesHero"
import OperatingProfilesSection from "@/components/marketing/features/OperatingProfilesSection"
import AiCopilotSection from "@/components/marketing/features/AiCopilotSection"
import ComplianceLegalSection from "@/components/marketing/features/ComplianceLegalSection"
import AccountingInvoicesSection from "@/components/marketing/features/AccountingInvoicesSection"
import WorkingWithTeamsSection from "@/components/marketing/features/WorkingWithTeamsSection"
import PortalsSection from "@/components/marketing/features/PortalsSection"
import WorkManagementSection from "@/components/marketing/features/WorkManagementSection"
import SchedulingSection from "@/components/marketing/features/SchedulingSection"
import SaveContactsSection from "@/components/marketing/features/SaveContactsSection"
import SupplierMarketplaceSection from "@/components/marketing/features/SupplierMarketplaceSection"

export const metadata: Metadata = {
  title: "Features | Propvora Property Operations Platform",
  description:
    "Propvora features — portfolio management, work orders, compliance tracking, financials and more.",
  openGraph: {
    title: "Features | Propvora Property Operations Platform",
    description:
      "Propvora features — portfolio management, work orders, compliance tracking, financials and more.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Features | Propvora Property Operations Platform",
    description:
      "Propvora features — portfolio management, work orders, compliance tracking, financials and more.",
  },
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <FeaturesHero />
        <OperatingProfilesSection />
        <AiCopilotSection />
        <ComplianceLegalSection />
        <AccountingInvoicesSection />
        <WorkingWithTeamsSection />
        <PortalsSection />
        <WorkManagementSection />
        <SchedulingSection />
        <SaveContactsSection />
        <SupplierMarketplaceSection />
      </main>
      <PublicFooter />
    </div>
  )
}
