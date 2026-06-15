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
