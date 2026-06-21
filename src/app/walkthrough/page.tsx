import type { Metadata } from "next"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"
import WalkthroughHero from "@/components/marketing/walkthrough/WalkthroughHero"
import WalkthroughStepList from "@/components/marketing/walkthrough/WalkthroughStepList"
import WalkthroughCta from "@/components/marketing/walkthrough/WalkthroughCta"

export const metadata: Metadata = {
  title: "Product Walkthrough",
  description:
    "A step-by-step walkthrough of how Propvora runs your property operations — from setting up your portfolio to compliance, work, money and AI.",
  openGraph: {
    title: "Product Walkthrough | Propvora",
    description:
      "A step-by-step walkthrough of how Propvora runs your property operations.",
    type: "website",
  },
}

export default function WalkthroughPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <WalkthroughHero />
        <WalkthroughStepList />
        <WalkthroughCta />
      </main>

      <PublicFooter />
    </div>
  )
}
