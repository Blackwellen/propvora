// ============================================================================
// Booking reservations — the operator-side data layer over `bookings` plus a
// thin wrapper around the anon-callable `create_public_reservation` RPC.
//
// SECURITY MODEL (recap — see migration 20260616080000_booking_reservations.sql):
//   * Operators (authed workspace members) read/write `bookings` directly under
//     workspace-member RLS — they only ever see their own workspace's rows.
//   * Public guests (anon) NEVER insert into `bookings` directly (no anon RLS
//     policy). They go through createPublicReservation() → the SECURITY DEFINER
//     RPC, which validates availability + RECOMPUTES the price server-side. The
//     client-supplied price is irrelevant; it is never sent.
//
// All store calls are 42P01/error tolerant (return []/null) so a cold DB never
// hard-fails a page. All money is integer pence.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { quoteStay } from "./pricing"
import { getActiveRatePlan } from "./rates"
import { isRangeAvailable } from "./availability"

export type BookingStatus =
  | "hold"
  | "pending_payment"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "completed"
  | "no_show"

/** A reservation row. All money is integer pence. */
export interface Booking {
  id: string
  listingId: string
  workspaceId: string
  propertyId: string | null
  guestName: string
  guestEmail: string
  guestPhone: string | null
  checkIn: string
  checkOut: string
  nights: number
  guestsCount: number
  currency: string
  subtotalPence: number
  feesPence: number
  totalPence: number
  platformFeePence: number
  status: BookingStatus
  transactionId: string | null
  holdExpiresAt: string | null
  source: string
  createdAt: string
  updatedAt: string
}

const COLS =
  "id, listing_id, workspace_id, property_id, guest_name, guest_email, guest_phone, " +
  "check_in, check_out, nights, guests_count, currency, subtotal_pence, fees_pence, " +
  "total_pence, platform_fee_pence, status, transaction_id, hold_expires_at, source, " +
  "created_at, updated_at"

function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  return e?.code === "42P01" || /does not exist/i.test(e?.message ?? "")
}

interface BookingRow {
  id: string
  listing_id: string
  workspace_id: string
  property_id: string | null
  guest_name: string
  guest_email: string
  guest_phone: string | null
  check_in: string
  check_out: string
  nights: number
  guests_count: number
  currency: string
  subtotal_pence: number
  fees_pence: number
  total_pence: number
  platform_fee_pence: number
  status: BookingStatus
  transaction_id: string | null
  hold_expires_at: string | null
  source: string
  created_at: string
  updated_at: string
}

function mapRow(r: BookingRow): Booking {
  return {
    id: r.id,
    listingId: r.listing_id,
    workspaceId: r.workspace_id,
    propertyId: r.property_id,
    guestName: r.guest_name,
    guestEmail: r.guest_email,
    guestPhone: r.guest_phone,
    checkIn: r.check_in,
    checkOut: r.check_out,
    nights: Number(r.nights),
    guestsCount: Number(r.guests_count),
    currency: r.currency,
    subtotalPence: Number(r.subtotal_pence),
    feesPence: Number(r.fees_pence),
    totalPence: Number(r.total_pence),
    platformFeePence: Number(r.platform_fee_pence),
    status: r.status,
    transactionId: r.transaction_id,
    holdExpiresAt: r.hold_expires_at,
    source: r.source,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

/** Filters for {@link listBookings}. */
export interface BookingFilters {
  status?: BookingStatus | BookingStatus[]
  listingId?: string
  /** Bookings checking in on/after this date (yyyy-mm-dd). */
  checkInFrom?: string
  /** Bookings checking in on/before this date (yyyy-mm-dd). */
  checkInTo?: string
  limit?: number
}

/**
 * List a workspace's bookings (operator view). RLS additionally scopes to the
 * caller's workspaces; the explicit workspace_id filter narrows to one.
 * Tolerant → [] on error.
 */
export async function listBookings(
  supabase: SupabaseClient,
  workspaceId: string,
  filters: BookingFilters = {}
): Promise<Booking[]> {
  try {
    let q = supabase.from("bookings").select(COLS).eq("workspace_id", workspaceId)
    if (filters.listingId) q = q.eq("listing_id", filters.listingId)
    if (filters.status) {
      q = Array.isArray(filters.status)
        ? q.in("status", filters.status)
        : q.eq("status", filters.status)
    }
    if (filters.checkInFrom) q = q.gte("check_in", filters.checkInFrom)
    if (filters.checkInTo) q = q.lte("check_in", filters.checkInTo)
    q = q.order("check_in", { ascending: true }).limit(filters.limit ?? 200)
    const { data, error } = await q
    if (error) return []
    return (data ?? []).map((r) => mapRow(r as unknown as BookingRow))
  } catch (err) {
    if (isMissingTable(err)) return []
    return []
  }
}

/** Fetch one booking by id (RLS-scoped). Tolerant → null. */
export async function getBooking(
  supabase: SupabaseClient,
  bookingId: string
): Promise<Booking | null> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(COLS)
      .eq("id", bookingId)
      .maybeSingle()
    if (error || !data) return null
    return mapRow(data as unknown as BookingRow)
  } catch {
    return null
  }
}

