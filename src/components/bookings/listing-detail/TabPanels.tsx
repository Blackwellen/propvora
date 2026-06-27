"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  CheckCircle2,
  Circle,
  ImageIcon,
  Plus,
  Tag,
  CalendarRange,
  ShieldCheck,
  KeyRound,
  Star,
  AlertTriangle,
  Trash2,
  ExternalLink,
  Info,
  Rocket,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { fmtMoney, fmtDate } from "../primitives"
import {
  updateListing,
  savePricingProfile,
  publishListing,
  pauseListing,
  openAvailabilityWindow,
} from "../actions-deep"
import type {
  BookingListing,
  ListingPhoto,
  SavedPricingProfile,
  PublishReadiness,
  CatalogueAmenity,
  ListingAccommodation,
  KeylessLock,
} from "@/lib/booking/listings"
import type { BookingRow } from "../server"

/* ──────────────────────────────────────────────────────────────────────────
   All 19 tab panel bodies for the Listing Detail page.
   Import the named export you need from this file in the parent wrapper.
   Each panel receives the minimal props it needs (no god-object).
─────────────────────────────────────────────────────────────────────────── */

/**
 * Return a locale-aware narrow currency symbol for input field prefixes.
 * Falls back to the ISO code if Intl.NumberFormat can't resolve a symbol.
 */
function currencySymbol(currency: string): string {
  try {
    const parts = new Intl.NumberFormat("en-GB", { style: "currency", currency, currencyDisplay: "narrowSymbol" })
      .formatToParts(0)
    const sym = parts.find((p) => p.type === "currency")?.value
    return sym ?? currency
  } catch {
    return currency
  }
}

const inputCls =
  "w-full h-10 px-3 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"

function PanelWrap({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="px-5 md:px-6 py-5 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {desc && <p className="text-[13px] text-slate-500 mt-0.5">{desc}</p>}
      </div>
      <div className="px-5 md:px-6 py-5 space-y-5">{children}</div>
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

function NumberStepper({ value, onChange, min = 0, max, step = 1 }: { value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div className="inline-flex items-center border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-9 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg font-medium transition-colors"
      >
        −
      </button>
      <span className="w-12 text-center text-sm font-semibold text-slate-800 select-none">{value}</span>
      <button
        type="button"
        onClick={() => onChange(max !== undefined ? Math.min(max, value + step) : value + step)}
        className="w-9 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg font-medium transition-colors"
      >
        +
      </button>
    </div>
  )
}

function SaveBar({ onSave, pending, label = "Save changes" }: { onSave: () => void; pending: boolean; label?: string }) {
  return (
    <div className="pt-2 border-t border-slate-100">
      <button
        type="button"
        onClick={onSave}
        disabled={pending}
        className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 transition-colors"
      >
        {pending ? "Saving…" : label}
      </button>
    </div>
  )
}

function Toast({ kind, msg }: { kind: "ok" | "err"; msg: string }) {
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm shadow-xl max-w-sm",
        kind === "ok" ? "bg-slate-900" : "bg-red-600"
      )}
    >
      {kind === "ok" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4" />}
      <span>{msg}</span>
    </div>
  )
}

function useToast() {
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null)
  const notify = (kind: "ok" | "err", msg: string) => {
    setToast({ kind, msg })
    setTimeout(() => setToast(null), 3500)
  }
  return { toast, notify }
}

// ── 1. Overview ───────────────────────────────────────────────────────────────

