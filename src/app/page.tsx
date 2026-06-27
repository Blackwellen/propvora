import type { Metadata } from "next"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import LandingPremium from "@/components/marketing/LandingPremium"

export const metadata: Metadata = {
  title: "Propvora | UK Property Operations & Compliance Platform",
  description: "The UK property platform that tracks every compliance deadline and plans your portfolio — not just stores it. Portfolio, work, money, people and a live compliance engine in one workspace.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Propvora | UK Property Operations & Compliance Platform",
    description: "Track every UK compliance deadline, plan your portfolio, and run work, money and people from one connected workspace.",
    type: "website",
    url: "/",
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
