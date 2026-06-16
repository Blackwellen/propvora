// ============================================================================
// Booking availability — blocked-date reads/writes + range-free checks against
// the `bookings` overlap and `booking_blocked_dates` table. Every store call is
// 42P01-tolerant (returns an empty/permissive result rather than throwing) so a
// cold or migrating DB never hard-fails a page.
//
// Half-open date ranges throughout: a stay occupies nights [check_in, check_out)
// — the check_out day is a departure day and is itself bookable by the next guest.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

/** True when an error is "relation does not exist" (migration not applied). */
function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  return e?.code === "42P01" || /does not exist/i.test(e?.message ?? "")
}

/** A blocked date row for a listing. */
export interface BlockedDate {
  id: string
  listingId: string
  date: string // yyyy-mm-dd
  reason: string | null
}

/**
 * List the explicit blocked dates for a listing (optionally within a window).
 * 42P01/error tolerant — returns [] if the table is missing or the read fails.
 */
export async function getBlockedDates(
  supabase: SupabaseClient,
  listingId: string,
  opts?: { from?: string; to?: string }
): Promise<BlockedDate[]> {
  try {
    let q = supabase
      .from("booking_blocked_dates")
      .select("id, listing_id, date, reason")
      .eq("listing_id", listingId)
    if (opts?.from) q = q.gte("date", opts.from)
    if (opts?.to) q = q.lt("date", opts.to)
    const { data, error } = await q.order("date", { ascending: true })
    if (error) return []
    return (data ?? []).map((r) => {
      const row = r as { id: string; listing_id: string; date: string; reason: string | null }
      return { id: row.id, listingId: row.listing_id, date: row.date, reason: row.reason }
    })
  } catch (err) {
    if (isMissingTable(err)) return []
    return []
  }
}

/**
 * Replace the blocked dates for a listing with `dates`. Operator-only (RLS
 * enforces workspace membership). Deletes any blocks within the given dates'
 * span that are no longer present, then upserts the provided ones. Pass an
 * empty array to clear all blocks for the listing. Returns false on any error.
 */
export async function setBlockedDates(
  supabase: SupabaseClient,
  listingId: string,
  dates: Array<{ date: string; reason?: string | null }>
): Promise<boolean> {
  try {
    // Clear existing blocks for this listing, then insert the new set. This is
    // a full replace — simple and predictable for a calendar editor.
    const del = await supabase.from("booking_blocked_dates").delete().eq("listing_id", listingId)
    if (del.error) return false
    if (dates.length === 0) return true
    const rows = dates.map((d) => ({
      listing_id: listingId,
      date: d.date,
      reason: d.reason ?? null,
    }))
    const { error } = await supabase.from("booking_blocked_dates").insert(rows)
    return !error
  } catch {
    return false
  }
}

/** Outcome of {@link isRangeAvailable}. */
export interface RangeAvailability {
  available: boolean
  /** Reason when unavailable: 'booked' (overlap) or 'blocked' (blocked date). */
  reason?: "booked" | "blocked"
}

/**
 * Is [checkIn, checkOut) free for `listingId`? Checks BOTH:
 *   (1) no overlapping live booking — overlap iff existing.check_in < checkOut
 *       AND existing.check_out > checkIn, ignoring cancelled/no_show and EXPIRED
 *       holds;
 *   (2) no blocked date within [checkIn, checkOut).
 * Mirrors the server-side check in create_public_reservation(). 42P01-tolerant:
 * if a table is missing it is treated as no-constraint (available), never a hard
 * fail — the authoritative gate is the DB function at insert time.
 */
export async function isRangeAvailable(
  supabase: SupabaseClient,
  listingId: string,
  checkIn: string,
  checkOut: string
): Promise<RangeAvailability> {
  if (!(checkOut > checkIn)) return { available: false, reason: "blocked" }

  // (1) overlapping bookings
  try {
    const nowIso = new Date().toISOString()
    const { data, error } = await supabase
      .from("bookings")
      .select("id, status, check_in, check_out, hold_expires_at")
      .eq("listing_id", listingId)
      .lt("check_in", checkOut)
      .gt("check_out", checkIn)
      .not("status", "in", "(cancelled,no_show)")
    if (!error && Array.isArray(data)) {
      const live = data.filter((r) => {
        const row = r as { status: string; hold_expires_at: string | null }
        if (row.status === "hold" && row.hold_expires_at && row.hold_expires_at < nowIso) return false
        return true
      })
      if (live.length > 0) return { available: false, reason: "booked" }
    }
  } catch (err) {
    if (!isMissingTable(err)) {
      /* treat unknown read errors as non-blocking; DB fn is authoritative */
    }
  }

  // (2) blocked dates in range
  try {
    const { data, error } = await supabase
      .from("booking_blocked_dates")
      .select("id")
      .eq("listing_id", listingId)
      .gte("date", checkIn)
      .lt("date", checkOut)
      .limit(1)
    if (!error && Array.isArray(data) && data.length > 0) {
      return { available: false, reason: "blocked" }
    }
  } catch {
    /* tolerant */
  }

  return { available: true }
}

