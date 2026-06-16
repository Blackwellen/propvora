import type { Metadata } from "next"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import SupplierHero from "@/components/marketing/suppliers/SupplierHero"
import HowItWorksSupplier from "@/components/marketing/suppliers/HowItWorksSupplier"
import SupplierBenefits from "@/components/marketing/suppliers/SupplierBenefits"
import SupplierCategories from "@/components/marketing/suppliers/SupplierCategories"
import SupplierTrustSignals from "@/components/marketing/suppliers/SupplierTrustSignals"
import SupplierSignupCTA from "@/components/marketing/suppliers/SupplierSignupCTA"

export const metadata: Metadata = {
  title: "For Suppliers | Grow your property maintenance business with Propvora",
  description:
    "Join Propvora as a supplier. List your services, get matched to local property maintenance jobs, quote and get paid. Free to join, get verified.",
  openGraph: {
    title: "For Suppliers | Grow your property maintenance business with Propvora",
    description:
      "Join Propvora as a supplier. List your services, get matched to local property maintenance jobs, quote and get paid. Free to join, get verified.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "For Suppliers | Grow your property maintenance business with Propvora",
    description:
      "Join Propvora as a supplier. List your services, get matched to local property maintenance jobs, quote and get paid. Free to join, get verified.",
  },
}

export default function SuppliersPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <SupplierHero />
        <HowItWorksSupplier />
        <SupplierBenefits />
        <SupplierCategories />
        <SupplierTrustSignals />
        <SupplierSignupCTA />
      </main>
      <PublicFooter />
    </div>
  )
}
