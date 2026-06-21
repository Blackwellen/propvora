import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getPublicListingDetail, getPublicListingReviews, getSimilarPublicListings } from "@/lib/booking"
import ListingGallery from "@/components/booking/ListingGallery"
import AccommodationDetails from "@/components/booking/AccommodationDetails"
import StayReviews from "@/components/booking/StayReviews"
import StayLocationMap from "@/components/booking/StayLocationMap"
import SimilarStays from "@/components/booking/SimilarStays"
import MobileBookingBar from "@/components/booking/MobileBookingBar"
import StayTitleRow from "@/features/marketplace/components/detail/StayTitleRow"
import StayPropertyTypeBar from "@/features/marketplace/components/detail/StayPropertyTypeBar"
import StayHighlights from "@/features/marketplace/components/detail/StayHighlights"
import StayDescription from "@/features/marketplace/components/detail/StayDescription"
import SleepingArrangements from "@/features/marketplace/components/detail/SleepingArrangements"
import StayAmenitiesPreview from "@/features/marketplace/components/detail/StayAmenitiesPreview"
import StayCheckInOut from "@/features/marketplace/components/detail/StayCheckInOut"
import StayHouseRules from "@/features/marketplace/components/detail/StayHouseRules"
import StayCancellationPolicy from "@/features/marketplace/components/detail/StayCancellationPolicy"
import StayHostSection from "@/features/marketplace/components/detail/StayHostSection"
import StayThingsToKnow from "@/features/marketplace/components/detail/StayThingsToKnow"
import StayComplianceNote from "@/features/marketplace/components/detail/StayComplianceNote"
import StayGuestSignupNudge from "@/features/marketplace/components/detail/StayGuestSignupNudge"
import StayBookingSidebar from "@/features/marketplace/components/detail/StayBookingSidebar"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const listing = await getPublicListingDetail(supabase, slug)
  if (!listing) return { title: "Stay not found · Propvora" }
  return {
    title: `${listing.title} · Book direct · Propvora`,
    description: listing.summary ?? listing.description?.slice(0, 155) ?? "Reserve this stay directly with the host.",
  }
}

function ruleEntries(houseRules: Record<string, unknown>): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = []
  for (const [k, v] of Object.entries(houseRules || {})) {
    if (v == null || v === "") continue
    const label = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    const value = typeof v === "boolean" ? (v ? "Allowed" : "Not allowed") : String(v)
    out.push({ label, value })
  }
  return out
}

export default async function StayListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const listing = await getPublicListingDetail(supabase, slug)
  if (!listing) notFound()

  const [reviews, similar] = await Promise.all([
    getPublicListingReviews(supabase, listing.id),
    getSimilarPublicListings(supabase, listing, 4),
  ])

  const place = [listing.city, listing.country].filter(Boolean).join(", ")
  const galleryImages = listing.photos.map((p) => p.url).filter((u): u is string => !!u)
  const rules = ruleEntries(listing.houseRules)
  const isShortStay = !listing.applyFlow
  const periodLabel = listing.accommodationCategory === "student_room" ? "week" : "month"
  const amenityGroups = listing.amenities.reduce<Record<string, string[]>>((acc, a) => {
    const g = a.group ?? "Amenities"
    ;(acc[g] ??= []).push(a.value ?? a.key.replace(/_/g, " "))
    return acc
  }, {})
  const totalAmenities = listing.amenities.length

  const bedroomCount = listing.bedrooms ?? 0
  const bedCount = listing.beds ?? 0
  const bedsPerRoom = bedroomCount > 0 ? Math.floor(bedCount / bedroomCount) : 0
  const extraBeds = bedroomCount > 0 ? bedCount - bedsPerRoom * bedroomCount : bedCount

  const hasWifi = listing.amenities.some((a) => /wifi|wi-fi|internet/i.test(a.key + " " + (a.value ?? "")))
  const hasSelfCheckin = listing.amenities.some((a) => /keyless|self.?check|lockbox|key.?safe/i.test(a.key + " " + (a.value ?? "")))

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 pb-28 lg:pb-8">
      <MobileBookingBar
        fromNightlyPence={isShortStay ? listing.fromNightlyPence : null}
        currency={listing.currency}
        rating={listing.rating}
        reviewCount={listing.reviewCount}
      />

      <StayTitleRow
        title={listing.title}
        rating={listing.rating}
        reviewCount={listing.reviewCount}
        complianceStatus={listing.complianceStatus}
        place={place}
      />

      <ListingGallery images={galleryImages} title={listing.title} />

      {/* Body: 7 + 5 two-column layout */}
      <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left column */}
        <div className="lg:col-span-7 space-y-0">

          <StayPropertyTypeBar
            accommodationLabel={listing.accommodationLabel}
            listingType={listing.listingType}
            city={listing.city}
            maxGuests={listing.maxGuests}
            bedrooms={listing.bedrooms}
            beds={listing.beds}
            bathrooms={listing.bathrooms}
            bookingMode={listing.bookingMode}
            complianceStatus={listing.complianceStatus}
            hostName={listing.hostName}
          />

          <StayHighlights
            hostName={listing.hostName}
            hasSelfCheckin={hasSelfCheckin}
            hasWifi={hasWifi}
            bookingMode={listing.bookingMode}
          />

          <StayDescription description={listing.description} summary={listing.summary} />

          <SleepingArrangements
            bedroomCount={bedroomCount}
            bedsPerRoom={bedsPerRoom}
            extraBeds={extraBeds}
            bathrooms={listing.bathrooms}
          />

          {/* Type-aware accommodation sections (long-let / shared / HMO / student) */}
          {listing.applyFlow && (
            <div className="py-7 border-b border-slate-200">
              <AccommodationDetails
                details={listing.typeDetails}
                sections={listing.sections}
                currency={listing.currency}
              />
            </div>
          )}

          <StayAmenitiesPreview
            amenities={listing.amenities}
            amenityGroups={amenityGroups}
            totalAmenities={totalAmenities}
          />

          <StayCheckInOut
            checkInWindow={listing.checkInWindow}
            checkoutTime={listing.checkoutTime}
          />

          <StayHouseRules rules={rules} />

          <StayCancellationPolicy
            cancellationPolicy={listing.cancellationPolicy}
            isShortStay={isShortStay}
          />

          {/* Location */}
          <div className="py-7 border-b border-slate-200">
            <h2 className="text-[19px] font-bold text-[#0B1B3F] mb-4">Where you&apos;ll be</h2>
            <StayLocationMap
              title={listing.title}
              place={place}
              latitude={listing.latitude}
              longitude={listing.longitude}
            />
          </div>

          {/* Reviews */}
          <div className="py-7 border-b border-slate-200">
            <StayReviews reviews={reviews} averageRating={listing.rating} reviewCount={listing.reviewCount} />
          </div>

          <StayHostSection hostName={listing.hostName} />

          <StayThingsToKnow
            checkInWindow={listing.checkInWindow}
            checkoutTime={listing.checkoutTime}
            rules={rules}
            cancellationPolicy={listing.cancellationPolicy}
            complianceStatus={listing.complianceStatus}
          />

          <StayComplianceNote />
        </div>

        {/* Right column: booking card */}
        <StayBookingSidebar
          listing={listing}
          isShortStay={isShortStay}
          periodLabel={periodLabel}
        />
      </div>

      <StayGuestSignupNudge />

      <SimilarStays listings={similar} />
    </div>
  )
}