// ============================================================================
// DEEP availability — per-day grid over `booking_availability_days`, merged
// with live bookings (overlap) and legacy blocked dates. This is the real
// engine that powers the operator calendar and the bookability checker.
// ============================================================================

/** Per-day availability status (mirrors the booking_availability_days CHECK). */
export type DayStatus =
  | "available"
  | "blocked_manual"
  | "blocked_owner"
  | "blocked_maintenance"
  | "blocked_channel"
  | "booked_direct"
  | "booked_channel"
  | "pending"
  | "hold"

/** A resolved availability day for the operator calendar. */
export interface AvailabilityDay {
  date: string // yyyy-mm-dd
  status: DayStatus
  /** Effective nightly price override for this day, if any (integer pence). */
  priceOverridePence: number | null
  minNights: number | null
  maxNights: number | null
  checkinAllowed: boolean
  checkoutAllowed: boolean
  prepTimeDays: number
  advanceNoticeDays: number
  cutOffDays: number
  /** Reservation occupying this day, if booked/held. */
  bookingId: string | null
  note: string | null
}

interface DayRow {
  date: string
  status: DayStatus
  price_override_pence: number | null
  min_nights: number | null
  max_nights: number | null
  checkin_allowed: boolean
  checkout_allowed: boolean
  prep_time_days: number
  advance_notice_days: number
  cut_off_days: number
  booking_id: string | null
  note: string | null
}

function eachDate(from: string, toExclusive: string): string[] {
  const out: string[] = []
  const [fy, fm, fd] = from.split("-").map(Number)
  let cur = Date.UTC(fy, (fm ?? 1) - 1, fd ?? 1)
  const [ty, tm, td] = toExclusive.split("-").map(Number)
  const end = Date.UTC(ty, (tm ?? 1) - 1, td ?? 1)
  while (cur < end) {
    out.push(new Date(cur).toISOString().slice(0, 10))
    cur += 86_400_000
  }
  return out
}

function defaultDay(date: string): AvailabilityDay {
  return {
    date,
    status: "available",
    priceOverridePence: null,
    minNights: null,
    maxNights: null,
    checkinAllowed: true,
    checkoutAllowed: true,
    prepTimeDays: 0,
    advanceNoticeDays: 0,
    cutOffDays: 0,
    bookingId: null,
    note: null,
  }
}

/**
 * Resolve the real availability grid for `listingId` over [from, to). Merges:
 *   (1) explicit `booking_availability_days` rows (status, overrides, rules),
 *   (2) live bookings overlap → marks each occupied night booked_direct/hold,
 *   (3) legacy `booking_blocked_dates` → blocked_manual.
 * Days without any row default to `available`. 42P01-tolerant.
 */
