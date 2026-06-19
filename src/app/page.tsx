import type { Metadata } from "next"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import LandingPremium from "@/components/marketing/LandingPremium"

export const metadata: Metadata = {
  title: "Propvora | Property Operations Platform",
  description: "Connect portfolio management, tenancies, work, compliance, money, planning and communication in one property operations workspace.",
  openGraph: {
    title: "Propvora | Property Operations Platform",
    description: "One connected workspace for property operations.",
    type: "website",
    images: [{ url: "/images/marketing/product/enriched/01-home.png", width: 1536, height: 1024 }],
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <main id="main-content" tabIndex={-1} className="focus:outline-none"><LandingPremium /></main>
      <PublicFooter />
    </div>
  )
}
