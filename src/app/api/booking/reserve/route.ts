import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { z } from "zod"
import {
  validateQuoteInput,
  loadPublishedStayListing,
  computeQuote,
  isMissing,
} from "../_shared"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/booking/reserve
 *
 * The ONLY guest write path. Creates a HOLD / pending_payment reservation via
 * the SECURITY DEFINER RPC `create_public_reservation`, using the request's
 * anon-keyed Supabase client — NEVER the service-role key. Payment capture is
 * P5: this endpoint takes no money. It returns a booking reference and an
 * honest "we'll confirm your booking" status.
 *
 * Security:
 *  • price is RECOMPUTED server-side (computeQuote) — the client total is never
 *    trusted; we pass our recomputed total to the RPC, which itself should also
 *    recompute / validate.
 *  • dates, guest count and listing publication/type are validated before write.
 *  • the RPC is the conflict guard for double-bookings (atomic insert).
 */

// Guest details — validated independently of the date/listing payload.
const guestSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().max(60).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  arrivalTime: z.string().trim().max(40).optional().or(z.literal("")),
  // Legal acceptance — must be true to proceed (server-enforced, not trusted
  // from the checkbox alone: we re-require it here).
  acceptHouseRules: z.boolean(),
  acceptCancellation: z.boolean(),
  acceptTerms: z.boolean(),
  acceptDataSharing: z.boolean(),
})

const bodySchema = z.object({
  listingId: z.string().trim().min(1),
  checkIn: z.string().trim(),
  checkOut: z.string().trim(),
  guests: z.number().int().positive().max(50).optional(),
  guest: guestSchema,
})

function clientIp(request: NextRequest): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    null
  )
}

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please complete all required booking details." },
        { status: 400 }
      )
    }
    const { guest } = parsed.data

    // Server-enforced legal acceptance — never rely on the checkbox state alone.
    if (
      !guest.acceptHouseRules ||
      !guest.acceptCancellation ||
      !guest.acceptTerms ||
      !guest.acceptDataSharing
    ) {
      return NextResponse.json(
        { error: "You must accept the house rules, cancellation policy and terms to book." },
        { status: 400 }
      )
    }

    // Reuse the shared validator for dates/guests (single source of truth).
    const validated = validateQuoteInput({
      listingId: parsed.data.listingId,
      checkIn: parsed.data.checkIn,
      checkOut: parsed.data.checkOut,
      guests: parsed.data.guests ?? 1,
    })
    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: validated.status })
    }

    const supabase = await createClient()

    const loaded = await loadPublishedStayListing(supabase, validated.listingId)
    if ("error" in loaded) {
      return NextResponse.json(
        { error: loaded.error, ...(loaded.status === 503 ? { ready: false } : {}) },
        { status: loaded.status }
      )
    }
    const listing = loaded.listing

    if (listing.max_guests != null && validated.guests > listing.max_guests) {
      return NextResponse.json(
        { error: `This listing accommodates up to ${listing.max_guests} guests.` },
        { status: 400 }
      )
    }

    // RECOMPUTE the price on the server — this total is what we send to the RPC.
    const quote = await computeQuote(supabase, validated, listing)

    const ip = clientIp(request)
    const userAgent = request.headers.get("user-agent")

    // ── Sanctioned write: the SECURITY DEFINER RPC (anon client) ──────────────
    // We pass our server-recomputed total; the RPC is expected to recompute /
    // validate and to atomically guard against double-booking. On a not-yet-
    // provisioned schema (sibling migration not applied) we return 503 rather
    // than attempting any direct table insert — the RPC is the only sanctioned
    // guest write path.
    const rpcArgs = {
      p_listing_id: listing.id,
      p_check_in: validated.checkIn,
      p_check_out: validated.checkOut,
      p_guests: validated.guests,
      p_guest_name: guest.fullName,
      p_guest_email: guest.email,
      p_guest_phone: guest.phone || null,
      p_guest_country: guest.country || null,
      p_guest_message: guest.message || null,
      p_arrival_time: guest.arrivalTime || null,
      p_expected_total_pence: quote.totalPence,
      p_currency: quote.currency,
      p_accept_house_rules: guest.acceptHouseRules,
      p_accept_cancellation: guest.acceptCancellation,
      p_accept_terms: guest.acceptTerms,
      p_accept_data_sharing: guest.acceptDataSharing,
      p_ip: ip,
      p_user_agent: userAgent,
    }

    const { data, error } = await supabase.rpc("create_public_reservation", rpcArgs)

    if (error) {
      // Schema/RPC not provisioned yet → graceful "not ready".
      if (isMissing(error.code) || /create_public_reservation/i.test(error.message ?? "")) {
        return NextResponse.json(
          { error: "Online booking is not available for this listing yet.", ready: false },
          { status: 503 }
        )
      }
      // Surface a domain conflict (e.g. dates no longer available) cleanly.
      const msg = error.message ?? ""
      if (/conflict|unavailable|already booked|overlap/i.test(msg)) {
        return NextResponse.json(
          { error: "Those dates are no longer available. Please choose different dates." },
          { status: 409 }
        )
      }
      if (/price|total|mismatch/i.test(msg)) {
        return NextResponse.json(
          { error: "The price has changed. Please refresh and try again." },
          { status: 409 }
        )
      }
      throw error
    }

    // The RPC returns the new reservation (shape owned by the sibling lib). We
    // surface a reference + honest pending status, tolerating shape variance.
    const result = (Array.isArray(data) ? data[0] : data) as
      | Record<string, unknown>
      | null
      | undefined

    const reference =
      (result?.booking_reference as string | undefined) ??
      (result?.reference as string | undefined) ??
      (result?.id as string | undefined) ??
      null

    const status =
      (result?.status as string | undefined) ?? "pending_payment"

    return NextResponse.json(
      {
        ok: true,
        reference,
        reservationId: (result?.id as string | undefined) ?? null,
        status,
        // Honest messaging — NO claim that payment was taken (P5 handles capture).
        held: true,
        currency: quote.currency,
        totalPence: quote.totalPence,
        checkIn: validated.checkIn,
        checkOut: validated.checkOut,
        nights: quote.nights,
        guests: validated.guests,
        listingTitle: listing.title,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    )
  } catch (err) {
    captureException(err, { source: "api/booking/reserve POST", requestId })
    return NextResponse.json(
      { error: "We couldn't complete your booking. Please try again.", requestId },
      { status: 500 }
    )
  }
}