/** Inputs to {@link createHold} (operator/authed path). */
export interface CreateHoldInput {
  listingId: string
  workspaceId: string
  propertyId?: string | null
  guestName: string
  guestEmail: string
  guestPhone?: string | null
  checkIn: string
  checkOut: string
  guestsCount?: number
  currency?: string
  holdMinutes?: number
  source?: string
}

/**
 * Create a hold via the AUTHED operator path (e.g. operator taking a phone
 * booking). Validates the range is free and recomputes the price from the
 * active rate plan (falling back to the listing base price). Writes directly to
 * `bookings` under operator RLS. For PUBLIC/anon checkout use
 * {@link createPublicReservation} instead.
 *
 * Returns the created booking or null on validation/store failure.
 */
export async function createHold(
  supabase: SupabaseClient,
  input: CreateHoldInput
): Promise<Booking | null> {
  const nights = Math.round(
    (Date.parse(input.checkOut) - Date.parse(input.checkIn)) / 86_400_000
  )
  if (!(nights >= 1)) return null

  const avail = await isRangeAvailable(supabase, input.listingId, input.checkIn, input.checkOut)
  if (!avail.available) return null

  // Resolve nightly rate: active rate plan → listing base price.
  let nightlyRatePence = 0
  let weekendUpliftPct: number | null = null
  const plan = await getActiveRatePlan(supabase, input.listingId)
  if (plan) {
    nightlyRatePence = plan.nightlyRatePence
    weekendUpliftPct = plan.weekendUpliftPct
  } else {
    try {
      const { data } = await supabase
        .from("marketplace_listings")
        .select("base_price_pence, currency")
        .eq("id", input.listingId)
        .maybeSingle()
      nightlyRatePence = Number(
        (data as { base_price_pence?: number } | null)?.base_price_pence ?? 0
      )
    } catch {
      return null
    }
  }
  if (!(nightlyRatePence > 0)) return null

  const quote = quoteStay({ nights, nightlyRatePence, weekendUpliftPct, checkIn: input.checkIn })
  const holdMinutes = Math.max(5, Math.min(input.holdMinutes ?? 30, 120))
  const holdExpiresAt = new Date(Date.now() + holdMinutes * 60_000).toISOString()

  try {
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        listing_id: input.listingId,
        workspace_id: input.workspaceId,
        property_id: input.propertyId ?? null,
        guest_name: input.guestName.trim(),
        guest_email: input.guestEmail.trim().toLowerCase(),
        guest_phone: input.guestPhone ?? null,
        check_in: input.checkIn,
        check_out: input.checkOut,
        nights,
        guests_count: input.guestsCount ?? 1,
        currency: input.currency ?? "GBP",
        subtotal_pence: quote.subtotalPence,
        fees_pence: 0,
        total_pence: quote.subtotalPence,
        platform_fee_pence: 0,
        status: "hold",
        hold_expires_at: holdExpiresAt,
        source: input.source ?? "operator",
      })
      .select(COLS)
      .maybeSingle()
    if (error || !data) return null
    return mapRow(data as unknown as BookingRow)
  } catch {
    return null
  }
}

/**
 * Move a booking to `confirmed` (e.g. after payment). Optionally attach the
 * marketplace_transaction id. Clears the hold expiry. Returns the updated row
 * or null.
 */
