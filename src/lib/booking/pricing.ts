// ============================================================================
// Booking pricing — PURE, integer-pence stay quoting. No DB, no async; the
// unit-testable core that mirrors the server-side recompute inside the
// `create_public_reservation` SECURITY DEFINER function (see migration
// 20260616080000_booking_reservations.sql). Keep the two in lock-step: the DB
// is authoritative for anon checkout, this module is the same maths in TS for
// quotes/previews and the authed operator path.
//
// Weekend uplift applies to Friday (dow 5) and Saturday (dow 6) NIGHTS.
// ============================================================================

import { calculateMarketplaceFee, type FeeBreakdown } from "@/lib/marketplace/fees"
import type { SupabaseClient } from "@supabase/supabase-js"

/** Inputs to {@link quoteStay}. All money is integer pence. */
export interface QuoteStayArgs {
  /** Number of nights (check_out − check_in). Must be >= 1. */
  nights: number
  /** Base nightly rate in integer pence. */
  nightlyRatePence: number
  /** Optional weekend uplift percent (e.g. 15 = +15% on Fri/Sat nights). */
  weekendUpliftPct?: number | null
  /** Check-in date (ISO yyyy-mm-dd or Date). Drives weekend-night detection. */
  checkIn: string | Date
}

/** Per-night line in a quote breakdown. */
export interface QuoteNight {
  /** ISO yyyy-mm-dd of the night. */
  date: string
  /** Whether the weekend uplift was applied to this night. */
  weekend: boolean
  /** Price for this night in integer pence. */
  pricePence: number
}

/** Result of {@link quoteStay}. */
export interface StayQuote {
  nights: number
  subtotalPence: number
  breakdown: QuoteNight[]
}

/** Result of {@link quoteStayWithFees}: a stay quote folded with marketplace fees. */
export interface StayQuoteWithFees extends StayQuote {
  /** Platform/provider fee breakdown for the stay (transactionType='stay_booking'). */
  fees: FeeBreakdown
  /** Subtotal + nothing extra here; fees are taken from the gross, not added. */
  totalPence: number
}

function toDate(d: string | Date): Date {
  if (d instanceof Date) return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  // Parse yyyy-mm-dd as UTC midnight to keep dow stable across timezones.
  const [y, m, day] = d.split("-").map(Number)
  return new Date(Date.UTC(y, (m ?? 1) - 1, day ?? 1))
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function roundPence(value: number): number {
  return Math.round(value)
}

/**
 * Quote a stay purely from nights + nightly rate (+ optional weekend uplift).
 * Returns the integer-pence subtotal and a per-night breakdown. Friday and
 * Saturday nights receive the uplift when `weekendUpliftPct` is a positive
 * number. Defensive: nights is clamped to >= 0 and the rate to >= 0.
 */
export function quoteStay(args: QuoteStayArgs): StayQuote {
  const nights = Math.max(0, Math.trunc(args.nights))
  const nightly = Math.max(0, Math.trunc(args.nightlyRatePence))
  const uplift =
    typeof args.weekendUpliftPct === "number" && args.weekendUpliftPct > 0
      ? args.weekendUpliftPct
      : 0

  const start = toDate(args.checkIn)
  const breakdown: QuoteNight[] = []
  let subtotalPence = 0

  for (let i = 0; i < nights; i++) {
    const night = new Date(start)
    night.setUTCDate(start.getUTCDate() + i)
    const dow = night.getUTCDay() // 0=Sun .. 6=Sat
    const weekend = uplift > 0 && (dow === 5 || dow === 6)
    const pricePence = weekend ? roundPence(nightly * (1 + uplift / 100)) : nightly
    subtotalPence += pricePence
    breakdown.push({ date: isoDay(night), weekend, pricePence })
  }

  return { nights, subtotalPence, breakdown }
}

/** Inputs to {@link quoteStayWithFees}. */
export interface QuoteStayWithFeesArgs extends QuoteStayArgs {
  /** RLS-scoped client (optional — omit to resolve fees from the fallback). */
  supabase?: SupabaseClient
  /** ISO 3166-1 alpha-2 country of the transaction, default "GB". */
  countryCode?: string
  /** Operator plan tier, if the fee rules discriminate on it. */
  planTier?: string
  /** Payment-provider fee in pence already computed by the caller (default 0). */
  providerFeePence?: number
}

/**
 * Quote a stay AND fold in the marketplace fee engine
 * (transactionType='stay_booking'). The subtotal is the gross the fee is taken
 * from; `totalPence` equals the subtotal (fees are a deduction from the seller
 * payout, not an add-on to the guest), and `fees` carries the full breakdown.
 * 42P01/empty tolerant via {@link calculateMarketplaceFee}.
 */
export async function quoteStayWithFees(
  args: QuoteStayWithFeesArgs
): Promise<StayQuoteWithFees> {
  const quote = quoteStay(args)
  const fees = await calculateMarketplaceFee({
    supabase: args.supabase,
    countryCode: args.countryCode ?? "GB",
    transactionType: "stay_booking",
    planTier: args.planTier,
    grossPence: quote.subtotalPence,
    providerFeePence: args.providerFeePence ?? 0,
  })
  return { ...quote, fees, totalPence: quote.subtotalPence }
}
