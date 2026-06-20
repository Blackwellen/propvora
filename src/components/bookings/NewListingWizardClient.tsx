"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { createListing, savePricingProfile } from "./actions-deep"
import type { ListingType, BookingMode } from "@/lib/booking/booking-listings"
import { WizardProgressStepper } from "@/features/listings/components/listing-wizard/WizardProgressStepper"
import { WizardTypeStep } from "@/features/listings/components/listing-wizard/WizardTypeStep"
import { WizardPropertyStep } from "@/features/listings/components/listing-wizard/WizardPropertyStep"
import { WizardRoomsStep } from "@/features/listings/components/listing-wizard/WizardRoomsStep"
import { WizardSummaryStep } from "@/features/listings/components/listing-wizard/WizardSummaryStep"
import { WizardPricingStep } from "@/features/listings/components/listing-wizard/WizardPricingStep"
import { WizardDoneStep } from "@/features/listings/components/listing-wizard/WizardDoneStep"

/* ──────────────────────────────────────────────────────────────────────────
   New listing wizard — 6-step onboarding for booking_listings.

   Steps: 1. Type  2. Property link  3. Rooms  4. Summary  5. Pricing  6. Done
   On completion navigates to the full listing detail page (19 tabs).
   All money stored in integer pence; UI inputs in £.
─────────────────────────────────────────────────────────────────────────── */

type Step = 1 | 2 | 3 | 4 | 5 | 6

const STEP_TITLES: Record<Step, string> = {
  1: "What type of space?",
  2: "Link to a property",
  3: "Rooms and capacity",
  4: "Name your listing",
  5: "Set your price",
  6: "Listing created!",
}

const STEP_SUBTITLES: Record<Step, string> = {
  1: "Choose the accommodation type that best describes your space.",
  2: "Connect this listing to a property record. You can skip and link later.",
  3: "Tell guests what the space offers.",
  4: "Give your listing a clear, descriptive title.",
  5: "Set a base nightly rate. You can add pricing rules later.",
  6: "Your listing is ready for setup. Go to the detail page to complete it.",
}

interface Props {
  properties: { id: string; label: string; city: string | null }[]
  defaultCountry: string
}

export function NewListingWizardClient({ properties, defaultCountry }: Props) {
  const [pending, startT] = useTransition()
  const [step, setStep] = useState<Step>(1)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [listingType, setListingType] = useState<ListingType>("entire_home")
  const [bookingMode, setBookingMode] = useState<BookingMode>("request")
  const [propertyId, setPropertyId] = useState("")
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [maxGuests, setMaxGuests] = useState(2)
  const [bedrooms, setBedrooms] = useState(1)
  const [beds, setBeds] = useState(1)
  const [bathrooms, setBathrooms] = useState(1)
  const [basePrice, setBasePrice] = useState("")
  const [cleaningFee, setCleaningFee] = useState("")
  const [minNights, setMinNights] = useState(1)

  // Created listing id (set after step 5 completes)
  const [createdId, setCreatedId] = useState<string | null>(null)

  function prev() {
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  function next() {
    setError(null)
    if (step < 5) {
      if (step === 4 && !title.trim()) {
        setError("Please enter a listing title.")
        return
      }
      setStep((s) => (s + 1) as Step)
      return
    }
    // Step 5 → create the listing + pricing → navigate to detail
    if (step === 5) {
      const base = Math.round(parseFloat(basePrice || "0") * 100)
      if (!Number.isFinite(base) || base <= 0) {
        setError("Enter a base nightly price greater than £0.")
        return
      }
      startT(async () => {
        const res = await createListing({
          title: title.trim() || "Untitled listing",
          listingType,
          bookingMode,
          propertyId: propertyId || null,
          maxGuests,
          bedrooms,
          beds,
          bathrooms,
          countryCode: defaultCountry,
        })
        if (!res.ok || !res.data) {
          setError(res.error ?? "Could not create the listing.")
          return
        }
        const id = res.data.id
        setCreatedId(id)

        // Save pricing
        await savePricingProfile({
          listingId: id,
          baseNightlyPence: base,
          cleaningFeePence: cleaningFee.trim() === "" ? 0 : Math.round(parseFloat(cleaningFee) * 100),
          minNights,
        })

        setStep(6)
      })
    }
  }

  return (
    <DashboardContainer>
      <MobileTopBar title="New listing" subtitle="Create a booking listing" showBack backHref="/app/bookings/listings" />

      <div className="px-4 md:px-6 py-4 md:py-6 space-y-5">
        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-sm">
          <Link href="/app/bookings/listings" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Listings
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium">New listing</span>
        </div>

        <WizardProgressStepper currentStep={step} />

        {/* Card */}
        <div className="max-w-2xl">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">{STEP_TITLES[step]}</h2>
              <p className="text-[13px] text-slate-500 mt-0.5">{STEP_SUBTITLES[step]}</p>
            </div>

            <div className="px-6 py-5 space-y-5">
              {step === 1 && (
                <WizardTypeStep value={listingType} onChange={setListingType} />
              )}
              {step === 2 && (
                <WizardPropertyStep
                  propertyId={propertyId}
                  onPropertyIdChange={setPropertyId}
                  bookingMode={bookingMode}
                  onBookingModeChange={setBookingMode}
                  properties={properties}
                />
              )}
              {step === 3 && (
                <WizardRoomsStep
                  maxGuests={maxGuests}
                  onMaxGuestsChange={setMaxGuests}
                  bedrooms={bedrooms}
                  onBedroomsChange={setBedrooms}
                  beds={beds}
                  onBedsChange={setBeds}
                  bathrooms={bathrooms}
                  onBathroomsChange={setBathrooms}
                />
              )}
              {step === 4 && (
                <WizardSummaryStep
                  title={title}
                  onTitleChange={setTitle}
                  summary={summary}
                  onSummaryChange={setSummary}
                />
              )}
              {step === 5 && (
                <WizardPricingStep
                  basePrice={basePrice}
                  onBasePriceChange={setBasePrice}
                  cleaningFee={cleaningFee}
                  onCleaningFeeChange={setCleaningFee}
                  minNights={minNights}
                  onMinNightsChange={setMinNights}
                />
              )}
              {step === 6 && createdId && (
                <WizardDoneStep createdId={createdId} listingTitle={title} />
              )}

              {error && (
                <p className="text-[13px] text-red-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </p>
              )}
            </div>

            {/* Nav buttons */}
            {step < 6 && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prev}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                ) : (
                  <Link
                    href="/app/bookings/listings"
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Cancel
                  </Link>
                )}
                <button
                  type="button"
                  onClick={next}
                  disabled={pending}
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {pending ? "Creating…" : step === 5 ? "Create listing" : "Continue"}
                  {!pending && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardContainer>
  )
}

export default NewListingWizardClient
