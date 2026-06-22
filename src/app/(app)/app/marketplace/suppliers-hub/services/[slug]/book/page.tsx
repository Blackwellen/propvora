import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getPublicServiceOfferBySlug } from "@/lib/public-marketplace/queries"
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
  const offer = await getPublicServiceOfferBySlug(slug)
  return { title: offer ? `Book ${offer.title} · Propvora` : "Book service · Propvora" }
}

const TIER_INDEX: Record<string, number> = { basic: 0, standard: 1, premium: 2 }

export default async function ServiceBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ package?: string }>
}) {
  const { slug } = await params
  const { package: pkgParam } = await searchParams
  const offer = await getPublicServiceOfferBySlug(slug)
  if (!offer) notFound()

  const packages =
    offer.packages && offer.packages.length >= 2
      ? offer.packages
      : [
          { name: "Basic", price: offer.basePrice, description: "", includes: [] },
          { name: "Standard", price: offer.standardPrice, description: "", includes: [] },
          { name: "Premium", price: offer.premiumPrice, description: "", includes: [] },
        ]

  const idx = TIER_INDEX[(pkgParam ?? "standard").toLowerCase()] ?? 1
  const pkg = packages[Math.min(idx, packages.length - 1)]

  const config: MarketplaceCheckoutConfig = {
    kind: "service",
    title: "Book this service",
    heading: offer.title,
    subheading: `${offer.providerName} · ${offer.location}`,
    thumbUrl: offer.heroImage,
    metaRows: [
      { label: "Package", value: pkg.name },
      { label: "Duration", value: offer.duration },
      { label: "Next available", value: offer.nextAvailable },
    ],
    lineItems: [{ label: `${pkg.name} package`, pence: pkg.price }],
    extras: (offer.addons ?? []).map((a) => ({
      id: a.name,
      label: a.name,
      pence: a.price,
      description: a.description,
    })),
    vatRateBps: 2000,
    currency: "GBP",
    backHref: `/property-manager/marketplace/suppliers-hub/services/${slug}`,
    backLabel: "Back to service",
    messageHref: `/property-manager/messages?service=${slug}`,
    embedded: true,
    successHref: "/property-manager/work/jobs",
    successHrefLabel: "View in Work",
  }

  return <MarketplaceCheckout config={config} />
}
