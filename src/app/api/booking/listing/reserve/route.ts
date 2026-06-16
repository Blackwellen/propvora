import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { rateLimit, clientKey } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/booking/listing/reserve
 *
 * The ONLY sanctioned guest write path for a `booking_listings` checkout. Calls
 * the anon SECURITY DEFINER RPC `create_booking_listing_reservation` with the
 * request's anon-keyed client (NEVER service-role). The RPC RECOMPUTES the price
 * from the deep pricing model, validates availability atomically, inserts a
 * `pending_payment` hold, records legal acceptance (server-side, with ip/ua) and
 * mints a guest portal token. No price is sent from the client; legal acceptance
 * is re-required here AND enforced in the RPC.
 *
 * Returns a booking reference + guest token so the confirmation/pay flow and the
 * magic-link portal can resolve the trip. Honest status: 'pending_payment' — no
 * claim of payment (that happens at /pay via the escrow PaymentIntent).
 */

const guestSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  arrivalTime: z.string().trim().max(60).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  acceptHouseRules: z.boolean(),
  acceptCancellation: z.boolean(),
  acceptDeposit: z.boolean(),
  acceptTerms: z.boolean(),
})

const bodySchema = z.object({
  listingId: z.string().trim().uuid(),
  checkIn: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().positive().max(50),
  guest: guestSchema,
})

function clientIp(request: NextRequest): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    null
  )
}

const MISSING = new Set(["42P01", "PGRST202", "PGRST204", "PGRST205"])

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)

  // Strict: 5 reservation attempts per IP per 15 minutes.
  const rl = await rateLimit({ key: clientKey(request, "booking:reserve"), limit: 5, windowMs: 15 * 60 * 1000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many reservation attempts. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    )
  }

  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please complete all required booking details." },
        { status: 400 }
      )
    }
    const { guest, listingId, checkIn, checkOut, guests } = parsed.data

    // Server-enforced legal acceptance — never trust the checkbox alone.
    if (!guest.acceptHouseRules || !guest.acceptCancellation || !guest.acceptTerms) {
      return NextResponse.json(
        { error: "You must accept the house rules, cancellation policy and booking terms." },
        { status: 400 }
      )
    }
    if (!(checkOut > checkIn)) {
      return NextResponse.json({ error: "Check-out must be after check-in." }, { status: 400 })
    }

    const supabase = await createClient()
    const ip = clientIp(request)
    const userAgent = request.headers.get("user-agent")

    const { data, error } = await supabase.rpc("create_booking_listing_reservation", {
      p_listing_id: listingId,
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_guests_count: guests,
      p_guest_name: guest.fullName,
      p_guest_email: guest.email,
      p_guest_phone: guest.phone || null,
      p_arrival_time: guest.arrivalTime || null,
      p_guest_message: guest.message || null,
      p_accept_rules: guest.acceptHouseRules,
      p_accept_cancel: guest.acceptCancellation,
      p_accept_deposit: guest.acceptDeposit,
      p_accept_terms: guest.acceptTerms,
      p_ip: ip,
      p_user_agent: userAgent,
      p_hold_minutes: 30,
    })

    if (error) {
      if (MISSING.has(error.code ?? "") || /create_booking_listing_reservation/i.test(error.message ?? "")) {
        return NextResponse.json(
          { error: "Online booking is not available for this listing yet.", ready: false },
          { status: 503 }
        )
      }
      const msg = error.message ?? ""
      if (/no longer available|not available|blocked/i.test(msg)) {
        return NextResponse.json(
          { error: "Those dates are no longer available. Please choose different dates." },
          { status: 409 }
        )
      }
      if (/minimum stay|maximum stay|guests|pricing|past|after check-in|accepted/i.test(msg)) {
        return NextResponse.json({ error: msg }, { status: 400 })
      }
      throw error
    }

    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined
    if (!row?.booking_id) {
      return NextResponse.json({ error: "We couldn't complete your booking." }, { status: 500 })
    }

    return NextResponse.json(
      {
        ok: true,
        bookingId: String(row.booking_id),
        reference: String(row.booking_ref),
        token: String(row.guest_token),
        status: String(row.status ?? "pending_payment"),
        nights: Number(row.nights) || 0,
        subtotalPence: Number(row.subtotal_pence) || 0,
        depositPence: Number(row.deposit_pence) || 0,
        totalPence: Number(row.total_pence) || 0,
        currency: String(row.currency ?? "GBP"),
        held: true,
        checkIn,
        checkOut,
        guests,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    )
  } catch (err) {
    captureException(err, { source: "api/booking/listing/reserve POST", requestId })
    return NextResponse.json(
      { error: "We couldn't complete your booking. Please try again.", requestId },
      { status: 500 }
    )
  }
}
