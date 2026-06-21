"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Home,
  Layers,
  Users,
  Sparkles,
  ImageIcon,
  Tag,
  ShieldCheck,
  CalendarRange,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  Circle,
  Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { fmtMoney } from "./primitives"
import {
  updateListing,
  savePricingProfile,
  openAvailabilityWindow,
  publishListing,
} from "./actions-deep"
import type { BookingListing, ListingPhoto, ListingType, BookingMode, CancellationPolicy } from "@/lib/booking/booking-listings"
import type { SavedPricingProfile } from "@/lib/booking/pricing-profiles"
import type { PublishReadiness } from "@/lib/booking/booking-listings"
import type { ListingAccommodation, CatalogueAmenity } from "@/lib/booking/accommodation"
import type { KeylessLock } from "@/lib/booking/keyless"
import { AccommodationStep } from "./listing-wizard/AccommodationStep"

/* ──────────────────────────────────────────────────────────────────────────
   Listing wizard — the start of the 18-step listing builder. Persisted state
   per step; real publish gate. Steps wired with real saves: property/type,
   capacity, amenities, photos (count surfaced), pricing, rules, availability,
   publish. Remaining advanced steps shown as honest "coming in setup" items.
─────────────────────────────────────────────────────────────────────────── */

interface Props {
  listing: BookingListing
  photos: ListingPhoto[]
  pricing: SavedPricingProfile | null
  readiness: PublishReadiness | null
  properties: { id: string; label: string; city: string | null }[]
  accommodation: ListingAccommodation
  amenityCatalogue: CatalogueAmenity[]
  selectedAmenitySlugs: string[]
  keylessLock: KeylessLock | null
}

type StepKey =
  | "basics"
  | "accommodation"
  | "capacity"
  | "amenities"
  | "photos"
  | "pricing"
  | "rules"
  | "availability"
  | "publish"

const STEPS: { key: StepKey; label: string; icon: React.ElementType }[] = [
  { key: "basics", label: "Property & type", icon: Home },
  { key: "accommodation", label: "Accommodation", icon: Building2 },
  { key: "capacity", label: "Capacity", icon: Users },
  { key: "amenities", label: "Amenities", icon: Sparkles },
  { key: "photos", label: "Photos", icon: ImageIcon },
  { key: "pricing", label: "Pricing", icon: Tag },
  { key: "rules", label: "Rules & policy", icon: ShieldCheck },
  { key: "availability", label: "Availability", icon: CalendarRange },
  { key: "publish", label: "Publish", icon: Rocket },
]

const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: "entire_home", label: "Entire home" },
  { value: "private_room", label: "Private room" },
  { value: "shared_room", label: "Shared room" },
  { value: "serviced_accommodation", label: "Serviced accommodation" },
  { value: "student_room", label: "Student room" },
  { value: "hmo_room", label: "HMO room" },
  { value: "unit", label: "Unit" },
  { value: "other", label: "Other" },
]

const AMENITIES = [
  "wifi", "parking", "kitchen", "washer", "dryer", "heating", "air_conditioning",
  "tv", "workspace", "self_checkin", "smoke_alarm", "first_aid", "pets_allowed", "lift",
]

const POLICIES: { value: CancellationPolicy; label: string }[] = [
  { value: "flexible", label: "Flexible" },
  { value: "moderate", label: "Moderate" },
  { value: "strict", label: "Strict" },
  { value: "non_refundable", label: "Non-refundable" },
]

