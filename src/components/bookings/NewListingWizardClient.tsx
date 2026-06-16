"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Building2,
  Users,
  FileText,
  Tag,
  Rocket,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { createListing, savePricingProfile } from "./actions-deep"
import type { ListingType, BookingMode } from "@/lib/booking/booking-listings"

/* ──────────────────────────────────────────────────────────────────────────
   New listing wizard — 6-step onboarding for booking_listings.

   Steps: 1. Type  2. Property link  3. Rooms  4. Summary  5. Pricing  6. Done
   On completion navigates to the full listing detail page (19 tabs).
   All money stored in integer pence; UI inputs in £.
─────────────────────────────────────────────────────────────────────────── */

type Step = 1 | 2 | 3 | 4 | 5 | 6

interface Props {
  properties: { id: string; label: string; city: string | null }[]
  defaultCountry: string
}

const LISTING_TYPES: { value: ListingType; label: string; desc: string }[] = [
  { value: "entire_home", label: "Entire home", desc: "Guests have the whole place to themselves." },
  { value: "serviced_accommodation", label: "Serviced accommodation", desc: "Hotel-alternative with hospitality services." },
  { value: "private_room", label: "Private room", desc: "Guests have a private room; shared spaces." },
  { value: "hmo_room", label: "HMO room", desc: "Room in a house of multiple occupation." },
  { value: "student_room", label: "Student room", desc: "Room in student accommodation." },
  { value: "unit", label: "Unit", desc: "A self-contained unit in a larger development." },
  { value: "other", label: "Other", desc: "Something else." },
]

const inputCls =
  "w-full h-10 px-3 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"

const STEPS = [
  { n: 1 as Step, label: "Type", icon: Home },
  { n: 2 as Step, label: "Property", icon: Building2 },
  { n: 3 as Step, label: "Rooms", icon: Users },
  { n: 4 as Step, label: "Summary", icon: FileText },
  { n: 5 as Step, label: "Pricing", icon: Tag },
  { n: 6 as Step, label: "Done", icon: Rocket },
]

export function NewListingWizardClient({ properties, defaultCountry }: Props) {
  const router = useRouter()
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

  // Created listing id (set after step 1–4 completes)
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

        {/* Progress */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {STEPS.map(({ n, label, icon: Icon }) => (
            <div key={n} className="flex items-center gap-1">
              <div
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors",
                  step === n
                    ? "bg-[#2563EB] text-white"
                    : step > n
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {step > n ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                {label}
              </div>
              {n < 6 && <span className="text-slate-200 text-xs">›</span>}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="max-w-2xl">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {step === 1 && "What type of space?"}
                {step === 2 && "Link to a property"}
                {step === 3 && "Rooms and capacity"}
                {step === 4 && "Name your listing"}
                {step === 5 && "Set your price"}
                {step === 6 && "Listing created!"}
              </h2>
              <p className="text-[13px] text-slate-500 mt-0.5">
                {step === 1 && "Choose the accommodation type that best describes your space."}
                {step === 2 && "Connect this listing to a property record. You can skip and link later."}
                {step === 3 && "Tell guests what the space offers."}
                {step === 4 && "Give your listing a clear, descriptive title."}
                {step === 5 && "Set a base nightly rate. You can add pricing rules later."}
                {step === 6 && "Your listing is ready for setup. Go to the detail page to complete it."}
              </p>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Step 1: Type */}
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {LISTING_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setListingType(t.value)}
                      className={cn(
                        "text-left p-4 rounded-xl border transition-colors",
                        listingType === t.value
                          ? "border-[#2563EB] bg-blue-50/50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      )}
                    >
                      <p className={cn("text-sm font-semibold", listingType === t.value ? "text-[#2563EB]" : "text-slate-800")}>
                        {t.label}
                      </p>
                      <p className="text-[12px] text-slate-500 mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Property */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Property</label>
                    <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={inputCls}>
                      <option value="">Skip — link later</option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}{p.city ? ` — ${p.city}` : ""}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400">
                      Linking to a property is required before publishing.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Booking mode</label>
                    <div className="flex gap-2">
                      {(["instant", "request", "enquiry"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setBookingMode(m)}
                          className={cn(
                            "flex-1 h-10 rounded-xl text-sm font-medium capitalize transition-colors",
                            bookingMode === m ? "bg-[#2563EB] text-white" : "bg-white text-slate-600 border border-slate-200"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Rooms */}
              {step === 3 && (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Max guests", val: maxGuests, set: setMaxGuests, min: 1 },
                    { label: "Bedrooms", val: bedrooms, set: setBedrooms, min: 0 },
                    { label: "Beds", val: beds, set: setBeds, min: 0 },
                    { label: "Bathrooms", val: bathrooms, set: setBathrooms, min: 0 },
                  ].map(({ label, val, set, min }) => (
                    <div key={label} className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">{label}</label>
                      <div className="inline-flex items-center border border-slate-200 rounded-xl overflow-hidden">
                        <button type="button" onClick={() => set(Math.max(min, val - 1))} className="w-9 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg">−</button>
                        <span className="w-12 text-center text-sm font-semibold text-slate-800 select-none">{val}</span>
                        <button type="button" onClick={() => set(val + 1)} className="w-9 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 4: Summary */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Listing title *</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Garden Studio — Central London"
                      className={inputCls}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Short summary</label>
                    <textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={3}
                      placeholder="A brief description to attract guests."
                      className={cn(inputCls, "h-auto py-2.5 resize-none")}
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Pricing */}
              {step === 5 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Base nightly (£) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
                      <input
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        type="number"
                        min="1"
                        autoFocus
                        className={cn(inputCls, "pl-7")}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Cleaning fee (£)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
                      <input
                        value={cleaningFee}
                        onChange={(e) => setCleaningFee(e.target.value)}
                        type="number"
                        min="0"
                        placeholder="0"
                        className={cn(inputCls, "pl-7")}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Minimum nights</label>
                    <div className="inline-flex items-center border border-slate-200 rounded-xl overflow-hidden">
                      <button type="button" onClick={() => setMinNights(Math.max(1, minNights - 1))} className="w-9 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg">−</button>
                      <span className="w-12 text-center text-sm font-semibold text-slate-800 select-none">{minNights}</span>
                      <button type="button" onClick={() => setMinNights(minNights + 1)} className="w-9 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg">+</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Done */}
              {step === 6 && createdId && (
                <div className="flex flex-col items-center text-center py-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{title || "Your listing"} is ready</h3>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Go to the listing to add photos, open availability, configure check-in and publish.
                  </p>
                  <div className="flex gap-2 mt-6">
                    <Link
                      href={`/app/bookings/listings/${createdId}`}
                      className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors"
                    >
                      Set up listing
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/app/bookings/listings"
                      className="inline-flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      Back to listings
                    </Link>
                  </div>
                </div>
              )}

              {/* Error */}
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
