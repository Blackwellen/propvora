// ============================================================================
// Public direct-booking — shared, server-only quote/validation helpers used by
// the quote + reserve routes. This is the single place the price is RECOMPUTED
// on the server; the client total is NEVER trusted. All money is integer pence.
//
// Everything here is defensive: it reads listings with the request's anon-keyed
// client (RLS is the boundary) and tolerates a not-yet-provisioned booking
// schema. It prefers the sibling-owned `@/lib/booking/pricing` lib if present,
// otherwise computes a transparent fallback breakdown from the listing's base
// nightly price so a quote can always be returned for a published listing.
// ============================================================================

import type { createClient } from "@/lib/supabase/server"

type SupabaseLike = Awaited<ReturnType<typeof createClient>>

export const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204"])
export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const MS_PER_DAY = 86_400_000
const MAX_NIGHTS = 365
const MAX_GUESTS = 50

export function isMissing(code: string | null | undefined): boolean {
  return Boolean(code && NOT_PROVISIONED.has(code))
}

/** A published stay-booking listing, as needed for pricing. */
export interface PublicListing {
  id: string
  workspace_id: string | null
  title: string | null
  description: string | null
  status: string | null
  transaction_type: string | null
  currency: string
  base_price_pence: number | null
  // Legacy/alt price columns are tolerated when base_price_pence is absent.
  price: number | null
  price_period: string | null
  country_code: string | null
  location: string | null
  location_city: string | null
  images: string[] | null
  max_guests: number | null
  cleaning_fee_pence: number | null
}

export interface QuoteInput {
  listingId: string
  checkIn: string
  checkOut: string
  guests: number
}

export interface QuoteLineItem {
  label: string
  amountPence: number
  /** detail e.g. "£120 × 3 nights" */
  detail?: string
}

export interface QuoteBreakdown {
  listingId: string
  currency: string
  checkIn: string
  checkOut: string
  nights: number
  guests: number
  nightlyPence: number
  lineItems: QuoteLineItem[]
  /** Total the guest will be asked to pay (or hold) — recomputed server-side. */
  totalPence: number
  /** Best-effort cleaning fee, surfaced separately for clarity. */
  cleaningFeePence: number
  ready: boolean
}

/** Validation failure shape returned to the route (maps to a 400/404/503). */
export interface ValidationError {
  status: number
  error: string
}

