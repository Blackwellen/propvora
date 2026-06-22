import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getPublicStayBySlug } from "@/lib/public-marketplace/queries"
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
  const stay = await getPublicStayBySlug(slug)
  return { title: stay ? `Checkout · ${stay.title} · Propvora` : "Checkout · Propvora" }
}

function nightsBetween(checkIn?: string, checkOut?: string): number {
  if (!checkIn || !checkOut) return 0
  const ci = new Date(checkIn + "T00:00:00")
  const co = new Date(checkOut + "T00:00:00")
  const diff = Math.round((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

function fmtDate(d?: string): string {
  if (!d) return "—"
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return d
  }
}

export default async function StayCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>
}) {
  const { slug } = await params
  const { checkIn, checkOut, guests } = await searchParams
  const stay = await getPublicStayBySlug(slug)
  if (!stay) notFound()

  const nights = nightsBetween(checkIn, checkOut) || 1
  const guestCount = Math.max(1, Number(guests) || 1)
  const subtotal = stay.pricePerNight * nights

  const config: MarketplaceCheckoutConfig = {
    kind: "stay",
    title: "Complete your booking",
    heading: stay.title,
    subheading: stay.location,
    thumbUrl: stay.heroImage,
    metaRows: [
      { label: "Check-in", value: fmtDate(checkIn) },
      { label: "Check-out", value: fmtDate(checkOut) },
      { label: "Guests", value: `${guestCount} ${guestCount === 1 ? "guest" : "guests"}` },
    ],
    lineItems: [
      { label: `${(stay.pricePerNight / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP" })} × ${nights} night${nights !== 1 ? "s" : ""}`, pence: subtotal },
      { label: "Cleaning fee", pence: stay.cleaningFee },
      { label: "Service fee", pence: stay.serviceFee },
    ],
    depositPence: undefined,
    currency: "GBP",
    included: [
      `Self check-in${stay.instantBook ? " · instant confirmation" : ""}`,
      ...(stay.amenities ?? []).slice(0, 4),
      `Hosted by ${stay.hostName}${stay.hostProBadge ? " (Pro host)" : ""}`,
    ].filter(Boolean),
    trustChips: [
      ...(stay.verified ? ["Verified stay"] : []),
      ...(stay.freeCancellation ? ["Free cancellation"] : []),
      `${stay.rating.toFixed(1)}★ (${stay.reviewCount})`,
    ],
    policyNotes: [
      stay.freeCancellation
        ? "Free cancellation up to 48 hours before check-in."
        : "Cancellation terms follow the host's policy.",
      "You won't be charged until your booking is confirmed.",
      "Your payment is protected by Propvora secure checkout.",
    ],
    whatNext: [
      "Confirm and pay securely — your card is charged once.",
      "The host receives your booking and confirms instantly.",
      "Check-in details and the host's contact are sent to your email.",
    ],
    backHref: `/stays/${slug}`,
    backLabel: "Back to stay",
    successHref: "/customer/bookings",
    successHrefLabel: "View my bookings",
  }

  return <MarketplaceCheckout config={config} />
}
