import { ShieldCheck } from "lucide-react"
import StayBookingCard from "@/components/booking/StayBookingCard"
import EnquiryCard from "@/components/booking/EnquiryCard"

interface StayBookingSidebarProps {
  listing: {
    id: string
    slug: string | null
    title: string
    currency: string | null
    maxGuests: number
    fromNightlyPence: number | null
    cancellationPolicy: string | null
    securityDepositPence: number | null
    minNights: number | null
    applyFlow: boolean
    accommodationCategory: string | null
    typeDetails: { availableFrom?: string | null }
  }
  isShortStay: boolean
  periodLabel: string
}

export default function StayBookingSidebar({
  listing,
  isShortStay,
  periodLabel,
}: StayBookingSidebarProps) {
  return (
    <div id="booking-card" className="lg:col-span-5">
      <div className="lg:sticky lg:top-[88px]">
        {isShortStay ? (
          <StayBookingCard
            listingId={listing.id}
            slug={listing.slug ?? listing.id}
            title={listing.title}
            currency={listing.currency ?? "GBP"}
            maxGuests={listing.maxGuests}
            fromNightlyPence={listing.fromNightlyPence}
            cancellationPolicy={listing.cancellationPolicy ?? "flexible"}
            securityDepositPence={listing.securityDepositPence}
            minNights={listing.minNights ?? 1}
          />
        ) : (
          <EnquiryCard
            listingId={listing.id}
            title={listing.title}
            currency={listing.currency ?? "GBP"}
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
  )
}