/** Parse a yyyy-mm-dd string into a UTC midnight Date, or null. */
export function parseIsoDate(raw: unknown): Date | null {
  if (typeof raw !== "string" || !ISO_DATE.test(raw)) return null
  const d = new Date(`${raw}T00:00:00.000Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Whole nights between two UTC-midnight dates. */
export function nightsBetween(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY)
}

/**
 * Validate raw quote/reserve input. Returns either a normalised QuoteInput or a
 * ValidationError. Pure (no DB) — checks shape, date ordering, sane bounds.
 */
export function validateQuoteInput(body: unknown): QuoteInput | ValidationError {
  if (!body || typeof body !== "object") {
    return { status: 400, error: "Expected a JSON body" }
  }
  const b = body as Record<string, unknown>
  const listingId = typeof b.listingId === "string" ? b.listingId.trim() : ""
  if (!listingId) return { status: 400, error: "listingId is required" }

  const checkInDate = parseIsoDate(b.checkIn)
  const checkOutDate = parseIsoDate(b.checkOut)
  if (!checkInDate || !checkOutDate) {
    return { status: 400, error: "checkIn and checkOut must be yyyy-mm-dd dates" }
  }

  // No bookings in the past (allow today as the earliest check-in).
  const todayUtc = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z")
  if (checkInDate < todayUtc) {
    return { status: 400, error: "checkIn cannot be in the past" }
  }
  const nights = nightsBetween(checkInDate, checkOutDate)
  if (nights < 1) return { status: 400, error: "checkOut must be after checkIn" }
  if (nights > MAX_NIGHTS) {
    return { status: 400, error: `stay too long (max ${MAX_NIGHTS} nights)` }
  }

  const guestsRaw = Number(b.guests ?? 1)
  const guests = Number.isFinite(guestsRaw) ? Math.trunc(guestsRaw) : 1
  if (guests < 1 || guests > MAX_GUESTS) {
    return { status: 400, error: "guests must be between 1 and " + MAX_GUESTS }
  }

  return {
    listingId,
    checkIn: checkInDate.toISOString().slice(0, 10),
    checkOut: checkOutDate.toISOString().slice(0, 10),
    guests,
  }
}

/** Coerce an arbitrary number-ish value to integer pence (or null). */
function toPence(value: unknown): number | null {
  if (value == null) return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return Math.trunc(n)
}

/**
 * Load a listing and assert it is a PUBLISHED stay_booking listing. Returns the
 * listing, a ValidationError (404/503), so callers can branch. Reads with the
 * anon client — RLS permits published reads.
 */
export async function loadPublishedStayListing(
  supabase: SupabaseLike,
  listingId: string
): Promise<{ listing: PublicListing } | ValidationError> {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle()

  if (error) {
    if (isMissing(error.code)) {
      return { status: 503, error: "Booking is not available yet." }
    }
    throw error
  }
  const r = (data ?? null) as Record<string, unknown> | null
  if (!r || r.status !== "published" || r.transaction_type !== "stay_booking") {
    // Do not leak existence of a non-public listing.
    return { status: 404, error: "Listing not found" }
  }

  // base_price_pence (new commerce schema) is preferred; fall back to a numeric
  // `price` (legacy schema) interpreted as a major-unit nightly rate.
  let basePence = toPence(r.base_price_pence)
  if (basePence == null && r.price != null) {
    const major = Number(r.price)
    basePence = Number.isFinite(major) ? Math.round(major * 100) : null
  }

  const images = Array.isArray(r.images)
    ? (r.images as unknown[]).filter((x): x is string => typeof x === "string")
    : null

  const listing: PublicListing = {
    id: String(r.id),
    workspace_id: (r.workspace_id as string | null) ?? null,
    title: (r.title as string | null) ?? null,
    description: (r.description as string | null) ?? null,
    status: (r.status as string | null) ?? null,
    transaction_type: (r.transaction_type as string | null) ?? null,
    currency: (r.currency as string | null) ?? "GBP",
    base_price_pence: basePence,
    price: r.price != null ? Number(r.price) : null,
    price_period: (r.price_period as string | null) ?? null,
    country_code: (r.country_code as string | null) ?? null,
    location: (r.location as string | null) ?? null,
    location_city: (r.location_city as string | null) ?? null,
    images,
    max_guests: r.max_guests != null ? Number(r.max_guests) : null,
    cleaning_fee_pence: toPence(r.cleaning_fee_pence),
  }
  return { listing }
}

/** Tolerantly load the sibling booking pricing lib. Returns null when absent. */
async function loadPricingLib(): Promise<{
  quoteStay?: (
    supabase: SupabaseLike,
    args: QuoteInput & { listing: PublicListing }
  ) => Promise<QuoteBreakdown>
} | null> {
  try {
    // @ts-ignore — provided by a sibling agent; may be absent on this branch.
    return (await import("@/lib/booking/pricing")) as never
  } catch {
    return null
  }
}

/**
 * RECOMPUTE the price for a validated quote. Prefers the sibling pricing lib;
 * otherwise computes a transparent fallback: nightly × nights (+ cleaning fee).
 * The returned total is authoritative — routes must use THIS, never a client
 * value. Throws only on unexpected DB errors; missing-schema degrades to the
 * fallback so a published listing can always be quoted.
 */
export async function computeQuote(
  supabase: SupabaseLike,
  input: QuoteInput,
  listing: PublicListing
): Promise<QuoteBreakdown> {
  const checkIn = parseIsoDate(input.checkIn)!
  const checkOut = parseIsoDate(input.checkOut)!
  const nights = nightsBetween(checkIn, checkOut)

  const lib = await loadPricingLib()
  if (lib?.quoteStay) {
    try {
      const q = await lib.quoteStay(supabase, { ...input, listing })
      // Trust the lib's recomputed total but guarantee the contract shape.
      return {
        listingId: listing.id,
        currency: q.currency ?? listing.currency,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        nights: q.nights ?? nights,
        guests: input.guests,
        nightlyPence: q.nightlyPence ?? listing.base_price_pence ?? 0,
        lineItems: q.lineItems ?? [],
        totalPence: Math.max(0, Math.trunc(q.totalPence ?? 0)),
        cleaningFeePence: Math.max(0, Math.trunc(q.cleaningFeePence ?? 0)),
        ready: true,
      }
    } catch {
      // The reservation RPC is the AUTHORITATIVE price (it recomputes server-
      // side); this quote is only for display. So any pricing-lib failure
      // (missing table, signature drift, bad input) degrades gracefully to the
      // transparent fallback below rather than failing the whole reservation.
    }
  }

  // ── Transparent fallback pricing ──────────────────────────────────────────
  const nightlyPence = Math.max(0, listing.base_price_pence ?? 0)
  const cleaningFeePence = Math.max(0, listing.cleaning_fee_pence ?? 0)
  const accommodationPence = nightlyPence * nights

  const lineItems: QuoteLineItem[] = []
  if (nightlyPence > 0) {
    lineItems.push({
      label: "Accommodation",
      amountPence: accommodationPence,
      detail: `${formatMoney(nightlyPence, listing.currency)} × ${nights} night${
        nights === 1 ? "" : "s"
      }`,
    })
  }
  if (cleaningFeePence > 0) {
    lineItems.push({ label: "Cleaning fee", amountPence: cleaningFeePence })
  }

  const totalPence = accommodationPence + cleaningFeePence

  return {
    listingId: listing.id,
    currency: listing.currency,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nights,
    guests: input.guests,
    nightlyPence,
    lineItems,
    totalPence,
    cleaningFeePence,
    ready: nightlyPence > 0,
  }
}

/** Minimal server-side money formatter for line-item detail strings. */
export function formatMoney(pence: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
      maximumFractionDigits: 0,
    }).format(pence / 100)
  } catch {
    return `£${(pence / 100).toFixed(0)}`
  }
}
