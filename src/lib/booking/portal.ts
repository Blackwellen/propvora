// ============================================================================
// Guest magic-link portal data layer — thin, typed wrappers around the anon
// SECURITY DEFINER portal RPCs (booking_portal_lookup / booking_portal_cancel).
//
// A guest is UNAUTHENTICATED. They prove access with EITHER a token (from their
// confirmation email link) OR a booking ref + the email they booked with. The
// RPCs enforce that pairing server-side; this lib never reads `bookings`
// directly (anon has no RLS read on it). 42P01-tolerant → null/[].
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js"

export interface GuestTrip {
  bookingId: string
  bookingRef: string
  status: string
  paymentStatus: string
  guestName: string
  guestEmail: string
  checkIn: string
  checkOut: string
  nights: number
  guestsCount: number
  currency: string
  subtotalPence: number
  depositPence: number
  totalPence: number
  arrivalTime: string | null
  listingTitle: string
  listingSlug: string | null
  listingId: string | null
  city: string | null
  country: string | null
  cancellationPolicy: string
  checkInWindow: string | null
  checkoutTime: string | null
  canCheckIn: boolean
}

export interface PortalCredentials {
  ref?: string | null
  email?: string | null
  token?: string | null
}

function mapTrip(r: Record<string, unknown>): GuestTrip {
  return {
    bookingId: String(r.booking_id),
    bookingRef: String(r.booking_ref ?? ""),
    status: String(r.status ?? "pending_payment"),
    paymentStatus: String(r.payment_status ?? "unpaid"),
    guestName: String(r.guest_name ?? ""),
    guestEmail: String(r.guest_email ?? ""),
    checkIn: String(r.check_in ?? "").slice(0, 10),
    checkOut: String(r.check_out ?? "").slice(0, 10),
    nights: Number(r.nights) || 0,
    guestsCount: Number(r.guests_count) || 1,
    currency: String(r.currency ?? "GBP"),
    subtotalPence: Number(r.subtotal_pence) || 0,
    depositPence: Number(r.deposit_pence) || 0,
    totalPence: Number(r.total_pence) || 0,
    arrivalTime: (r.arrival_time as string | null) ?? null,
    listingTitle: String(r.listing_title ?? "Your stay"),
    listingSlug: (r.listing_slug as string | null) ?? null,
    listingId: (r.listing_id as string | null) ?? null,
    city: (r.city as string | null) ?? null,
    country: (r.country as string | null) ?? null,
    cancellationPolicy: String(r.cancellation_policy ?? "flexible"),
    checkInWindow: (r.check_in_window as string | null) ?? null,
    checkoutTime: (r.checkout_time as string | null) ?? null,
    canCheckIn: Boolean(r.can_check_in),
  }
}

/** Resolve a guest's trip by token or ref+email. Returns null if not found. */
export async function lookupGuestTrip(
  supabase: SupabaseClient,
  creds: PortalCredentials
): Promise<GuestTrip | null> {
  try {
    const { data, error } = await supabase.rpc("booking_portal_lookup", {
      p_ref: creds.ref ?? null,
      p_email: creds.email ?? null,
      p_token: creds.token ?? null,
    })
    if (error) return null
    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined
    if (!row || !row.booking_id) return null
    return mapTrip(row)
  } catch {
    return null
  }
}

/** Guest self-cancels an unpaid hold/pending reservation. Returns new status or null. */
export async function cancelGuestTrip(
  supabase: SupabaseClient,
  creds: PortalCredentials
): Promise<{ status: string } | null> {
  try {
    const { data, error } = await supabase.rpc("booking_portal_cancel", {
      p_ref: creds.ref ?? null,
      p_email: creds.email ?? null,
      p_token: creds.token ?? null,
    })
    if (error) return null
    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined
    if (!row) return null
    return { status: String(row.status ?? "cancelled") }
  } catch {
    return null
  }
}

export interface IssueInput {
  category?: string
  severity?: "low" | "normal" | "urgent"
  subject: string
  detail?: string
}

/** Guest reports an issue on their booking. Returns the issue id or { error }. */
export async function reportGuestIssue(
  supabase: SupabaseClient,
  creds: PortalCredentials,
  input: IssueInput
): Promise<{ id?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("booking_portal_report_issue", {
      p_ref: creds.ref ?? null,
      p_email: creds.email ?? null,
      p_token: creds.token ?? null,
      p_category: input.category ?? "other",
      p_severity: input.severity ?? "normal",
      p_subject: input.subject,
      p_detail: input.detail ?? null,
    })
    if (error) return { error: error.message }
    return { id: String(data) }
  } catch (err) {
    return { error: (err as { message?: string })?.message ?? "Could not report the issue." }
  }
}

export interface ReviewInput {
  rating: number
  title?: string
  body?: string
}

/** Guest submits a post-stay review. Returns the review id or { error }. */
export async function submitGuestReview(
  supabase: SupabaseClient,
  creds: PortalCredentials,
  input: ReviewInput
): Promise<{ id?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("booking_portal_submit_review", {
      p_ref: creds.ref ?? null,
      p_email: creds.email ?? null,
      p_token: creds.token ?? null,
      p_rating: input.rating,
      p_title: input.title ?? null,
      p_body: input.body ?? null,
    })
    if (error) return { error: error.message }
    return { id: String(data) }
  } catch (err) {
    return { error: (err as { message?: string })?.message ?? "Could not submit the review." }
  }
}
