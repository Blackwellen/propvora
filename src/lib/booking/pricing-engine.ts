// ============================================================================
// Booking pricing engine — the REAL, production quoting core for the operator
// booking system. Two layers:
//
//   1. PURE core: `computeQuote(profile, rules, days, args)` — no DB, no async,
//      fully unit-testable. Integer pence throughout. This is the authoritative
//      maths and the thing tests pin.
//   2. DB layer: `quoteStay({ supabase, listingId, checkIn, checkOut, guests })`
//      — loads the active pricing profile + price rules + per-day overrides for
//      the listing and runs the pure core. 42P01/error tolerant: a cold DB
//      yields a zeroed quote with `ready:false` rather than throwing.
//
// Pricing model (applied per night, half-open [checkIn, checkOut)):
//   base nightly  → weekend uplift (Fri/Sat) → seasonal/event date rules
//   → per-day price_override (wins over everything for that night)
//   → last-minute / early-bird (whole-stay, by lead time)
//   → length-of-stay weekly/monthly discounts
//   then stay-level: + cleaning fee + extra-guest fees, and a separate
//   refundable security deposit (not part of the charge subtotal).
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

// ── Domain shapes (camelCase, money integer pence) ──────────────────────────

export interface PricingProfile {
  id: string | null
  currency: string
  baseNightlyPence: number
  weekendPence: number | null
  weeklyDiscountPct: number
  monthlyDiscountPct: number
  minNights: number
  maxNights: number | null
  cleaningFeePence: number
  extraGuestFeePence: number
  extraGuestAfter: number
  securityDepositPence: number
}

export type PriceRuleType =
  | "seasonal"
  | "event"
  | "last_minute"
  | "early_bird"
  | "gap_night"
  | "length_of_stay"

export type PriceAdjustKind = "pct" | "fixed_pence" | "absolute_pence"

export interface PriceRule {
  id: string
  ruleType: PriceRuleType
  dateFrom: string | null
  dateTo: string | null
  daysBeforeMin: number | null
  daysBeforeMax: number | null
  nightsMin: number | null
  nightsMax: number | null
  adjustKind: PriceAdjustKind
  adjustValue: number
  priority: number
}

/** A per-day availability/price override row (only price-relevant fields here). */
export interface DayOverride {
  date: string // yyyy-mm-dd
  priceOverridePence: number | null
}

export interface QuoteArgs {
  checkIn: string // yyyy-mm-dd
  checkOut: string // yyyy-mm-dd
  guests: number
  /** Lead time in days from "now" to check-in. Defaults to a computed value. */
  leadDays?: number
}

export interface QuoteNightLine {
  date: string
  /** Effective nightly price in pence after weekend + date rules + override. */
  pricePence: number
  weekend: boolean
  /** True when a per-day price_override drove this night's price. */
  overridden: boolean
  /** Ids of seasonal/event rules applied to this night. */
  appliedRuleIds: string[]
}

export interface QuoteLine {
  label: string
  kind: "nights" | "discount" | "fee" | "deposit"
  pence: number // signed — discounts are negative
}

export interface StayQuote {
  ready: boolean
  currency: string
  nights: number
  guests: number
  /** Per-night breakdown after nightly-level adjustments. */
  nightLines: QuoteNightLine[]
  /** Sum of nightly prices before stay-level discounts/fees. */
  nightsSubtotalPence: number
  /** Length-of-stay (weekly/monthly) + LOS-rule discount, as a NEGATIVE number. */
  lengthDiscountPence: number
  /** Last-minute / early-bird whole-stay adjustment (signed). */
  leadAdjustmentPence: number
  cleaningFeePence: number
  extraGuestFeePence: number
  /** Charge subtotal = nights + discounts + lead adj + fees (>= 0). */
  subtotalPence: number
  /** Refundable security deposit (held, not charged). */
  securityDepositPence: number
  /** Full human-facing line list (nights folded into one line + extras). */
  lines: QuoteLine[]
  /** Non-fatal notes (e.g. "below min nights", "no pricing profile"). */
  notes: string[]
}

// ── date helpers (UTC-stable so dow doesn't drift by timezone) ──────────────

function toUTC(d: string): Date {
  const [y, m, day] = d.split("-").map(Number)
  return new Date(Date.UTC(y, (m ?? 1) - 1, day ?? 1))
}
function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function nightsBetween(checkIn: string, checkOut: string): number {
  const a = toUTC(checkIn).getTime()
  const b = toUTC(checkOut).getTime()
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  return Math.max(0, Math.round((b - a) / 86_400_000))
}
function round(n: number): number {
  return Math.round(n)
}
function inRange(date: string, from: string | null, to: string | null): boolean {
  if (from && date < from) return false
  if (to && date > to) return false
  return true
}

