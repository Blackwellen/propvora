import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
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
  Star,
  Share2,
  Heart,
  Award,
  Wifi,
  KeyRound,
  Sparkles,
  CalendarCheck,
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
import AmenitiesModal from "@/components/booking/AmenitiesModal"
import MobileBookingBar from "@/components/booking/MobileBookingBar"
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

  const totalAmenities = listing.amenities.length
  // First 10 amenities flat list for preview (2-col grid)
  const amenityPreview = listing.amenities.slice(0, 10)

  // Sleeping arrangements: build one card per bedroom
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
      {/* ── Title row ── */}
      <div className="mb-4">
        <h1 className="text-[22px] sm:text-[28px] font-bold tracking-tight text-[#0B1B3F] leading-tight">{listing.title}</h1>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
          {/* Left: rating + place + badges */}
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-600">
            {listing.rating != null && listing.rating > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-[#0B1B3F]">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {listing.rating.toFixed(1)}
                {listing.reviewCount != null && listing.reviewCount > 0 && (
                  <span className="font-normal text-slate-500 underline underline-offset-2 cursor-pointer">
                    ({listing.reviewCount} review{listing.reviewCount === 1 ? "" : "s"})
                  </span>
                )}
                <span className="text-slate-300 mx-0.5">·</span>
              </span>
            )}
            {listing.complianceStatus === "passed" && (
              <>
                <span className="inline-flex items-center gap-1 font-semibold text-[#0B1B3F]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Licence verified
                </span>
                <span className="text-slate-300 mx-0.5">·</span>
              </>
            )}
            {place && (
              <span className="flex items-center gap-1 text-slate-500 underline underline-offset-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {place}
              </span>
            )}
          </div>
          {/* Right: share + save */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-semibold text-[#0B1B3F] hover:bg-slate-100 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-semibold text-[#0B1B3F] hover:bg-slate-100 transition-colors"
            >
              <Heart className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </div>
      </div>

      {/* ── Gallery ── */}
      <ListingGallery images={galleryImages} title={listing.title} />

      {/* ── Body: 7 + 5 two-column layout ── */}
      <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── Left column ── */}
        <div className="lg:col-span-7 space-y-0">

          {/* Property type + fact bar */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-7 border-b border-slate-200">
            <div className="flex-1 min-w-0">
              <h2 className="text-[19px] font-bold text-[#0B1B3F] leading-tight">
                {listing.accommodationLabel ?? STAY_TYPE_LABEL[listing.listingType] ?? "Stay"}
                {listing.city ? ` in ${listing.city}` : ""}
              </h2>
              <p className="mt-1 text-[14px] text-slate-500">
                {listing.maxGuests} guest{listing.maxGuests === 1 ? "" : "s"}
                {listing.bedrooms > 0 && ` · ${listing.bedrooms} bedroom${listing.bedrooms === 1 ? "" : "s"}`}
                {listing.beds > 0 && ` · ${listing.beds} bed${listing.beds === 1 ? "" : "s"}`}
                {listing.bathrooms > 0 && ` · ${listing.bathrooms} bath${listing.bathrooms === 1 ? "" : "s"}`}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {listing.bookingMode === "instant" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-amber-700">
                    <Sparkles className="w-3 h-3" /> Instant book
                  </span>
                )}
                {listing.complianceStatus === "passed" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-emerald-700">
                    <ShieldCheck className="w-3 h-3" /> Licence verified
                  </span>
                )}
              </div>
            </div>
            {/* Host avatar */}
            {listing.hostName && (
              <div className="shrink-0 flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2563EB]/20 to-[#1D4ED8]/30 flex items-center justify-center text-[#1D4ED8] font-bold text-[18px] ring-2 ring-white shadow-md">
                  {listing.hostName.slice(0, 1).toUpperCase()}
                </div>
              </div>
            )}
          </div>

          {/* Highlights */}
          <div className="py-7 border-b border-slate-200 space-y-4">
            {listing.hostName && (
              <div className="flex items-start gap-4">
                <Award className="w-8 h-8 text-[#0B1B3F] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[15px] font-semibold text-[#0B1B3F]">Managed by {listing.hostName}</p>
                  <p className="text-[13px] text-slate-500">Professional property manager verified on Propvora</p>
                </div>
              </div>
            )}
            {hasSelfCheckin && (
              <div className="flex items-start gap-4">
                <KeyRound className="w-8 h-8 text-[#0B1B3F] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[15px] font-semibold text-[#0B1B3F]">Self check-in</p>
                  <p className="text-[13px] text-slate-500">Check yourself in with the keybox or lockbox.</p>
                </div>
              </div>
            )}
            {hasWifi && (
              <div className="flex items-start gap-4">
                <Wifi className="w-8 h-8 text-[#0B1B3F] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[15px] font-semibold text-[#0B1B3F]">Fast Wi-Fi</p>
                  <p className="text-[13px] text-slate-500">Wifi is included — great for remote work.</p>
                </div>
              </div>
            )}
            {listing.bookingMode === "instant" && (
              <div className="flex items-start gap-4">
                <CalendarCheck className="w-8 h-8 text-[#0B1B3F] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[15px] font-semibold text-[#0B1B3F]">Instant confirmation</p>
                  <p className="text-[13px] text-slate-500">Your booking is confirmed the moment you complete payment.</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <section className="py-7 border-b border-slate-200">
            {listing.description || listing.summary ? (
              <p className="text-[14.5px] leading-relaxed text-slate-700 whitespace-pre-line">
                {listing.description ?? listing.summary}
              </p>
            ) : (
              <p className="text-[14.5px] leading-relaxed text-slate-500">
                The host hasn&apos;t added a full description yet. Choose your dates to see live pricing and
                reserve your stay.
              </p>
            )}
          </section>

          {/* Sleeping arrangements */}
          {bedroomCount > 0 && (
            <section className="py-7 border-b border-slate-200">
              <h2 className="text-[19px] font-bold text-[#0B1B3F] mb-4">Sleeping arrangements</h2>
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                {Array.from({ length: bedroomCount }, (_, i) => {
                  const isLast = i === bedroomCount - 1
                  const beds = bedsPerRoom + (isLast ? extraBeds : 0)
                  return (
                    <div
                      key={i}
                      className="shrink-0 w-44 rounded-2xl border border-slate-200 p-4"
                    >
                      <BedDouble className="w-6 h-6 text-slate-400 mb-2" />
                      <p className="text-[13px] font-semibold text-[#0B1B3F]">Bedroom {i + 1}</p>
                      <p className="text-[12px] text-slate-500 mt-0.5">
                        {beds} {beds === 1 ? "bed" : "beds"}
                      </p>
                    </div>
                  )
                })}
                {listing.bathrooms > 0 && (
                  <div className="shrink-0 w-44 rounded-2xl border border-slate-200 p-4">
                    <Bath className="w-6 h-6 text-slate-400 mb-2" />
                    <p className="text-[13px] font-semibold text-[#0B1B3F]">{listing.bathrooms === 1 ? "Bathroom" : `${listing.bathrooms} Bathrooms`}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5">Private bathroom{listing.bathrooms === 1 ? "" : "s"}</p>
                  </div>
                )}
              </div>
            </section>
          )}

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

          {/* Amenities preview → show all modal */}
          {totalAmenities > 0 && (
            <section className="py-7 border-b border-slate-200">
              <h2 className="text-[19px] font-bold text-[#0B1B3F] mb-4">What this place offers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {amenityPreview.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 text-[14px] text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" />
                    <span>{a.value ?? a.key.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
              <AmenitiesModal amenityGroups={amenityGroups} totalCount={totalAmenities} />
            </section>
          )}

          {/* Check-in / out */}
          {(listing.checkInWindow || listing.checkoutTime) && (
            <section className="py-7 border-b border-slate-200">
              <h2 className="text-[19px] font-bold text-[#0B1B3F] mb-4">Check-in &amp; check-out</h2>
              <div className="grid grid-cols-2 gap-4">
                {listing.checkInWindow && (
                  <div className="rounded-2xl border border-slate-200 px-5 py-4">
                    <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                      <Clock className="w-3.5 h-3.5" /> Check-in
                    </p>
                    <p className="text-[18px] font-bold text-[#0B1B3F]">{listing.checkInWindow}</p>
                  </div>
                )}
                {listing.checkoutTime && (
                  <div className="rounded-2xl border border-slate-200 px-5 py-4">
                    <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                      <LogOut className="w-3.5 h-3.5" /> Check-out
                    </p>
                    <p className="text-[18px] font-bold text-[#0B1B3F]">{listing.checkoutTime}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* House rules */}
          {rules.length > 0 && (
            <section className="py-7 border-b border-slate-200">
              <h2 className="text-[19px] font-bold text-[#0B1B3F] mb-4">House rules</h2>
              <ul className="space-y-3">
                {rules.map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 text-[14px] border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <span className="text-slate-500">{r.label}</span>
                    <span className="font-semibold text-[#0B1B3F]">{r.value}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Cancellation (nightly short-stays only) */}
          {isShortStay && (
            <section className="py-7 border-b border-slate-200">
              <h2 className="text-[19px] font-bold text-[#0B1B3F] mb-3">Cancellation policy</h2>
              <div className="rounded-2xl border border-slate-200 px-5 py-4">
                <p className="text-[15px] font-semibold text-[#0B1B3F]">
                  {STAY_POLICY_LABEL[listing.cancellationPolicy] ?? "Direct booking policy"}
                </p>
                <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">
                  The exact refund schedule is shown at checkout before you confirm and pay.
                </p>
              </div>
            </section>
          )}

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

          {/* Host section */}
          {listing.hostName && (
            <section className="py-7 border-b border-slate-200">
              <h2 className="text-[19px] font-bold text-[#0B1B3F] mb-5">About your host</h2>
              <div className="flex items-start gap-5">
                <div className="shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2563EB]/20 to-[#1D4ED8]/30 flex items-center justify-center text-[#1D4ED8] font-bold text-[22px] ring-2 ring-white shadow-md">
                    {listing.hostName.slice(0, 1).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-bold text-[#0B1B3F]">{listing.hostName}</p>
                  <p className="text-[13px] text-slate-500 mt-0.5">Professional property manager</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" /> ID verified
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#1D4ED8] bg-blue-50 px-2.5 py-1 rounded-full">
                      <Award className="w-3.5 h-3.5" /> Professional PM
                    </span>
                  </div>
                  <p className="mt-3 text-[13.5px] text-slate-600 leading-relaxed">
                    To protect your payment, never transfer money or communicate outside of Propvora.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Things to know */}
          <section className="py-7 border-b border-slate-200">
            <h2 className="text-[19px] font-bold text-[#0B1B3F] mb-4">Things to know</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <p className="text-[13.5px] font-bold text-[#0B1B3F] mb-2">House rules</p>
                <ul className="space-y-1.5 text-[13px] text-slate-500">
                  {listing.checkInWindow && <li>Check-in: {listing.checkInWindow}</li>}
                  {listing.checkoutTime && <li>Check-out: {listing.checkoutTime}</li>}
                  {rules.slice(0, 3).map((r, i) => (
                    <li key={i}>{r.label}: {r.value}</li>
                  ))}
                  {!listing.checkInWindow && !listing.checkoutTime && rules.length === 0 && (
                    <li>House rules shared before check-in.</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="text-[13.5px] font-bold text-[#0B1B3F] mb-2">Cancellation policy</p>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  {STAY_POLICY_LABEL[listing.cancellationPolicy] ?? "Direct booking policy"}. Full schedule shown at checkout before payment.
                </p>
              </div>
              <div>
                <p className="text-[13.5px] font-bold text-[#0B1B3F] mb-2">Health &amp; safety</p>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  {listing.complianceStatus === "passed"
                    ? "Licence verified by Propvora. Payment is secured in escrow until check-in."
                    : "Payment is held securely until check-in. Ask the host about local licensing."}
                </p>
              </div>
            </div>
          </section>

          {/* Compliance note */}
          <div className="py-6 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[12px] leading-relaxed text-slate-400">
              This stay is offered directly by the property manager. Local taxes, registration or short-let
              rules may apply. Propvora provides the booking platform and this is not legal or tax advice.
            </p>
          </div>
        </div>

        {/* ── Right column: booking card ── */}
        <div id="booking-card" className="lg:col-span-5">
          <div className="lg:sticky lg:top-[88px]">
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
            {/* Trust signals under the card */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>You won&apos;t be charged yet</span>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 p-4">
              <p className="text-[12.5px] font-semibold text-[#0B1B3F] mb-1">Report this listing</p>
              <p className="text-[12px] text-slate-400 leading-relaxed">
                Something look wrong or scammy? Let us know and we&apos;ll investigate.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Guest sign-up nudge ── */}
      <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-[14px] font-semibold text-[#0B1B3F]">New to Propvora?</p>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Create a free guest account to save favourites, track your trips and message the host directly.
          </p>
        </div>
        <Link
          href="/register?intent=customer"
          className="shrink-0 inline-flex items-center justify-center rounded-xl bg-[#2563EB] text-white text-[13.5px] font-semibold px-5 py-2.5 hover:bg-[#1d4ed8] transition-colors"
        >
          Sign up free
        </Link>
      </div>

      {/* ── Similar stays ── */}
      <SimilarStays listings={similar} />
    </div>
  )
}