export function ListingWizardClient({
  listing: initial,
  photos,
  pricing,
  readiness,
  properties,
  accommodation,
  amenityCatalogue,
  selectedAmenitySlugs,
  keylessLock,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [active, setActive] = useState<StepKey>("basics")
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null)

  // form state
  const [title, setTitle] = useState(initial.title)
  const [summary, setSummary] = useState(initial.summary ?? "")
  const [listingType, setListingType] = useState<ListingType>(initial.listingType)
  const [bookingMode, setBookingMode] = useState<BookingMode>(initial.bookingMode)
  const [propertyId, setPropertyId] = useState(initial.propertyId ?? "")
  const [maxGuests, setMaxGuests] = useState(initial.maxGuests)
  const [bedrooms, setBedrooms] = useState(initial.bedrooms)
  const [beds, setBeds] = useState(initial.beds)
  const [bathrooms, setBathrooms] = useState(initial.bathrooms)
  const [amenities, setAmenities] = useState<string[]>(
    Array.isArray(initial.amenities) ? (initial.amenities as string[]) : []
  )
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy>(initial.cancellationPolicy)
  const [checkInWindow, setCheckInWindow] = useState(initial.checkInWindow ?? "")
  const [checkoutTime, setCheckoutTime] = useState(initial.checkoutTime ?? "")

  // pricing state (pounds in UI, pence to server)
  const [basePrice, setBasePrice] = useState(pricing ? String(pricing.baseNightlyPence / 100) : "")
  const [weekendPrice, setWeekendPrice] = useState(pricing?.weekendPence != null ? String(pricing.weekendPence / 100) : "")
  const [minNights, setMinNights] = useState(pricing?.minNights ?? 1)
  const [cleaningFee, setCleaningFee] = useState(pricing ? String(pricing.cleaningFeePence / 100) : "")
  const [weeklyDiscount, setWeeklyDiscount] = useState(pricing?.weeklyDiscountPct ?? 0)
  const [deposit, setDeposit] = useState(pricing ? String(pricing.securityDepositPence / 100) : "")

  const [publishChecks, setPublishChecks] = useState(readiness)

  function notify(kind: "ok" | "err", msg: string) {
    setToast({ kind, msg })
    setTimeout(() => setToast(null), 3500)
  }

  function saveBasics() {
    startTransition(async () => {
      const res = await updateListing({
        listingId: initial.id,
        title,
        summary,
        listingType,
        bookingMode,
        propertyId: propertyId || null,
      })
      res.ok ? notify("ok", "Saved.") : notify("err", res.error ?? "Could not save.")
      router.refresh()
    })
  }
  function saveCapacity() {
    startTransition(async () => {
      const res = await updateListing({ listingId: initial.id, maxGuests, bedrooms, beds, bathrooms })
      res.ok ? notify("ok", "Saved.") : notify("err", res.error ?? "Could not save.")
      router.refresh()
    })
  }
  function saveAmenities() {
    startTransition(async () => {
      const res = await updateListing({ listingId: initial.id, amenities })
      res.ok ? notify("ok", "Amenities saved.") : notify("err", res.error ?? "Could not save.")
      router.refresh()
    })
  }
  function saveRules() {
    startTransition(async () => {
      const res = await updateListing({
        listingId: initial.id,
        cancellationPolicy,
        checkInWindow: checkInWindow || null,
        checkoutTime: checkoutTime || null,
      })
      res.ok ? notify("ok", "Rules saved.") : notify("err", res.error ?? "Could not save.")
      router.refresh()
    })
  }
  function savePricing() {
    const base = Math.round(parseFloat(basePrice || "0") * 100)
    if (!Number.isFinite(base) || base <= 0) {
      notify("err", "Enter a base nightly price.")
      return
    }
    startTransition(async () => {
      const res = await savePricingProfile({
        listingId: initial.id,
        baseNightlyPence: base,
        weekendPence: weekendPrice.trim() === "" ? null : Math.round(parseFloat(weekendPrice) * 100),
        weeklyDiscountPct: weeklyDiscount,
        minNights,
        cleaningFeePence: cleaningFee.trim() === "" ? 0 : Math.round(parseFloat(cleaningFee) * 100),
        securityDepositPence: deposit.trim() === "" ? 0 : Math.round(parseFloat(deposit) * 100),
      })
      res.ok ? notify("ok", "Pricing saved.") : notify("err", res.error ?? "Could not save pricing.")
      router.refresh()
    })
  }
  function openAvailability() {
    startTransition(async () => {
      const start = new Date()
      const monthStart = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`
      const res = await openAvailabilityWindow(initial.id, monthStart, 180)
      res.ok ? notify("ok", `Opened ${res.data?.count ?? 0} days.`) : notify("err", res.error ?? "Could not open availability.")
      router.refresh()
    })
  }
  function doPublish() {
    startTransition(async () => {
      const res = await publishListing(initial.id)
      if (res.ok) {
        notify("ok", "Listing published.")
        router.refresh()
      } else {
        notify("err", res.error ?? "Could not publish.")
        if (res.blockers) {
          setPublishChecks((prev) =>
            prev
              ? {
                  ...prev,
                  checks: prev.checks.map((c) => ({
                    ...c,
                    done: !res.blockers!.some((b) => b.key === c.key),
                  })),
                }
              : prev
          )
        }
      }
    })
  }

  function toggleAmenity(a: string) {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
  }

  const stepDone: Record<StepKey, boolean> = {
    basics: !!propertyId && title.trim().length > 2,
    accommodation: !!accommodation.accommodationCategory,
    capacity: maxGuests >= 1,
    amenities: amenities.length > 0,
    photos: photos.length > 0,
    pricing: !!pricing && pricing.baseNightlyPence > 0,
    rules: !!cancellationPolicy,
    availability: (publishChecks?.checks.find((c) => c.key === "availability")?.done) ?? false,
    publish: initial.status === "published",
  }

  return (
    <DashboardContainer>
      <MobileTopBar title={initial.title} subtitle="Listing setup" showBack backHref="/property-manager/bookings/listings" />

      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm shadow-xl max-w-sm",
            toast.kind === "ok" ? "bg-slate-900" : "bg-red-600"
          )}
        >
          {toast.kind === "ok" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="px-4 md:px-6 py-4 md:py-6 space-y-5">
        <div className="hidden md:flex items-center gap-2 text-sm">
          <Link href="/property-manager/bookings/listings" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" />
            Listings
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium truncate">{initial.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 items-start">
          {/* Step nav */}
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const isActive = active === s.key
              const done = stepDone[s.key]
              return (
                <button
                  key={s.key}
                  onClick={() => setActive(s.key)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium whitespace-nowrap transition-colors shrink-0 lg:w-full",
                    isActive ? "bg-[#2563EB] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <span className="shrink-0">
                    {done ? (
                      <CheckCircle2 className={cn("w-4 h-4", isActive ? "text-white" : "text-emerald-500")} />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </span>
                  <span className="lg:flex-1 text-left">{i + 1}. {s.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Step body */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="px-5 md:px-6 py-5 space-y-5">
              {active === "basics" && (
                <Section title="Property & listing type" desc="Link this listing to a property and choose how it sells.">
                  <Field label="Listing title">
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Summary">
                    <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className={cn(inputCls, "resize-none")} />
                  </Field>
                  <Field label="Property">
                    <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={inputCls}>
                      <option value="">Select a property…</option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}{p.city ? ` — ${p.city}` : ""}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Listing type">
                    <select value={listingType} onChange={(e) => setListingType(e.target.value as ListingType)} className={inputCls}>
                      {LISTING_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Booking mode">
                    <div className="flex gap-2">
                      {(["instant", "request", "enquiry"] as BookingMode[]).map((m) => (
                        <button
                          key={m}
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
                  </Field>
                  <SaveBar onSave={saveBasics} pending={pending} />
                </Section>
              )}

              {active === "accommodation" && (
                <AccommodationStep
                  listingId={initial.id}
                  accommodation={accommodation}
                  amenityCatalogue={amenityCatalogue}
                  selectedAmenitySlugs={selectedAmenitySlugs}
                  keylessLock={keylessLock}
                  onSaved={() => router.refresh()}
                />
              )}

              {active === "capacity" && (
                <Section title="Capacity" desc="How many guests and what the space offers.">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Max guests"><NumberInput value={maxGuests} onChange={setMaxGuests} min={1} /></Field>
                    <Field label="Bedrooms"><NumberInput value={bedrooms} onChange={setBedrooms} min={0} /></Field>
                    <Field label="Beds"><NumberInput value={beds} onChange={setBeds} min={0} /></Field>
                    <Field label="Bathrooms"><NumberInput value={bathrooms} onChange={setBathrooms} min={0} step={0.5} /></Field>
                  </div>
                  <SaveBar onSave={saveCapacity} pending={pending} />
                </Section>
              )}

              {active === "amenities" && (
                <Section title="Amenities" desc="What guests get. Select all that apply.">
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map((a) => {
                      const on = amenities.includes(a)
                      return (
                        <button
                          key={a}
                          onClick={() => toggleAmenity(a)}
                          className={cn(
                            "h-9 px-3 rounded-lg text-[13px] font-medium capitalize transition-colors",
                            on ? "bg-[#2563EB] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          {a.replace(/_/g, " ")}
                        </button>
                      )
                    })}
                  </div>
                  <SaveBar onSave={saveAmenities} pending={pending} />
                </Section>
              )}

              {active === "photos" && (
                <Section title="Photos" desc="Upload photos to publish. Photo storage uses your workspace media.">
                  {photos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {photos.map((p) => (
                        <div key={p.id} className="aspect-square rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                          {p.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.url} alt={p.caption ?? ""} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-slate-300" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
                      <ImageIcon className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No photos yet.</p>
                      <p className="text-[12px] text-slate-400 mt-1">
                        Photo upload connects to your workspace media library. At least one photo is required to publish.
                      </p>
                    </div>
                  )}
                </Section>
              )}

              {active === "pricing" && (
                <Section title="Pricing" desc="Base nightly rate and the fees the quote engine applies.">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label={`Base nightly (${initial.currency})`}>
                      <input value={basePrice} onChange={(e) => setBasePrice(e.target.value)} type="number" min="0" className={inputCls} />
                    </Field>
                    <Field label={`Weekend nightly (${initial.currency})`}>
                      <input value={weekendPrice} onChange={(e) => setWeekendPrice(e.target.value)} type="number" min="0" placeholder="optional" className={inputCls} />
                    </Field>
                    <Field label="Minimum nights"><NumberInput value={minNights} onChange={setMinNights} min={1} /></Field>
                    <Field label="Weekly discount %"><NumberInput value={weeklyDiscount} onChange={setWeeklyDiscount} min={0} max={100} /></Field>
                    <Field label={`Cleaning fee (${initial.currency})`}>
                      <input value={cleaningFee} onChange={(e) => setCleaningFee(e.target.value)} type="number" min="0" placeholder="0" className={inputCls} />
                    </Field>
                    <Field label={`Security deposit (${initial.currency})`}>
                      <input value={deposit} onChange={(e) => setDeposit(e.target.value)} type="number" min="0" placeholder="0" className={inputCls} />
                    </Field>
                  </div>
                  {pricing && (
                    <p className="text-[12px] text-slate-400">
                      Current base: {fmtMoney(pricing.baseNightlyPence, initial.currency)} / night
                    </p>
                  )}
                  <SaveBar onSave={savePricing} pending={pending} />
                </Section>
              )}

              {active === "rules" && (
                <Section title="Rules & cancellation policy" desc="House rules, check-in window and cancellation policy.">
                  <Field label="Cancellation policy">
                    <select value={cancellationPolicy} onChange={(e) => setCancellationPolicy(e.target.value as CancellationPolicy)} className={inputCls}>
                      {POLICIES.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Check-in window">
                      <input value={checkInWindow} onChange={(e) => setCheckInWindow(e.target.value)} placeholder="15:00–21:00" className={inputCls} />
                    </Field>
                    <Field label="Checkout time">
                      <input value={checkoutTime} onChange={(e) => setCheckoutTime(e.target.value)} placeholder="10:00" className={inputCls} />
                    </Field>
                  </div>
                  <SaveBar onSave={saveRules} pending={pending} />
                </Section>
              )}

              {active === "availability" && (
                <Section title="Availability" desc="Open a window of bookable dates. Fine-tune day by day in the calendar.">
                  <button
                    onClick={openAvailability}
                    disabled={pending}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <CalendarRange className="w-4 h-4" />
                    Open next 180 days
                  </button>
                  <Link
                    href={`/property-manager/bookings/calendar?listing=${initial.id}`}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 ml-2"
                  >
                    Open calendar
                  </Link>
                </Section>
              )}

              {active === "publish" && (
                <Section title="Publish" desc="All checks must pass before this listing can go live.">
                  <div className="space-y-2">
                    {(publishChecks?.checks ?? []).map((c) => (
                      <div key={c.key} className="flex items-center gap-2.5 text-sm">
                        {c.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span className={c.done ? "text-slate-600" : "text-slate-500"}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                  {initial.status === "published" ? (
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3">
                      <Layers className="w-4 h-4" />
                      This listing is published and accepting bookings.
                    </div>
                  ) : (
                    <button
                      onClick={doPublish}
                      disabled={pending || !(publishChecks?.ready ?? false)}
                      className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Rocket className="w-4 h-4" />
                      {pending ? "Publishing…" : "Publish listing"}
                    </button>
                  )}
                  {!(publishChecks?.ready ?? false) && initial.status !== "published" && (
                    <p className="text-[12px] text-slate-400">Complete the outstanding checks above to enable publishing.</p>
                  )}
                </Section>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardContainer>
  )
}

const inputCls =
  "w-full h-10 px-3 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <p className="text-[13px] text-slate-500 mt-0.5">{desc}</p>
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  )
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className={inputCls}
    />
  )
}

function SaveBar({ onSave, pending }: { onSave: () => void; pending: boolean }) {
  return (
    <div className="pt-1">
      <button
        onClick={onSave}
        disabled={pending}
        className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save step"}
      </button>
    </div>
  )
}

export default ListingWizardClient
