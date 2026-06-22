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
    included: [
      "Call-out & diagnosis",
      "First hour of labour",
      ...(provider.certifications ?? []).slice(0, 2).map((c) => `${c} certified`),
      ...(provider.services ?? []).slice(0, 2),
    ].filter(Boolean),
    trustChips: [
      ...(provider.vetted ? ["Vetted"] : []),
      ...(provider.insured ? [`Insured ${provider.insuranceAmount}`] : []),
      ...(provider.gasSafe ? ["Gas Safe"] : []),
      `${provider.rating.toFixed(1)}★ (${provider.reviewCount})`,
    ],
    policyNotes: [
      "The call-out covers diagnosis and the first hour — further work is quoted on site before it starts.",
      "No charge if you cancel before the supplier is dispatched.",
      `${provider.companyName} is insured up to ${provider.insuranceAmount}.`,
    ],
    whatNext: [
      "Confirm the call-out and pay securely.",
      `${provider.companyName} is notified and responds within ${provider.responseTime}.`,
      "They diagnose on site, agree any further work, then complete the job.",
    ],
    backHref: `/property-manager/marketplace/suppliers-hub/${slug}`,
    backLabel: "Back to supplier",
    messageHref: `/property-manager/messages?contact=${slug}`,
    embedded: true,
    successHref: "/property-manager/work/jobs",
    successHrefLabel: "View in Work",
  }

  return <MarketplaceCheckout config={config} />
}
