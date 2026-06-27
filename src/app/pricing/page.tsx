import type { Metadata } from "next"
import PricingClient from "./PricingClient"
import { LocaleProvider } from "@/components/i18n/LocaleProvider"
import { getServerLocale } from "@/lib/i18n"
import JsonLd, { breadcrumbList, faqPage } from "@/components/seo/JsonLd"
import { pricingFaqs } from "@/components/marketing/pricing/faq-data"
import { getPublicPricingAddons } from "@/lib/billing/plans"
import { isFeatureEnabled } from "@/lib/flags"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Pricing | Propvora — Simple Transparent Plans",
  description: "Propvora pricing plans. Start free, scale as you grow.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing | Propvora — Simple Transparent Plans",
    description: "Propvora pricing plans. Start free, scale as you grow.",
    type: "website",
    url: "/pricing",
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

  // Resolve the roadmap-addon flags so V1.5/V2 add-ons only appear on the public
  // pricing grid once the surface they extend is actually enabled. Default OFF
  // (V1) => only V1 add-ons render. QA_ALL_FLAGS makes them all resolve true.
  const supabase = await createClient()
  const [directBookingPages, canvasLite] = await Promise.all([
    isFeatureEnabled("directBookingPages", { supabase }),
    isFeatureEnabled("canvasLite", { supabase }),
  ])
  const addons = getPublicPricingAddons({ directBookingPages, canvasLite })

  return (
    <LocaleProvider locale={locale}>
      <JsonLd
        data={[
          breadcrumbList([
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]),
          faqPage(pricingFaqs),
        ]}
      />
      <PricingClient addons={addons} />
    </LocaleProvider>
  )
}
