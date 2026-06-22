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
    included: [
      ...(pkg.includes ?? []).slice(0, 5),
      ...(offer.deliverables ?? []).slice(0, 3),
    ].filter(Boolean),
    trustChips: [
      ...(offer.verified ? ["Verified"] : []),
      ...(offer.insured ? ["Fully insured"] : []),
      `${offer.rating.toFixed(1)}★ (${offer.reviewCount})`,
      `${offer.jobsDone}+ jobs done`,
    ],
    policyNotes: [
      "Fixed price agreed upfront — no surprise charges.",
      "Reschedule free of charge up to 24 hours before the visit.",
      "Work is covered by the provider's insurance and Propvora protection.",
    ],
    whatNext: [
      "Confirm and pay — funds are held securely until the job is done.",
      `${offer.providerName} confirms the appointment and arrives ${offer.responseTime ? `within ${offer.responseTime}` : "as scheduled"}.`,
      "Approve completion to release payment and leave a review.",
    ],
    backHref: `/property-manager/marketplace/suppliers-hub/services/${slug}`,
    backLabel: "Back to service",
    messageHref: `/property-manager/messages?service=${slug}`,
    embedded: true,
    successHref: "/property-manager/work/jobs",
    successHrefLabel: "View in Work",
  }

  return <MarketplaceCheckout config={config} />
}
