import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getPublicProviderBySlug } from "@/lib/public-marketplace/queries"
import MarketplaceCheckout, {
  type MarketplaceCheckoutConfig,
} from "@/components/checkout/MarketplaceCheckout"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const provider = await getPublicProviderBySlug(slug)
  return { title: provider ? `Book ${provider.companyName} · Propvora` : "Book supplier · Propvora" }
}

export default async function SupplierBookPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const provider = await getPublicProviderBySlug(slug)
  if (!provider) notFound()

  // POA suppliers still book — call-out is confirmed, final quote agreed on site.
  const callOut = provider.fromPrice > 0 ? provider.fromPrice : 6000

  const config: MarketplaceCheckoutConfig = {
    kind: "supplier",
    title: `Book ${provider.companyName}`,
    heading: provider.companyName,
    subheading: `${provider.trade} · ${provider.location}`,
    thumbUrl: provider.heroImage,
    metaRows: [
      { label: "Trade", value: provider.trade },
      { label: "Response time", value: provider.responseTime },
      { label: "Insured up to", value: provider.insuranceAmount },
    ],
    lineItems: [{ label: "Call-out & first hour", pence: callOut }],
    vatRateBps: 2000,
    currency: "GBP",
    backHref: `/property-manager/marketplace/suppliers-hub/${slug}`,
    backLabel: "Back to supplier",
    messageHref: `/property-manager/messages?contact=${slug}`,
    embedded: true,
    successHref: "/property-manager/work/jobs",
    successHrefLabel: "View in Work",
  }

  return <MarketplaceCheckout config={config} />
}