export function OverviewPanel({
  listing,
  pricing,
  readiness,
  photoCount,
  upcomingBookings,
}: {
  listing: BookingListing
  pricing: SavedPricingProfile | null
  readiness: PublishReadiness | null
  photoCount: number
  upcomingBookings: number
}) {
  const kpis = [
    { label: "Status", value: listing.status.charAt(0).toUpperCase() + listing.status.slice(1) },
    { label: "Base rate", value: pricing ? fmtMoney(pricing.baseNightlyPence, listing.currency) + "/night" : "Not set" },
    { label: "Photos", value: String(photoCount) },
    { label: "Upcoming", value: String(upcomingBookings) + " bookings" },
  ]

  return (
    <PanelWrap title="Overview" desc="Key stats and publish readiness for this listing.">
      <div className="grid grid-cols-2 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{k.label}</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{k.value}</p>
          </div>
        ))}
      </div>

      {readiness && (
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2.5">Publish checklist</p>
          <div className="space-y-2">
            {readiness.checks.map((c) => (
              <div key={c.key} className="flex items-center gap-2.5 text-sm">
                {c.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                )}
                <span className={c.done ? "text-slate-600" : "text-slate-400"}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </PanelWrap>
  )
}

// ── 2. Content ────────────────────────────────────────────────────────────────

export function ContentPanel({ listing }: { listing: BookingListing }) {
  const router = useRouter()
  const { toast, notify } = useToast()
  const [pending, startT] = useTransition()
  const [title, setTitle] = useState(listing.title)
  const [summary, setSummary] = useState(listing.summary ?? "")
  const [description, setDescription] = useState(listing.description ?? "")

  function save() {
    startT(async () => {
      const res = await updateListing({ listingId: listing.id, title, summary, description })
      res.ok ? notify("ok", "Content saved.") : notify("err", res.error ?? "Could not save.")
      router.refresh()
    })
  }

  return (
    <>
      {toast && <Toast {...toast} />}
      <PanelWrap title="Content" desc="Title, summary and description guests will see.">
        <Field label="Listing title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Summary (1–2 sentences)">
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className={cn(inputCls, "h-auto py-2.5 resize-none")} />
        </Field>
        <Field label="Full description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className={cn(inputCls, "h-auto py-2.5 resize-none")} />
        </Field>
        <SaveBar onSave={save} pending={pending} />
      </PanelWrap>
    </>
  )
}

// ── 3. Media ──────────────────────────────────────────────────────────────────

export function MediaPanel({
  listingId,
  photos,
}: {
  listingId: string
  photos: ListingPhoto[]
}) {
  return (
    <PanelWrap title="Media" desc="Upload and manage photos. The first photo marked as cover will appear in cards.">
      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
          <ImageIcon className="w-7 h-7 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No photos yet.</p>
          <p className="text-[12px] text-slate-400 mt-1">
            At least one photo is required before you can publish.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100">
              {p.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.url} alt={p.caption ?? ""} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                </div>
              )}
              {p.isCover && (
                <span className="absolute top-2 left-2 text-[10px] font-semibold bg-emerald-600 text-white px-1.5 py-0.5 rounded-md">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] transition-colors"
          onClick={() => {/* Upload handled via /api/uploads/r2 */}}
        >
          <Plus className="w-4 h-4" />
          Upload photos
        </button>
        <p className="text-[12px] text-slate-400">
          Connects to your workspace R2 media store.
        </p>
      </div>
    </PanelWrap>
  )
}

// ── 4. Rooms ──────────────────────────────────────────────────────────────────

export function RoomsPanel({ listing }: { listing: BookingListing }) {
  const router = useRouter()
  const { toast, notify } = useToast()
  const [pending, startT] = useTransition()
  const [maxGuests, setMaxGuests] = useState(listing.maxGuests)
  const [bedrooms, setBedrooms] = useState(listing.bedrooms)
  const [beds, setBeds] = useState(listing.beds)
  const [bathrooms, setBathrooms] = useState(listing.bathrooms)

  function save() {
    startT(async () => {
      const res = await updateListing({ listingId: listing.id, maxGuests, bedrooms, beds, bathrooms })
      res.ok ? notify("ok", "Rooms saved.") : notify("err", res.error ?? "Could not save.")
      router.refresh()
    })
  }

  return (
    <>
      {toast && <Toast {...toast} />}
      <PanelWrap title="Rooms & capacity" desc="How many people can stay and what the space provides.">
        <div className="grid grid-cols-2 gap-6">
          {[
            { label: "Max guests", val: maxGuests, set: setMaxGuests, min: 1 },
            { label: "Bedrooms", val: bedrooms, set: setBedrooms, min: 0 },
            { label: "Beds", val: beds, set: setBeds, min: 0 },
          ].map(({ label, val, set, min }) => (
            <Field key={label} label={label}>
              <NumberStepper value={val} onChange={set} min={min} />
            </Field>
          ))}
          <Field label="Bathrooms">
            <NumberStepper value={bathrooms} onChange={setBathrooms} min={0} step={0.5} />
          </Field>
        </div>
        <SaveBar onSave={save} pending={pending} />
      </PanelWrap>
    </>
  )
}

// ── 5. Amenities ──────────────────────────────────────────────────────────────

const CORE_AMENITIES = [
  "wifi", "parking", "kitchen", "washer", "dryer", "heating", "air_conditioning",
  "tv", "workspace", "self_checkin", "smoke_alarm", "first_aid", "pets_allowed", "lift",
  "pool", "hot_tub", "gym", "bbq", "garden", "ev_charger", "cot", "wheelchair_access",
]

export function AmenitiesPanel({
  listing,
  amenityCatalogue,
  selectedAmenitySlugs,
}: {
  listing: BookingListing
  amenityCatalogue: CatalogueAmenity[]
  selectedAmenitySlugs: string[]
}) {
  const router = useRouter()
  const { toast, notify } = useToast()
  const [pending, startT] = useTransition()

  const catalogueSlugs = amenityCatalogue.map((a) => a.slug)
  const displaySlugs = catalogueSlugs.length > 0 ? catalogueSlugs : CORE_AMENITIES
  const [selected, setSelected] = useState<string[]>(
    selectedAmenitySlugs.length > 0
      ? selectedAmenitySlugs
      : Array.isArray(listing.amenities)
      ? (listing.amenities as string[])
      : []
  )

  function toggle(slug: string) {
    setSelected((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug])
  }

  function save() {
    startT(async () => {
      const res = await updateListing({ listingId: listing.id, amenities: selected })
      res.ok ? notify("ok", "Amenities saved.") : notify("err", res.error ?? "Could not save.")
      router.refresh()
    })
  }

  // Group by category if catalogue available
  const groups: Record<string, CatalogueAmenity[]> = {}
  if (amenityCatalogue.length > 0) {
    for (const a of amenityCatalogue) {
      if (!groups[a.category]) groups[a.category] = []
      groups[a.category].push(a)
    }
  }

  return (
    <>
      {toast && <Toast {...toast} />}
      <PanelWrap title="Amenities" desc="Select everything guests have access to.">
        {amenityCatalogue.length > 0 ? (
          Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 capitalize">{group}</p>
              <div className="flex flex-wrap gap-2">
                {items.map((a) => {
                  const on = selected.includes(a.slug)
                  return (
                    <button
                      key={a.slug}
                      type="button"
                      onClick={() => toggle(a.slug)}
                      className={cn(
                        "h-9 px-3 rounded-lg text-[12.5px] font-medium transition-colors",
                        on ? "bg-[var(--brand)] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {a.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-wrap gap-2">
            {displaySlugs.map((slug) => {
              const on = selected.includes(slug)
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => toggle(slug)}
                  className={cn(
                    "h-9 px-3 rounded-lg text-[12.5px] font-medium capitalize transition-colors",
                    on ? "bg-[var(--brand)] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {slug.replace(/_/g, " ")}
                </button>
              )
            })}
          </div>
        )}
        <p className="text-[11px] text-slate-400">{selected.length} selected</p>
        <SaveBar onSave={save} pending={pending} />
      </PanelWrap>
    </>
  )
}

// ── 6. Pricing ────────────────────────────────────────────────────────────────

export function PricingPanel({
  listing,
  pricing,
}: {
  listing: BookingListing
  pricing: SavedPricingProfile | null
}) {
  const router = useRouter()
  const { toast, notify } = useToast()
  const [pending, startT] = useTransition()

  const [basePrice, setBasePrice] = useState(pricing ? String(pricing.baseNightlyPence / 100) : "")
  const [weekendPrice, setWeekendPrice] = useState(pricing?.weekendPence != null ? String(pricing.weekendPence / 100) : "")
  const [minNights, setMinNights] = useState(pricing?.minNights ?? 1)
  const [maxNights, setMaxNights] = useState(pricing?.maxNights ? String(pricing.maxNights) : "")
  const [weeklyDiscount, setWeeklyDiscount] = useState(pricing?.weeklyDiscountPct ?? 0)
  const [monthlyDiscount, setMonthlyDiscount] = useState(pricing?.monthlyDiscountPct ?? 0)

  function save() {
    const base = Math.round(parseFloat(basePrice || "0") * 100)
    if (!Number.isFinite(base) || base <= 0) { notify("err", "Enter a valid base nightly price."); return }
    startT(async () => {
      const res = await savePricingProfile({
        listingId: listing.id,
        baseNightlyPence: base,
        weekendPence: weekendPrice.trim() === "" ? null : Math.round(parseFloat(weekendPrice) * 100),
        weeklyDiscountPct: weeklyDiscount,
        monthlyDiscountPct: monthlyDiscount,
        minNights,
        maxNights: maxNights.trim() === "" ? null : parseInt(maxNights, 10),
      })
      res.ok ? notify("ok", "Pricing saved.") : notify("err", res.error ?? "Could not save pricing.")
      router.refresh()
    })
  }

  return (
    <>
      {toast && <Toast {...toast} />}
      <PanelWrap title="Pricing" desc="Base nightly rate and dynamic pricing rules.">
        <div className="grid grid-cols-2 gap-4">
          <Field label={`Base nightly (${listing.currency})`}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currencySymbol(listing.currency)}</span>
              <input value={basePrice} onChange={(e) => setBasePrice(e.target.value)} type="number" min="0" className={cn(inputCls, "pl-7")} />
            </div>
          </Field>
          <Field label={`Weekend nightly (${listing.currency})`}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currencySymbol(listing.currency)}</span>
              <input value={weekendPrice} onChange={(e) => setWeekendPrice(e.target.value)} type="number" min="0" placeholder="optional" className={cn(inputCls, "pl-7")} />
            </div>
          </Field>
          <Field label="Min nights">
            <NumberStepper value={minNights} onChange={setMinNights} min={1} />
          </Field>
          <Field label="Max nights (blank = unlimited)">
            <input value={maxNights} onChange={(e) => setMaxNights(e.target.value)} type="number" min="1" placeholder="unlimited" className={inputCls} />
          </Field>
          <Field label="Weekly discount %">
            <NumberStepper value={weeklyDiscount} onChange={setWeeklyDiscount} min={0} max={100} />
          </Field>
          <Field label="Monthly discount %">
            <NumberStepper value={monthlyDiscount} onChange={setMonthlyDiscount} min={0} max={100} />
          </Field>
        </div>
        <SaveBar onSave={save} pending={pending} />
      </PanelWrap>
    </>
  )
}

// ── 7. Availability ───────────────────────────────────────────────────────────

export function AvailabilityPanel({ listingId }: { listingId: string }) {
  const router = useRouter()
  const { toast, notify } = useToast()
  const [pending, startT] = useTransition()

  function openWindow() {
    startT(async () => {
      const start = new Date()
      const monthStart = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`
      const res = await openAvailabilityWindow(listingId, monthStart, 180)
      res.ok ? notify("ok", `Opened ${res.data?.count ?? 0} days.`) : notify("err", res.error ?? "Could not open availability.")
      router.refresh()
    })
  }

  return (
    <>
      {toast && <Toast {...toast} />}
      <PanelWrap title="Availability" desc="Set open dates and block periods. Fine-tune in the booking calendar.">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openWindow}
            disabled={pending}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] disabled:opacity-60 transition-colors"
          >
            <CalendarRange className="w-4 h-4" />
            {pending ? "Opening…" : "Open next 180 days"}
          </button>
          <Link
            href={`/property-manager/bookings/calendar?listing=${listingId}`}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Open calendar
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3.5">
          <p className="text-[12px] text-slate-500 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
            Opening availability sets days to &quot;available&quot; in the booking grid. Block individual dates or ranges in the booking calendar.
          </p>
        </div>
      </PanelWrap>
    </>
  )
}

// ── 8. Fees ───────────────────────────────────────────────────────────────────

export function FeesPanel({
  listing,
  pricing,
}: {
  listing: BookingListing
  pricing: SavedPricingProfile | null
}) {
  const router = useRouter()
  const { toast, notify } = useToast()
  const [pending, startT] = useTransition()

  const [cleaningFee, setCleaningFee] = useState(pricing ? String(pricing.cleaningFeePence / 100) : "")
  const [extraGuestFee, setExtraGuestFee] = useState(pricing ? String(pricing.extraGuestFeePence / 100) : "")
  const [extraGuestAfter, setExtraGuestAfter] = useState(pricing?.extraGuestAfter ?? 2)
  const [deposit, setDeposit] = useState(pricing ? String(pricing.securityDepositPence / 100) : "")

  function save() {
    startT(async () => {
      const res = await savePricingProfile({
        listingId: listing.id,
        baseNightlyPence: pricing?.baseNightlyPence ?? 0,
        cleaningFeePence: cleaningFee.trim() === "" ? 0 : Math.round(parseFloat(cleaningFee) * 100),
        extraGuestFeePence: extraGuestFee.trim() === "" ? 0 : Math.round(parseFloat(extraGuestFee) * 100),
        extraGuestAfter,
        securityDepositPence: deposit.trim() === "" ? 0 : Math.round(parseFloat(deposit) * 100),
      })
      res.ok ? notify("ok", "Fees saved.") : notify("err", res.error ?? "Could not save fees.")
      router.refresh()
    })
  }

  const feeRows = [
    { label: "Cleaning fee", val: cleaningFee, set: setCleaningFee, hint: "Per stay" },
    { label: "Extra guest fee", val: extraGuestFee, set: setExtraGuestFee, hint: `Applies after ${extraGuestAfter} guest(s)` },
    { label: "Security deposit", val: deposit, set: setDeposit, hint: "Held, not charged" },
  ]

  return (
    <>
      {toast && <Toast {...toast} />}
      <PanelWrap title="Fees & deposit" desc="Per-stay fees and the security deposit amount.">
        <div className="grid grid-cols-2 gap-4">
          {feeRows.map(({ label, val, set, hint }) => (
            <Field key={label} label={`${label} (${listing.currency})`}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currencySymbol(listing.currency)}</span>
                <input
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  type="number"
                  min="0"
                  placeholder="0"
                  className={cn(inputCls, "pl-7")}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{hint}</p>
            </Field>
          ))}
          <Field label="Extra guest threshold">
            <NumberStepper value={extraGuestAfter} onChange={setExtraGuestAfter} min={1} />
            <p className="text-[11px] text-slate-400 mt-1">Fee applies after this many guests</p>
          </Field>
        </div>
        <SaveBar onSave={save} pending={pending} />
      </PanelWrap>
    </>
  )
}

// ── 9. Rules ──────────────────────────────────────────────────────────────────

const CANCELLATION_POLICIES = [
  { value: "flexible", label: "Flexible", desc: "Full refund up to 24h before check-in." },
  { value: "moderate", label: "Moderate", desc: "Full refund up to 5 days before check-in." },
  { value: "strict", label: "Strict", desc: "50% refund up to 1 week before check-in." },
  { value: "non_refundable", label: "Non-refundable", desc: "No refunds after booking." },
]

export function RulesPanel({ listing }: { listing: BookingListing }) {
  const router = useRouter()
  const { toast, notify } = useToast()
  const [pending, startT] = useTransition()
  const [policy, setPolicy] = useState(listing.cancellationPolicy)
  const [checkInWindow, setCheckInWindow] = useState(listing.checkInWindow ?? "")
  const [checkoutTime, setCheckoutTime] = useState(listing.checkoutTime ?? "")

  const rules = (listing.houseRules as Record<string, unknown>) ?? {}
  const [smoking, setSmoking] = useState(Boolean(rules.smoking_allowed))
  const [pets, setPets] = useState(Boolean(rules.pets_allowed))
  const [parties, setParties] = useState(Boolean(rules.parties_allowed))
  const [quietHours, setQuietHours] = useState((rules.quiet_hours as string) ?? "")

  function save() {
    startT(async () => {
      const houseRules = {
        smoking_allowed: smoking,
        pets_allowed: pets,
        parties_allowed: parties,
        quiet_hours: quietHours || null,
      }
      const res = await updateListing({
        listingId: listing.id,
        cancellationPolicy: policy as never,
        checkInWindow: checkInWindow || null,
        checkoutTime: checkoutTime || null,
        houseRules,
      })
      res.ok ? notify("ok", "Rules saved.") : notify("err", res.error ?? "Could not save.")
      router.refresh()
    })
  }

  return (
    <>
      {toast && <Toast {...toast} />}
      <PanelWrap title="House rules & policies" desc="Cancellation policy, timing and house rules.">
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2">Cancellation policy</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {CANCELLATION_POLICIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPolicy(p.value as never)}
                className={cn(
                  "text-left p-3.5 rounded-xl border text-sm transition-colors",
                  policy === p.value
                    ? "border-[var(--brand)] bg-[var(--brand-soft)]/50 text-[var(--brand)]"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                <p className="font-semibold">{p.label}</p>
                <p className="text-[12px] text-slate-500 mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Check-in window">
            <input value={checkInWindow} onChange={(e) => setCheckInWindow(e.target.value)} placeholder="15:00–21:00" className={inputCls} />
          </Field>
          <Field label="Check-out time">
            <input value={checkoutTime} onChange={(e) => setCheckoutTime(e.target.value)} placeholder="10:00" className={inputCls} />
          </Field>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2">House rules</p>
          <div className="space-y-2">
            {[
              { label: "Smoking allowed", val: smoking, set: setSmoking },
              { label: "Pets allowed", val: pets, set: setPets },
              { label: "Parties/events allowed", val: parties, set: setParties },
            ].map(({ label, val, set }) => (
              <label key={label} className="flex items-center gap-3 cursor-pointer">
                <div
                  role="checkbox"
                  aria-checked={val}
                  onClick={() => set(!val)}
                  className={cn(
                    "w-10 h-6 rounded-full relative transition-colors cursor-pointer",
                    val ? "bg-[var(--brand)]" : "bg-slate-200"
                  )}
                >
                  <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform", val ? "translate-x-5" : "translate-x-1")} />
                </div>
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <Field label="Quiet hours">
          <input value={quietHours} onChange={(e) => setQuietHours(e.target.value)} placeholder="e.g. 22:00–08:00" className={inputCls} />
        </Field>
        <SaveBar onSave={save} pending={pending} />
      </PanelWrap>
    </>
  )
}

// ── 10. Check-in ──────────────────────────────────────────────────────────────

export function CheckInPanel({
  listing,
  keylessLock,
}: {
  listing: BookingListing
  keylessLock: KeylessLock | null
}) {
  return (
    <PanelWrap title="Check-in" desc="Access method, keyless codes and arrival instructions.">
      {keylessLock ? (
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 space-y-2">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[var(--brand)]" />
            <span className="text-sm font-semibold text-slate-800">
              {keylessLock.provider.replace(/_/g, " ")}
            </span>
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", keylessLock.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
              {keylessLock.active ? "Active" : "Inactive"}
            </span>
          </div>
          {keylessLock.instructions && (
            <p className="text-[12.5px] text-slate-600">{keylessLock.instructions}</p>
          )}
          {keylessLock.hasStaticCode && (
            <p className="text-[11px] text-slate-400">Static code configured. Per-booking PINs generated from this base.</p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
          <KeyRound className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No access method configured yet.</p>
          <p className="text-[12px] text-slate-400 mt-0.5">Configure via the Accommodation tab or the check-in wizard.</p>
        </div>
      )}
      <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3.5">
        <p className="text-[12px] text-slate-500 flex items-start gap-2">
          <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
          Access codes are only released after payment and confirmation. Every release is audited.
        </p>
      </div>
    </PanelWrap>
  )
}

// ── 11. Compliance ────────────────────────────────────────────────────────────

export function CompliancePanel({ listing }: { listing: BookingListing }) {
  return (
    <PanelWrap title="Compliance" desc="Safety certificates, licensing and legal requirements for this listing.">
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-4 space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Compliance status</span>
          <span className={cn(
            "font-semibold px-2.5 py-1 rounded-full text-[11px]",
            listing.complianceStatus === "passed" ? "bg-emerald-50 text-emerald-700" :
            listing.complianceStatus === "flagged" ? "bg-red-50 text-red-700" :
            "bg-amber-50 text-amber-700"
          )}>
            {listing.complianceStatus.charAt(0).toUpperCase() + listing.complianceStatus.slice(1)}
          </span>
        </div>
      </div>
      <p className="text-[12px] text-slate-400 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0" />
        Safety certificates, EPC rating, gas/electric certs and licensing are managed in the Compliance section.
      </p>
      <Link
        href="/property-manager/compliance"
        className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
      >
        Go to Compliance
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </PanelWrap>
  )
}

// ── 12. Channels ──────────────────────────────────────────────────────────────

export function ChannelsPanel({ listingId, listingTitle }: { listingId: string; listingTitle: string }) {
  return (
    <PanelWrap title="Channel sync" desc="Connect external calendars via iCal to prevent double-bookings.">
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
        <p className="text-sm text-slate-600">
          Manage channel sync for this listing in the dedicated channel sync page.
        </p>
      </div>
      <Link
        href={`/property-manager/bookings/listings/${listingId}/channels`}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] transition-colors"
      >
        Open channel sync
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </PanelWrap>
  )
}

// ── 13. Bookings ──────────────────────────────────────────────────────────────

export function BookingsPanel({
  listingId,
  bookings,
}: {
  listingId: string
  bookings: BookingRow[]
}) {
  const upcoming = bookings
    .filter((b) => b.status !== "cancelled" && b.checkIn && b.checkIn >= new Date().toISOString().slice(0, 10))
    .slice(0, 20)
  const past = bookings
    .filter((b) => b.checkOut && b.checkOut < new Date().toISOString().slice(0, 10))
    .slice(0, 10)

  if (bookings.length === 0) {
    return (
      <PanelWrap title="Bookings" desc="Upcoming and past reservations for this listing.">
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
          <p className="text-sm text-slate-500">No reservations yet.</p>
        </div>
      </PanelWrap>
    )
  }

  return (
    <PanelWrap title="Bookings" desc="Upcoming and past reservations for this listing.">
      {upcoming.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Upcoming</p>
          <div className="space-y-2">
            {upcoming.map((b) => (
              <Link
                key={b.id}
                href={`/property-manager/bookings/${b.id}`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{b.guestName}</p>
                  <p className="text-[12px] text-slate-500">
                    {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)} · {b.nights} nights
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-700">{fmtMoney(b.totalPence, b.currency)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Past</p>
          <div className="space-y-2">
            {past.map((b) => (
              <Link
                key={b.id}
                href={`/property-manager/bookings/${b.id}`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors opacity-70"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">{b.guestName}</p>
                  <p className="text-[12px] text-slate-400">
                    {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                  </p>
                </div>
                <span className="text-sm text-slate-500">{fmtMoney(b.totalPence, b.currency)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </PanelWrap>
  )
}

// ── 14. Messages ──────────────────────────────────────────────────────────────

export function MessagesPanel({ listingId }: { listingId: string }) {
  return (
    <PanelWrap title="Messages" desc="Guest threads associated with this listing.">
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
        <p className="text-sm text-slate-500">Guest messaging threads will appear here.</p>
        <p className="text-[12px] text-slate-400 mt-1">Messages are sent from the Reservations section.</p>
      </div>
      <Link
        href="/property-manager/bookings/reservations"
        className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
      >
        Go to Reservations
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </PanelWrap>
  )
}

// ── 15. Reviews ───────────────────────────────────────────────────────────────

export function ReviewsPanel({ listingId }: { listingId: string }) {
  return (
    <PanelWrap title="Reviews" desc="Guest reviews for this listing and your host replies.">
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
        <Star className="w-6 h-6 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No reviews yet.</p>
        <p className="text-[12px] text-slate-400 mt-1">Reviews unlock after a guest checks out.</p>
      </div>
    </PanelWrap>
  )
}

// ── 16. Performance ───────────────────────────────────────────────────────────

export function PerformancePanel({
  listingId,
  currency,
}: {
  listingId: string
  currency: string
}) {
  return (
    <PanelWrap title="Performance" desc="Occupancy, revenue and average nightly rate trends.">
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 py-12 flex flex-col items-center text-center">
        <p className="text-sm font-medium text-slate-500">Performance charts load once reservations are recorded.</p>
        <p className="text-[12px] text-slate-400 mt-1">Occupancy %, ADR and RevPAR will appear here.</p>
      </div>
    </PanelWrap>
  )
}

// ── 17. AI Optimiser ──────────────────────────────────────────────────────────

export function AIOptimiserPanel({ listingId, listing }: { listingId: string; listing: BookingListing }) {
  return (
    <PanelWrap title="AI Optimiser" desc="Copilot suggestions for title, description and pricing.">
      <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-[var(--brand-soft)]/50 to-slate-50 px-5 py-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-[var(--brand)] flex items-center justify-center">
            <span className="text-white text-[11px] font-bold">AI</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">Propvora Copilot</p>
        </div>
        <p className="text-sm text-slate-600">
          Ask the AI to review your listing title, description or pricing and get specific improvement suggestions.
        </p>
      </div>
      <Link
        href={`/property-manager/copilot?context=listing&listingId=${listingId}`}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] transition-colors"
      >
        Open AI Copilot
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </PanelWrap>
  )
}

// ── 18. Settings ──────────────────────────────────────────────────────────────

export function SettingsPanel({ listing }: { listing: BookingListing }) {
  const router = useRouter()
  const { toast, notify } = useToast()
  const [pending, startT] = useTransition()
  const [bookingMode, setBookingMode] = useState(listing.bookingMode)
  const [slug, setSlug] = useState(listing.slug ?? "")

  function save() {
    startT(async () => {
      const res = await updateListing({ listingId: listing.id, bookingMode: bookingMode as never })
      res.ok ? notify("ok", "Settings saved.") : notify("err", res.error ?? "Could not save.")
      router.refresh()
    })
  }

  function doPause() {
    startT(async () => {
      const res = await pauseListing(listing.id)
      res.ok ? notify("ok", "Listing paused.") : notify("err", res.error ?? "Could not pause.")
      router.refresh()
    })
  }

  function doPublish() {
    startT(async () => {
      const res = await publishListing(listing.id)
      res.ok ? notify("ok", "Listing published.") : notify("err", res.error ?? "Could not publish. Check the publish checklist.")
      router.refresh()
    })
  }

  return (
    <>
      {toast && <Toast {...toast} />}
      <PanelWrap title="Settings" desc="Booking mode, slug and lifecycle actions.">
        <Field label="Booking mode">
          <div className="flex gap-2">
            {(["instant", "request", "enquiry"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setBookingMode(m)}
                className={cn(
                  "flex-1 h-10 rounded-xl text-sm font-medium capitalize transition-colors",
                  bookingMode === m ? "bg-[var(--brand)] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </Field>
        <Field label="URL slug">
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. garden-studio-central" className={inputCls} readOnly />
          <p className="text-[11px] text-slate-400 mt-1">Slug is set on creation. Contact support to change it.</p>
        </Field>
        <SaveBar onSave={save} pending={pending} label="Save settings" />
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Listing actions</p>
          <div className="flex flex-wrap gap-2">
            {listing.status !== "published" && (
              <button
                type="button"
                onClick={doPublish}
                disabled={pending}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
              >
                <Rocket className="w-4 h-4" />
                Publish
              </button>
            )}
            {listing.status === "published" && (
              <button
                type="button"
                onClick={doPause}
                disabled={pending}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 disabled:opacity-60 transition-colors"
              >
                Pause listing
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={async () => {
                startT(async () => {
                  const res = await updateListing({ listingId: listing.id, status: "archived" })
                  res.ok ? notify("ok", "Listing archived.") : notify("err", res.error ?? "Could not archive.")
                  router.refresh()
                })
              }}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 disabled:opacity-60 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Archive listing
            </button>
          </div>
        </div>
      </PanelWrap>
    </>
  )
}

// ── 19. Activity ──────────────────────────────────────────────────────────────

export function ActivityPanel({ listingId }: { listingId: string }) {
  return (
    <PanelWrap title="Activity" desc="Audit log of changes to this listing.">
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
        <p className="text-sm text-slate-500">Activity log entries will appear here.</p>
        <p className="text-[12px] text-slate-400 mt-1">
          Every field save, publish and status change is recorded.
        </p>
      </div>
    </PanelWrap>
  )
}