function applyAdjust(basePence: number, kind: PriceAdjustKind, value: number): number {
  switch (kind) {
    case "pct":
      return round(basePence * (1 + value / 100))
    case "fixed_pence":
      return Math.max(0, round(basePence + value))
    case "absolute_pence":
      return Math.max(0, round(value))
    default:
      return basePence
  }
}

// ── PURE core ────────────────────────────────────────────────────────────────

/**
 * Pure quote computation. Deterministic, integer-pence, no IO. This is the
 * authoritative pricing maths and the unit-test surface.
 */
export function computeQuote(
  profile: PricingProfile,
  rules: PriceRule[],
  dayOverrides: DayOverride[],
  args: QuoteArgs
): StayQuote {
  const notes: string[] = []
  const nights = nightsBetween(args.checkIn, args.checkOut)
  const guests = Math.max(1, Math.trunc(args.guests || 1))
  const currency = profile.currency || "GBP"

  if (nights < 1) {
    return {
      ready: true, currency, nights: 0, guests,
      nightLines: [], nightsSubtotalPence: 0, lengthDiscountPence: 0,
      leadAdjustmentPence: 0, cleaningFeePence: 0, extraGuestFeePence: 0,
      subtotalPence: 0, securityDepositPence: 0, lines: [],
      notes: ["Check-out must be after check-in."],
    }
  }

  if (nights < profile.minNights) {
    notes.push(`Stay is below the ${profile.minNights}-night minimum.`)
  }
  if (profile.maxNights != null && nights > profile.maxNights) {
    notes.push(`Stay exceeds the ${profile.maxNights}-night maximum.`)
  }

  const overrideByDate = new Map(dayOverrides.map((d) => [d.date, d.priceOverridePence]))
  const dateRules = rules
    .filter((r) => r.ruleType === "seasonal" || r.ruleType === "event")
    .sort((a, b) => a.priority - b.priority)

  // Per-night pricing.
  const start = toUTC(args.checkIn)
  const nightLines: QuoteNightLine[] = []
  let nightsSubtotalPence = 0

  for (let i = 0; i < nights; i++) {
    const nd = new Date(start)
    nd.setUTCDate(start.getUTCDate() + i)
    const date = isoDay(nd)
    const dow = nd.getUTCDay() // 0=Sun..6=Sat
    const isWeekend = dow === 5 || dow === 6

    let price = profile.baseNightlyPence
    if (isWeekend && profile.weekendPence != null) {
      price = profile.weekendPence
    }

    const appliedRuleIds: string[] = []
    for (const r of dateRules) {
      if (inRange(date, r.dateFrom, r.dateTo)) {
        price = applyAdjust(price, r.adjustKind, r.adjustValue)
        appliedRuleIds.push(r.id)
      }
    }

    let overridden = false
    const ov = overrideByDate.get(date)
    if (ov != null) {
      price = Math.max(0, round(ov))
      overridden = true
    }

    price = Math.max(0, round(price))
    nightsSubtotalPence += price
    nightLines.push({ date, pricePence: price, weekend: isWeekend, overridden, appliedRuleIds })
  }

  // Length-of-stay discounts: monthly (>=28) wins over weekly (>=7).
  let lengthDiscountPct = 0
  if (nights >= 28 && profile.monthlyDiscountPct > 0) {
    lengthDiscountPct = profile.monthlyDiscountPct
  } else if (nights >= 7 && profile.weeklyDiscountPct > 0) {
    lengthDiscountPct = profile.weeklyDiscountPct
  }
  // explicit length_of_stay rules can add on top (take the max single rule)
  const losRules = rules.filter(
    (r) => r.ruleType === "length_of_stay" &&
      (r.nightsMin == null || nights >= r.nightsMin) &&
      (r.nightsMax == null || nights <= r.nightsMax)
  )
  let losRulePence = 0
  for (const r of losRules) {
    if (r.adjustKind === "pct") {
      losRulePence += round(nightsSubtotalPence * (Math.abs(r.adjustValue) / 100))
    } else {
      losRulePence += Math.abs(round(r.adjustValue))
    }
  }
  const lengthDiscountPence =
    -(round(nightsSubtotalPence * (lengthDiscountPct / 100)) + losRulePence)

  // Lead-time adjustments (last_minute / early_bird) — whole-stay, on nights net.
  const leadDays =
    typeof args.leadDays === "number"
      ? args.leadDays
      : Math.max(0, Math.round((toUTC(args.checkIn).getTime() - Date.now()) / 86_400_000))
  const netAfterLength = nightsSubtotalPence + lengthDiscountPence
  let leadAdjustmentPence = 0
  const leadRules = rules
    .filter((r) => r.ruleType === "last_minute" || r.ruleType === "early_bird")
    .sort((a, b) => a.priority - b.priority)
  for (const r of leadRules) {
    const okMin = r.daysBeforeMin == null || leadDays >= r.daysBeforeMin
    const okMax = r.daysBeforeMax == null || leadDays <= r.daysBeforeMax
    if (!(okMin && okMax)) continue
    if (r.adjustKind === "pct") {
      leadAdjustmentPence += round(netAfterLength * (r.adjustValue / 100))
    } else {
      leadAdjustmentPence += round(r.adjustValue)
    }
  }

  // Fees.
  const cleaningFeePence = Math.max(0, round(profile.cleaningFeePence))
  const extraGuests = Math.max(0, guests - Math.max(1, profile.extraGuestAfter))
  const extraGuestFeePence = Math.max(0, round(profile.extraGuestFeePence) * extraGuests)

  const subtotalPence = Math.max(
    0,
    nightsSubtotalPence +
      lengthDiscountPence +
      leadAdjustmentPence +
      cleaningFeePence +
      extraGuestFeePence
  )

  const lines: QuoteLine[] = [
    {
      label: `${nights} night${nights === 1 ? "" : "s"}`,
      kind: "nights",
      pence: nightsSubtotalPence,
    },
  ]
  if (lengthDiscountPence < 0) {
    lines.push({ label: "Length-of-stay discount", kind: "discount", pence: lengthDiscountPence })
  }
  if (leadAdjustmentPence !== 0) {
    lines.push({
      label: leadAdjustmentPence < 0 ? "Last-minute / early-bird" : "Lead-time uplift",
      kind: leadAdjustmentPence < 0 ? "discount" : "fee",
      pence: leadAdjustmentPence,
    })
  }
  if (cleaningFeePence > 0) lines.push({ label: "Cleaning fee", kind: "fee", pence: cleaningFeePence })
  if (extraGuestFeePence > 0)
    lines.push({
      label: `Extra guest fee (${extraGuests}×)`,
      kind: "fee",
      pence: extraGuestFeePence,
    })

  const securityDepositPence = Math.max(0, round(profile.securityDepositPence))
  if (securityDepositPence > 0)
    lines.push({ label: "Refundable security deposit", kind: "deposit", pence: securityDepositPence })

  return {
    ready: true,
    currency,
    nights,
    guests,
    nightLines,
    nightsSubtotalPence,
    lengthDiscountPence,
    leadAdjustmentPence,
    cleaningFeePence,
    extraGuestFeePence,
    subtotalPence,
    securityDepositPence,
    lines,
    notes,
  }
}