export async function confirmBooking(
  supabase: SupabaseClient,
  bookingId: string,
  opts?: { transactionId?: string; feesPence?: number; platformFeePence?: number }
): Promise<Booking | null> {
  const patch: Record<string, unknown> = {
    status: "confirmed",
    hold_expires_at: null,
  }
  if (opts?.transactionId) patch.transaction_id = opts.transactionId
  if (typeof opts?.feesPence === "number") patch.fees_pence = opts.feesPence
  if (typeof opts?.platformFeePence === "number") patch.platform_fee_pence = opts.platformFeePence
  try {
    const { data, error } = await supabase
      .from("bookings")
      .update(patch)
      .eq("id", bookingId)
      .select(COLS)
      .maybeSingle()
    if (error || !data) return null
    return mapRow(data as unknown as BookingRow)
  } catch {
    return null
  }
}

/** Cancel a booking. Returns the updated row or null. */
export async function cancelBooking(
  supabase: SupabaseClient,
  bookingId: string,
  _reason?: string
): Promise<Booking | null> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .update({ status: "cancelled", hold_expires_at: null })
      .eq("id", bookingId)
      .select(COLS)
      .maybeSingle()
    if (error || !data) return null
    return mapRow(data as unknown as BookingRow)
  } catch {
    return null
  }
}

// ── Operator lifecycle transitions ──────────────────────────────────────────

/** Allowed forward transitions for the operator reservation lifecycle. The DB
 * CHECK now permits checked_in/checked_out (migration 20260617020000). */
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  hold: ["pending_payment", "confirmed", "cancelled"],
  pending_payment: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled", "no_show", "completed"],
  checked_in: ["checked_out", "completed"],
  checked_out: ["completed"],
  cancelled: [],
  completed: [],
  no_show: [],
}

export type ExtendedBookingStatus = BookingStatus

/**
 * Generic guarded transition. Reads the current status, validates the requested
 * target is a legal next state, then persists it. Returns the updated booking
 * or { error } describing the rejection. Side-effect stub points (cleaning task,
 * messaging, ledger) are flagged in the result for the caller to action.
 */
export async function transitionBooking(
  supabase: SupabaseClient,
  bookingId: string,
  target: ExtendedBookingStatus
): Promise<{ booking?: Booking; error?: string; sideEffects?: string[] }> {
  const current = await getBooking(supabase, bookingId)
  if (!current) return { error: "Reservation not found." }
  const allowed = TRANSITIONS[current.status as BookingStatus] ?? []
  if (!allowed.includes(target as BookingStatus)) {
    return { error: `Cannot move a ${current.status} reservation to ${target}.` }
  }
  const patch: Record<string, unknown> = { status: target }
  if (target === "confirmed" || target === "cancelled") patch.hold_expires_at = null
  try {
    const { data, error } = await supabase
      .from("bookings")
      .update(patch)
      .eq("id", bookingId)
      .select(COLS)
      .maybeSingle()
    if (error || !data) return { error: error?.message ?? "Transition failed." }
    // Side-effect creator stub points — wired by the ops layer in a later wave.
    const sideEffects: string[] = []
    if (target === "confirmed") sideEffects.push("create_cleaning_task", "send_confirmation_message", "create_ledger_entry")
    if (target === "checked_in") sideEffects.push("release_access_instructions")
    if (target === "checked_out") sideEffects.push("create_turnover_task", "open_deposit_review")
    if (target === "cancelled") sideEffects.push("free_calendar_dates", "evaluate_refund")
    return { booking: mapRow(data as unknown as BookingRow), sideEffects }
  } catch (err) {
    return { error: (err as { message?: string })?.message ?? "Transition failed." }
  }
}

/** Mark a confirmed reservation as checked-in (guarded). */
export async function checkInBooking(supabase: SupabaseClient, bookingId: string) {
  return transitionBooking(supabase, bookingId, "checked_in")
}
/** Mark a checked-in reservation as checked-out (guarded). */
export async function checkOutBooking(supabase: SupabaseClient, bookingId: string) {
  return transitionBooking(supabase, bookingId, "checked_out")
}
/** Mark a reservation completed (post-stay). */
export async function completeBooking(supabase: SupabaseClient, bookingId: string) {
  return transitionBooking(supabase, bookingId, "completed")
}
/** Flag a confirmed reservation as a no-show. */
export async function markNoShow(supabase: SupabaseClient, bookingId: string) {
  return transitionBooking(supabase, bookingId, "no_show")
}

