import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getPublicEmergencyServiceBySlug } from "@/lib/public-marketplace/queries"
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
  const service = await getPublicEmergencyServiceBySlug(slug)
  return { title: service ? `Emergency call-out · ${service.title} · Propvora` : "Emergency call-out · Propvora" }
}

export default async function EmergencyBookPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const service = await getPublicEmergencyServiceBySlug(slug)
  if (!service) notFound()

  const config: MarketplaceCheckoutConfig = {
    kind: "emergency",
    title: "Request emergency call-out",
    heading: service.title,
    subheading: `${service.providerName} · ${service.location}`,
    thumbUrl: service.heroImage,
    metaRows: [
      { label: "Response time", value: `${service.responseTimeMin}–${service.responseTimeMax} min` },
      { label: "Availability", value: service.available24h ? "24/7" : "Daytime" },
      { label: "Coverage", value: service.coveragePostcodes.slice(0, 3).join(", ") },
    ],
    lineItems: [
      { label: service.noCalloutFee ? "Call-out (waived)" : "Emergency call-out", pence: service.baseCalloutPrice },
    ],
    vatRateBps: 2000,
    currency: "GBP",
    included: [
      "Immediate dispatch of the nearest available pro",
      "On-site diagnosis & make-safe",
      ...(service.priceItems ?? []).slice(0, 3).map((p) => p.service),
    ].filter(Boolean),
    trustChips: [
      ...(service.available24h ? ["24/7 available"] : []),
      ...(service.policeVetted ? ["Police vetted"] : []),
      ...(service.insured ? [`Insured ${service.insuranceAmount}`] : []),
      `${service.rating.toFixed(1)}★ (${service.reviewCount})`,
    ],
    policyNotes: [
      service.noCalloutFee
        ? "No call-out fee — you only pay for the work carried out."
        : "The call-out covers dispatch and make-safe; further work is quoted on site.",
      `Typical arrival ${service.responseTimeMin}–${service.responseTimeMax} minutes from dispatch.`,
      "For life-threatening emergencies, always call 999 first.",
    ],
    whatNext: [
      "Confirm and pay to dispatch — the nearest pro is alerted instantly.",
      `${service.leadTechnicianName ?? "A technician"} is en route within ${service.responseTimeMin}–${service.responseTimeMax} minutes.`,
      "They make the situation safe on site and agree any further work before starting.",
    ],
    backHref: `/property-manager/marketplace/suppliers-hub/emergency/${slug}`,
    backLabel: "Back to service",
    messageHref: `/property-manager/messages?contact=${service.providerSlug}`,
    embedded: true,
    successHref: "/property-manager/work/jobs",
    successHrefLabel: "View in Work",
  }

  return <MarketplaceCheckout config={config} />
}