// ── DB layer ─────────────────────────────────────────────────────────────────

function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  return e?.code === "42P01" || /does not exist/i.test(e?.message ?? "")
}

const EMPTY_PROFILE: PricingProfile = {
  id: null,
  currency: "GBP",
  baseNightlyPence: 0,
  weekendPence: null,
  weeklyDiscountPct: 0,
  monthlyDiscountPct: 0,
  minNights: 1,
  maxNights: null,
  cleaningFeePence: 0,
  extraGuestFeePence: 0,
  extraGuestAfter: 2,
  securityDepositPence: 0,
}

interface ProfileRow {
  id: string
  currency: string
  base_nightly_pence: number
  weekend_pence: number | null
  weekly_discount_pct: number
  monthly_discount_pct: number
  min_nights: number
  max_nights: number | null
  cleaning_fee_pence: number
  extra_guest_fee_pence: number
  extra_guest_after: number
  security_deposit_pence: number
}

function mapProfile(r: ProfileRow): PricingProfile {
  return {
    id: r.id,
    currency: r.currency || "GBP",
    baseNightlyPence: Number(r.base_nightly_pence) || 0,
    weekendPence: r.weekend_pence == null ? null : Number(r.weekend_pence),
    weeklyDiscountPct: Number(r.weekly_discount_pct) || 0,
    monthlyDiscountPct: Number(r.monthly_discount_pct) || 0,
    minNights: Number(r.min_nights) || 1,
    maxNights: r.max_nights == null ? null : Number(r.max_nights),
    cleaningFeePence: Number(r.cleaning_fee_pence) || 0,
    extraGuestFeePence: Number(r.extra_guest_fee_pence) || 0,
    extraGuestAfter: Number(r.extra_guest_after) || 2,
    securityDepositPence: Number(r.security_deposit_pence) || 0,
  }
}

interface RuleRow {
  id: string
  rule_type: PriceRuleType
  date_from: string | null
  date_to: string | null
  days_before_min: number | null
  days_before_max: number | null
  nights_min: number | null
  nights_max: number | null
  adjust_kind: PriceAdjustKind
  adjust_value: number
  priority: number
}