export async function getAvailability(
  supabase: SupabaseClient,
  listingId: string,
  from: string,
  to: string
): Promise<{ ready: boolean; days: AvailabilityDay[] }> {
  const dates = eachDate(from, to)
  const grid = new Map<string, AvailabilityDay>(dates.map((d) => [d, defaultDay(d)]))
  let ready = false

  // (1) deep day rows
  try {
    const { data, error } = await supabase
      .from("booking_availability_days")
      .select(
        "date, status, price_override_pence, min_nights, max_nights, checkin_allowed, checkout_allowed, " +
          "prep_time_days, advance_notice_days, cut_off_days, booking_id, note"
      )
      .eq("listing_id", listingId)
      .gte("date", from)
      .lt("date", to)
    if (!error && Array.isArray(data)) {
      ready = true
      for (const r of data) {
        const row = r as unknown as DayRow
        const d = String(row.date).slice(0, 10)
        if (!grid.has(d)) continue
        grid.set(d, {
          date: d,
          status: row.status,
          priceOverridePence: row.price_override_pence,
          minNights: row.min_nights,
          maxNights: row.max_nights,
          checkinAllowed: row.checkin_allowed,
          checkoutAllowed: row.checkout_allowed,
          prepTimeDays: Number(row.prep_time_days) || 0,
          advanceNoticeDays: Number(row.advance_notice_days) || 0,
          cutOffDays: Number(row.cut_off_days) || 0,
          bookingId: row.booking_id,
          note: row.note,
        })
      }
    }
  } catch (err) {
    if (!isMissingTable(err)) ready = true
  }

  // (2) live bookings overlap → mark booked/hold nights
  try {
    const nowIso = new Date().toISOString()
    const { data, error } = await supabase
      .from("bookings")
      .select("id, status, check_in, check_out, hold_expires_at")
      .or(`listing_id.eq.${listingId},booking_listing_id.eq.${listingId}`)
      .lt("check_in", to)
      .gt("check_out", from)
      .not("status", "in", "(cancelled,no_show)")
    if (!error && Array.isArray(data)) {
      ready = true
      for (const r of data) {
        const row = r as {
          id: string
          status: string
          check_in: string
          check_out: string
          hold_expires_at: string | null
        }
        if (row.status === "hold" && row.hold_expires_at && row.hold_expires_at < nowIso) continue
        const nights = eachDate(String(row.check_in).slice(0, 10), String(row.check_out).slice(0, 10))
        const isHold = row.status === "hold" || row.status === "pending_payment"
        for (const n of nights) {
          const cell = grid.get(n)
          if (!cell) continue
          if (cell.status === "available") {
            cell.status = isHold ? "hold" : "booked_direct"
            cell.bookingId = row.id
          }
        }
      }
    }
  } catch {
    /* tolerant */
  }

  // (3) legacy blocked dates
  try {
    const { data, error } = await supabase
      .from("booking_blocked_dates")
      .select("date")
      .eq("listing_id", listingId)
      .gte("date", from)
      .lt("date", to)
    if (!error && Array.isArray(data)) {
      for (const r of data) {
        const d = String((r as { date: string }).date).slice(0, 10)
        const cell = grid.get(d)
        if (cell && cell.status === "available") cell.status = "blocked_manual"
      }
    }
  } catch {
    /* tolerant */
  }

  return { ready, days: dates.map((d) => grid.get(d)!) }
}

const BOOKABLE_STATUSES = new Set<DayStatus>(["available"])

/** Result of {@link isRangeBookable}. */
export interface RangeBookable {
  bookable: boolean
  reason?:
    | "bad_range"
    | "below_min_nights"
    | "above_max_nights"
    | "day_unavailable"
    | "checkin_not_allowed"
    | "checkout_not_allowed"
    | "advance_notice"
    | "cut_off"
  /** The first offending date, when applicable. */
  date?: string
}

/**
 * REAL bookability check over the resolved grid. Enforces, against
 * [checkIn, checkOut): valid range, every night available, min/max nights,
 * check-in/out flags, and advance-notice / cut-off lead-time rules.
 */
export async function isRangeBookable(
  supabase: SupabaseClient,
  listingId: string,
  checkIn: string,
  checkOut: string,
  opts?: { minNights?: number; maxNights?: number | null; today?: string }
): Promise<RangeBookable> {
  if (!(checkOut > checkIn)) return { bookable: false, reason: "bad_range" }
  const nights = eachDate(checkIn, checkOut)
  if (nights.length < 1) return { bookable: false, reason: "bad_range" }

  // Resolve grid covering nights + the departure day (for its checkout flag).
  const departureDay = checkOut
  const toExclusive = new Date(Date.parse(checkOut) + 86_400_000).toISOString().slice(0, 10)
  const { days } = await getAvailability(supabase, listingId, checkIn, toExclusive)
  const byDate = new Map(days.map((d) => [d.date, d]))

  const arrival = byDate.get(checkIn)
  const minN = arrival?.minNights ?? opts?.minNights ?? 1
  const maxN = arrival?.maxNights ?? opts?.maxNights ?? null
  if (nights.length < minN) return { bookable: false, reason: "below_min_nights" }
  if (maxN != null && nights.length > maxN) return { bookable: false, reason: "above_max_nights" }

  for (const n of nights) {
    const cell = byDate.get(n)
    if (cell && !BOOKABLE_STATUSES.has(cell.status)) {
      return { bookable: false, reason: "day_unavailable", date: n }
    }
  }

  if (arrival && !arrival.checkinAllowed) {
    return { bookable: false, reason: "checkin_not_allowed", date: checkIn }
  }
  const departure = byDate.get(departureDay)
  if (departure && !departure.checkoutAllowed) {
    return { bookable: false, reason: "checkout_not_allowed", date: departureDay }
  }

  const today = opts?.today ?? new Date().toISOString().slice(0, 10)
  const leadDays = Math.round((Date.parse(checkIn) - Date.parse(today)) / 86_400_000)
  const advance = arrival?.advanceNoticeDays ?? 0
  const cutOff = arrival?.cutOffDays ?? 0
  if (advance > 0 && leadDays < advance) return { bookable: false, reason: "advance_notice" }
  if (cutOff > 0 && leadDays < cutOff) return { bookable: false, reason: "cut_off" }

  return { bookable: true }
}

