import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getPublicStayBySlug } from "@/lib/public-marketplace/queries"
import StayCheckoutFlow from "@/components/checkout/StayCheckoutFlow"

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

  const checkInIso = checkIn || ""
  const checkOutIso = checkOut || ""

  return (
    <StayCheckoutFlow
      listingId={stay.id}
      heading={stay.title}
      subheading={stay.location}
      thumbUrl={stay.heroImage}
      checkIn={checkInIso}
      checkOut={checkOutIso}
      guests={guestCount}
      nights={nights}
      lineItems={[
        { label: `${(stay.pricePerNight / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP" })} × ${nights} night${nights !== 1 ? "s" : ""}`, pence: subtotal },
        { label: "Cleaning fee", pence: stay.cleaningFee },
        { label: "Service fee", pence: stay.serviceFee },
      ]}
      currency="GBP"
      included={[
        `Self check-in${stay.instantBook ? " · instant confirmation" : ""}`,
        ...(stay.amenities ?? []).slice(0, 4),
        `Hosted by ${stay.hostName}${stay.hostProBadge ? " (Pro host)" : ""}`,
      ].filter(Boolean)}
      trustChips={[
        ...(stay.verified ? ["Verified stay"] : []),
        ...(stay.freeCancellation ? ["Free cancellation"] : []),
        `${stay.rating.toFixed(1)}★ (${stay.reviewCount})`,
      ]}
      backHref={`/stays/${slug}`}
      backLabel="Back to stay"
      successHref="/customer/bookings"
      successHrefLabel="View my bookings"
    />
  )
}