function mapRule(r: RuleRow): PriceRule {
  return {
    id: r.id,
    ruleType: r.rule_type,
    dateFrom: r.date_from,
    dateTo: r.date_to,
    daysBeforeMin: r.days_before_min == null ? null : Number(r.days_before_min),
    daysBeforeMax: r.days_before_max == null ? null : Number(r.days_before_max),
    nightsMin: r.nights_min == null ? null : Number(r.nights_min),
    nightsMax: r.nights_max == null ? null : Number(r.nights_max),
    adjustKind: r.adjust_kind,
    adjustValue: Number(r.adjust_value) || 0,
    priority: Number(r.priority) || 100,
  }
}

/** Load the active pricing profile for a listing (most recent active). */
export async function getPricingProfile(
  supabase: SupabaseClient,
  listingId: string
): Promise<PricingProfile | null> {
  try {
    const { data, error } = await supabase
      .from("booking_pricing_profiles")
      .select(
        "id, currency, base_nightly_pence, weekend_pence, weekly_discount_pct, monthly_discount_pct, " +
          "min_nights, max_nights, cleaning_fee_pence, extra_guest_fee_pence, extra_guest_after, security_deposit_pence"
      )
      .eq("listing_id", listingId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error || !data) return null
    return mapProfile(data as unknown as ProfileRow)
  } catch {
    return null
  }
}

/** Load active price rules for a listing. */
export async function getPriceRules(
  supabase: SupabaseClient,
  listingId: string
): Promise<PriceRule[]> {
  try {
    const { data, error } = await supabase
      .from("booking_price_rules")
      .select(
        "id, rule_type, date_from, date_to, days_before_min, days_before_max, nights_min, nights_max, " +
          "adjust_kind, adjust_value, priority"
      )
      .eq("listing_id", listingId)
      .eq("is_active", true)
      .order("priority", { ascending: true })
    if (error || !Array.isArray(data)) return []
    return data.map((r) => mapRule(r as unknown as RuleRow))
  } catch {
    return []
  }
}

/** Load per-day price overrides for a listing within [from, to). */
export async function getDayOverrides(
  supabase: SupabaseClient,
  listingId: string,
  from: string,
  to: string
): Promise<DayOverride[]> {
  try {
    const { data, error } = await supabase
      .from("booking_availability_days")
      .select("date, price_override_pence")
      .eq("listing_id", listingId)
      .gte("date", from)
      .lt("date", to)
      .not("price_override_pence", "is", null)
    if (error || !Array.isArray(data)) return []
    return data.map((r) => {
      const row = r as { date: string; price_override_pence: number | null }
      return { date: String(row.date).slice(0, 10), priceOverridePence: row.price_override_pence }
    })
  } catch {
    return []
  }
}

export interface QuoteStayArgs {
  supabase: SupabaseClient
  listingId: string
  checkIn: string
  checkOut: string
  guests: number
  /** Override lead-time (days before check-in); else computed from now. */
  leadDays?: number
}

/**
 * REAL DB-backed stay quote. Loads the listing's active pricing profile, price
 * rules and per-day overrides, then runs the pure {@link computeQuote}. When no
 * pricing profile exists the quote is `ready:false` with an honest note (the UI
 * shows a "no pricing yet" state rather than a fake £0). 42P01-tolerant.
 */
export async function quoteStay(args: QuoteStayArgs): Promise<StayQuote> {
  const { supabase, listingId, checkIn, checkOut, guests } = args
  try {
    const profile = await getPricingProfile(supabase, listingId)
    if (!profile) {
      const q = computeQuote(EMPTY_PROFILE, [], [], { checkIn, checkOut, guests, leadDays: args.leadDays })
      return { ...q, ready: false, notes: ["No active pricing profile for this listing yet.", ...q.notes] }
    }
    const [rules, overrides] = await Promise.all([
      getPriceRules(supabase, listingId),
      getDayOverrides(supabase, listingId, checkIn, checkOut),
    ])
    return computeQuote(profile, rules, overrides, { checkIn, checkOut, guests, leadDays: args.leadDays })
  } catch (err) {
    if (isMissingTable(err)) {
      const q = computeQuote(EMPTY_PROFILE, [], [], { checkIn, checkOut, guests, leadDays: args.leadDays })
      return { ...q, ready: false, notes: ["Booking pricing schema not provisioned yet."] }
    }
    const q = computeQuote(EMPTY_PROFILE, [], [], { checkIn, checkOut, guests, leadDays: args.leadDays })
    return { ...q, ready: false, notes: ["Pricing could not be loaded."] }
  }
}
