import type { Metadata } from "next"
import PricingClient from "./PricingClient"
import { LocaleProvider } from "@/components/i18n/LocaleProvider"
import { getServerLocale } from "@/lib/i18n"

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

export default async function PricingPage() {
  const locale = await getServerLocale()
  return (
    <LocaleProvider locale={locale}>
      <PricingClient />
    </LocaleProvider>
  )
}
