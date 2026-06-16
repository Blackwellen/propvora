import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  MapPin,
  Users,
  BedDouble,
  Bath,
  ShieldCheck,
  Info,
  Clock,
  LogOut,
  CheckCircle2,
  Home,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getPublicListingDetail, getPublicListingReviews, getSimilarPublicListings } from "@/lib/booking"
import ListingGallery from "@/components/booking/ListingGallery"
import StayBookingCard from "@/components/booking/StayBookingCard"
import AccommodationDetails from "@/components/booking/AccommodationDetails"
import EnquiryCard from "@/components/booking/EnquiryCard"
import StayReviews from "@/components/booking/StayReviews"
import StayLocationMap from "@/components/booking/StayLocationMap"
import SimilarStays from "@/components/booking/SimilarStays"
import { STAY_TYPE_LABEL, STAY_POLICY_LABEL } from "@/components/booking/StayListingCard"

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

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 pb-28 lg:pb-8">
      {/* Title */}
      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-blue-700">
            {listing.accommodationLabel ?? STAY_TYPE_LABEL[listing.listingType] ?? "Stay"}
          </span>
          {listing.complianceStatus === "passed" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-emerald-700">
              <ShieldCheck className="w-3 h-3" /> Licence verified
            </span>
          )}
          {listing.bookingMode === "instant" && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-amber-700">
              Instant book
            </span>
          )}
        </div>
        <h1 className="text-[22px] sm:text-[28px] font-bold tracking-tight text-[#0B1B3F]">{listing.title}</h1>
        {place && (
          <p className="mt-1 flex items-center gap-1.5 text-[13.5px] text-slate-500">
            <MapPin className="w-4 h-4 text-slate-400" /> {place}
          </p>
        )}
      </div>

      <ListingGallery images={galleryImages} title={listing.title} />

      <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left */}
        <div className="lg:col-span-7 space-y-7">
          {/* Facts */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px] text-slate-600 border-y border-[#EEF3FB] py-4">
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" /> Sleeps {listing.maxGuests}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BedDouble className="w-4 h-4 text-slate-400" /> {listing.bedrooms} bed
              {listing.bedrooms === 1 ? "" : "s"} · {listing.beds} bed{listing.beds === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-slate-400" /> {listing.bathrooms} bath
              {listing.bathrooms === 1 ? "" : "s"}
            </span>
          </div>

          {/* Host */}
          {listing.hostName && (
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#1D4ED8]/10 flex items-center justify-center text-[#1D4ED8] font-bold text-[15px]">
                {listing.hostName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#0B1B3F]">Managed by {listing.hostName}</p>
                <p className="text-[12px] text-slate-500">Professional property manager on Propvora</p>
              </div>
            </div>
          )}

          {/* Description */}
          <section>
            <h2 className="text-[16px] font-semibold text-[#0B1B3F] mb-2.5">About this stay</h2>
            {listing.description || listing.summary ? (
              <p className="text-[14px] leading-relaxed text-slate-600 whitespace-pre-line">
                {listing.description ?? listing.summary}
              </p>
            ) : (
              <p className="text-[14px] leading-relaxed text-slate-500">
                The host hasn&apos;t added a full description yet. Choose your dates to see live pricing and
                reserve your stay.
              </p>
            )}
          </section>

          {/* Type-aware accommodation sections (long-let / shared / HMO / student) */}
          {listing.applyFlow && (
            <AccommodationDetails
              details={listing.typeDetails}
              sections={listing.sections}
              currency={listing.currency}
            />
          )}

          {/* Amenities */}
          {Object.keys(amenityGroups).length > 0 && (
            <section>
              <h2 className="text-[16px] font-semibold text-[#0B1B3F] mb-3">What this place offers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                {Object.entries(amenityGroups).map(([group, items]) => (
                  <div key={group}>
                    <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                      {group}
                    </p>
                    <ul className="space-y-1.5">
                      {items.map((it, i) => (
                        <li key={i} className="flex items-center gap-2 text-[13.5px] text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Check-in / out */}
          {(listing.checkInWindow || listing.checkoutTime) && (
            <section className="grid grid-cols-2 gap-4">
              {listing.checkInWindow && (
                <div className="rounded-xl border border-[#EEF3FB] px-4 py-3">
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    <Clock className="w-3.5 h-3.5" /> Check-in
                  </p>
                  <p className="text-[14px] font-semibold text-[#0B1B3F]">{listing.checkInWindow}</p>
                </div>
              )}
              {listing.checkoutTime && (
                <div className="rounded-xl border border-[#EEF3FB] px-4 py-3">
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    <LogOut className="w-3.5 h-3.5" /> Check-out
                  </p>
                  <p className="text-[14px] font-semibold text-[#0B1B3F]">{listing.checkoutTime}</p>
                </div>
              )}
            </section>
          )}

          {/* House rules */}
          {rules.length > 0 && (
            <section>
              <h2 className="text-[16px] font-semibold text-[#0B1B3F] mb-3">House rules</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {rules.map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 text-[13.5px] border-b border-[#F1F5FB] py-1.5">
                    <span className="text-slate-500">{r.label}</span>
                    <span className="font-medium text-[#0B1B3F]">{r.value}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Cancellation (nightly short-stays only) */}
          {isShortStay && (
            <section className="rounded-xl border border-[#EEF3FB] px-4 py-3.5">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0B1B3F] mb-1">
                <Home className="w-4 h-4 text-[#1D4ED8]" /> {STAY_POLICY_LABEL[listing.cancellationPolicy] ?? "Cancellation"}
              </p>
              <p className="text-[12.5px] text-slate-500 leading-relaxed">
                The exact refund schedule is shown at checkout before you confirm and pay.
              </p>
            </section>
          )}

          {/* Location (approximate area only) */}
          <StayLocationMap
            title={listing.title}
            place={place}
            latitude={listing.latitude}
            longitude={listing.longitude}
          />

          {/* Reviews (real booking_reviews; renders nothing when none) */}
          <StayReviews reviews={reviews} averageRating={listing.rating} reviewCount={listing.reviewCount} />

          {/* Things to know */}
          <section>
            <h2 className="text-[16px] font-semibold text-[#0B1B3F] mb-3">Things to know</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-[#EEF3FB] px-4 py-3.5">
                <p className="text-[12.5px] font-semibold text-[#0B1B3F] mb-1">House rules</p>
                <ul className="space-y-1 text-[12.5px] text-slate-500">
                  {listing.checkInWindow && <li>Check-in: {listing.checkInWindow}</li>}
                  {listing.checkoutTime && <li>Check-out: {listing.checkoutTime}</li>}
                  {rules.slice(0, 3).map((r, i) => (
                    <li key={i}>
                      {r.label}: {r.value}
                    </li>
                  ))}
                  {!listing.checkInWindow && !listing.checkoutTime && rules.length === 0 && (
                    <li>Shared with you before check-in.</li>
                  )}
                </ul>
              </div>
              <div className="rounded-xl border border-[#EEF3FB] px-4 py-3.5">
                <p className="text-[12.5px] font-semibold text-[#0B1B3F] mb-1">Cancellation</p>
                <p className="text-[12.5px] text-slate-500 leading-relaxed">
                  {STAY_POLICY_LABEL[listing.cancellationPolicy] ?? "Direct booking policy"}. The exact refund
                  schedule is shown at checkout before you pay.
                </p>
              </div>
              <div className="rounded-xl border border-[#EEF3FB] px-4 py-3.5">
                <p className="text-[12.5px] font-semibold text-[#0B1B3F] mb-1">Safety &amp; compliance</p>
                <p className="text-[12.5px] text-slate-500 leading-relaxed">
                  {listing.complianceStatus === "passed"
                    ? "Licence verified by Propvora. Payment is held securely until check-in."
                    : "Payment is held securely until check-in. Ask the host about local licensing."}
                </p>
              </div>
            </div>
          </section>

          {/* Compliance note */}
          <div className="rounded-xl bg-[#F7F9FC] border border-[#EEF3FB] px-4 py-3.5 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[12px] leading-relaxed text-slate-500">
              This stay is offered directly by the property manager. Local taxes, registration or short-let
              rules may apply. Propvora provides the booking software and is not legal or tax advice.
            </p>
          </div>
        </div>

        {/* Right: nightly checkout (short-stay) or apply/enquire (long/shared) */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-20">
            {isShortStay ? (
              <StayBookingCard
                listingId={listing.id}
                slug={listing.slug ?? listing.id}
                title={listing.title}
                currency={listing.currency}
                maxGuests={listing.maxGuests}
                fromNightlyPence={listing.fromNightlyPence}
                cancellationPolicy={listing.cancellationPolicy}
                securityDepositPence={listing.securityDepositPence}
                minNights={listing.minNights}
              />
            ) : (
              <EnquiryCard
                listingId={listing.id}
                title={listing.title}
                currency={listing.currency}
                fromPence={listing.fromNightlyPence}
                pricePeriodLabel={periodLabel}
                availableFrom={listing.typeDetails.availableFrom}
                ctaLabel={
                  listing.accommodationCategory === "long_term_let" ||
                  listing.accommodationCategory === "mid_term_let"
                    ? "Apply for this let"
                    : "Enquire about this room"
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Similar published stays (same city / type preferred) */}
      <SimilarStays listings={similar} />
    </div>
  )
}