/** Upsert a single availability day (operator-only via RLS). */
export async function setAvailabilityDay(
  supabase: SupabaseClient,
  listingId: string,
  date: string,
  patch: Partial<{
    status: DayStatus
    priceOverridePence: number | null
    minNights: number | null
    maxNights: number | null
    checkinAllowed: boolean
    checkoutAllowed: boolean
    prepTimeDays: number
    advanceNoticeDays: number
    cutOffDays: number
    note: string | null
  }>
): Promise<boolean> {
  const row: Record<string, unknown> = { listing_id: listingId, date }
  if (patch.status !== undefined) row.status = patch.status
  if (patch.priceOverridePence !== undefined) row.price_override_pence = patch.priceOverridePence
  if (patch.minNights !== undefined) row.min_nights = patch.minNights
  if (patch.maxNights !== undefined) row.max_nights = patch.maxNights
  if (patch.checkinAllowed !== undefined) row.checkin_allowed = patch.checkinAllowed
  if (patch.checkoutAllowed !== undefined) row.checkout_allowed = patch.checkoutAllowed
  if (patch.prepTimeDays !== undefined) row.prep_time_days = patch.prepTimeDays
  if (patch.advanceNoticeDays !== undefined) row.advance_notice_days = patch.advanceNoticeDays
  if (patch.cutOffDays !== undefined) row.cut_off_days = patch.cutOffDays
  if (patch.note !== undefined) row.note = patch.note
  try {
    const { error } = await supabase
      .from("booking_availability_days")
      .upsert(row, { onConflict: "listing_id,date" })
    return !error
  } catch {
    return false
  }
}

/** Bulk set a contiguous date range to a status/price (calendar drag-block). */
export async function setAvailabilityRange(
  supabase: SupabaseClient,
  listingId: string,
  from: string,
  toExclusive: string,
  patch: { status?: DayStatus; priceOverridePence?: number | null; minNights?: number | null }
): Promise<boolean> {
  const dates = eachDate(from, toExclusive)
  if (dates.length === 0) return true
  const rows = dates.map((date) => ({
    listing_id: listingId,
    date,
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.priceOverridePence !== undefined ? { price_override_pence: patch.priceOverridePence } : {}),
    ...(patch.minNights !== undefined ? { min_nights: patch.minNights } : {}),
  }))
  try {
    const { error } = await supabase
      .from("booking_availability_days")
      .upsert(rows, { onConflict: "listing_id,date" })
    return !error
  } catch {
    return false
  }
}

/**
 * Seed an availability window as all-available (idempotent). Used by the
 * listing wizard's availability step and the round-trip proof.
 */
export async function seedAvailabilityWindow(
  supabase: SupabaseClient,
  listingId: string,
  from: string,
  days: number
): Promise<number> {
  const start = Date.parse(from)
  const rows = Array.from({ length: Math.max(0, days) }, (_, i) => ({
    listing_id: listingId,
    date: new Date(start + i * 86_400_000).toISOString().slice(0, 10),
    status: "available" as const,
  }))
  if (rows.length === 0) return 0
  try {
    const { error } = await supabase
      .from("booking_availability_days")
      .upsert(rows, { onConflict: "listing_id,date", ignoreDuplicates: true })
    return error ? 0 : rows.length
  } catch {
    return 0
  }
}