/** List reservations attached to a specific booking_listing (either via the new
 * `booking_listing_id` bridge or the legacy `listing_id`). Tolerant → []. */
export async function listReservationsForListing(
  supabase: SupabaseClient,
  listingId: string,
  filters: BookingFilters = {}
): Promise<Booking[]> {
  try {
    let q = supabase
      .from("bookings")
      .select(COLS)
      .or(`listing_id.eq.${listingId},booking_listing_id.eq.${listingId}`)
    if (filters.status) {
      q = Array.isArray(filters.status) ? q.in("status", filters.status) : q.eq("status", filters.status)
    }
    if (filters.checkInFrom) q = q.gte("check_in", filters.checkInFrom)
    if (filters.checkInTo) q = q.lte("check_in", filters.checkInTo)
    const { data, error } = await q.order("check_in", { ascending: true }).limit(filters.limit ?? 200)
    if (error || !Array.isArray(data)) return []
    return data.map((r) => mapRow(r as unknown as BookingRow))
  } catch {
    return []
  }
}

/**
 * Expire stale holds: flip any status='hold' rows whose hold_expires_at is in
 * the past to 'cancelled', freeing their dates. RLS-scoped to the caller's
 * workspaces (operators) — for a global sweep use a service-role client.
 * Returns the number of holds expired (best-effort; 0 on error).
 */
export async function expireStaleHolds(
  supabase: SupabaseClient,
  opts?: { workspaceId?: string }
): Promise<number> {
  try {
    let q = supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("status", "hold")
      .lt("hold_expires_at", new Date().toISOString())
    if (opts?.workspaceId) q = q.eq("workspace_id", opts.workspaceId)
    const { data, error } = await q.select("id")
    if (error || !Array.isArray(data)) return 0
    return data.length
  } catch {
    return 0
  }
}

// ── Public (anon) reservation via SECURITY DEFINER RPC ──────────────────────

/** Inputs to {@link createPublicReservation}. NB: NO price field — the server
 * recomputes it. */
export interface CreatePublicReservationArgs {
  listingId: string
  checkIn: string
  checkOut: string
  guestsCount: number
  guestName: string
  guestEmail: string
  guestPhone?: string | null
  sessionToken?: string | null
  holdMinutes?: number
}

/** What the RPC returns: the new hold's id + server-computed totals. */
export interface PublicReservationResult {
  bookingId: string
  nights: number
  subtotalPence: number
  totalPence: number
  currency: string
  status: string
  holdExpiresAt: string
}

/**
 * Create a public reservation hold by calling the anon-callable SECURITY
 * DEFINER RPC `create_public_reservation`. This is the ONLY safe way for an
 * UNAUTHENTICATED guest to place a hold — no service-role key required in the
 * frontend. The DB validates availability and RECOMPUTES the price; the client
 * never sends a price. Returns the result or { error } with the DB message.
 */
export async function createPublicReservation(
  supabase: SupabaseClient,
  args: CreatePublicReservationArgs
): Promise<{ result?: PublicReservationResult; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("create_public_reservation", {
      p_listing_id: args.listingId,
      p_check_in: args.checkIn,
      p_check_out: args.checkOut,
      p_guests_count: args.guestsCount,
      p_guest_name: args.guestName,
      p_guest_email: args.guestEmail,
      p_guest_phone: args.guestPhone ?? null,
      p_session_token: args.sessionToken ?? null,
      p_hold_minutes: args.holdMinutes ?? 30,
    })
    if (error) return { error: error.message }
    // The RPC RETURNS TABLE → supabase-js yields an array of rows.
    const row = (Array.isArray(data) ? data[0] : data) as
      | {
          booking_id: string
          nights: number
          subtotal_pence: number
          total_pence: number
          currency: string
          status: string
          hold_expires_at: string
        }
      | undefined
    if (!row) return { error: "reservation could not be created" }
    return {
      result: {
        bookingId: row.booking_id,
        nights: Number(row.nights),
        subtotalPence: Number(row.subtotal_pence),
        totalPence: Number(row.total_pence),
        currency: row.currency,
        status: row.status,
        holdExpiresAt: row.hold_expires_at,
      },
    }
  } catch (err) {
    const msg = (err as { message?: string } | null)?.message ?? "reservation failed"
    return { error: msg }
  }
}
