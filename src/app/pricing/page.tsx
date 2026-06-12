import type { Metadata } from "next"
import PricingClient from "./PricingClient"

export const metadata: Metadata = {
  title: "Pricing | Propvora — Simple Transparent Plans",
  description: "Propvora pricing plans. Start free, scale as you grow.",
  openGraph: {
    title: "Pricing | Propvora — Simple Transparent Plans",
    description: "Propvora pricing plans. Start free, scale as you grow.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing | Propvora — Simple Transparent Plans",
    description: "Propvora pricing plans. Start free, scale as you grow.",
  },
}

export default function PricingPage() {
  return <PricingClient />
}
