import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { lookupGuestTrip } from "@/lib/booking/portal"
import { releaseAccessCode } from "@/lib/booking/keyless"
import { captureException, requestIdFrom } from "@/lib/observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/booking/keyless/release  — GUEST safe-release of a door access code.
 *
 * Flow (defence in depth):
 *  1. The guest proves they own the booking via the anon SECURITY DEFINER portal
 *     RPC (token OR booking ref + the email they booked with). We never trust a
 *     bookingId sent by the client.
 *  2. Only then do we use a SERVICE-ROLE client to call releaseAccessCode, which
 *     RE-CHECKS, server-side: booking PAID + CONFIRMED + now ∈ validity window.
 *     The PIN is returned ONLY when every gate passes; otherwise a gated reason
 *     comes back with NO code, and a `denied` audit row is written.
 *
 * The access code is NEVER readable by the guest's own (anon) session — RLS has
 * no anon policy on booking_access_codes. This route is the single disclosure
 * point and it is fully audited.
 */

const bodySchema = z
  .object({
    token: z.string().trim().min(1).max(200).optional(),
    ref: z.string().trim().min(1).max(60).optional(),
    email: z.string().trim().email().max(160).optional(),
  })
  .refine((b) => !!b.token || (!!b.ref && !!b.email), {
    message: "Provide a portal link token, or your booking reference and email.",
  })

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Provide your portal link, or your booking reference and email." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      )
    }

    // 1) Prove ownership with the ANON client through the portal RPC.
    const anon = await createClient()
    const trip = await lookupGuestTrip(anon, {
      token: parsed.data.token ?? null,
      ref: parsed.data.ref ?? null,
      email: parsed.data.email ?? null,
    })
    if (!trip) {
      // Do not leak whether the ref exists — generic auth failure.
      return NextResponse.json(
        { error: "We couldn't find a booking matching those details." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      )
    }

    // 2) Service-role release — re-gated inside releaseAccessCode.
    const admin = createAdminClient()
    const result = await releaseAccessCode(admin, trip.bookingId, { actor: "guest" })

    if (!result.ok) {
      // Gated (not paid / not confirmed / outside window / revoked / no code).
      const status = result.reason === "not_found" || result.reason === "no_code" ? 404 : 403
      return NextResponse.json(
        { ok: false, gated: true, reason: result.reason, error: result.error },
        { status, headers: { "Cache-Control": "no-store" } }
      )
    }

    return NextResponse.json(
      {
        ok: true,
        code: result.accessCode?.code ?? null,
        provider: result.accessCode?.provider ?? null,
        validFrom: result.accessCode?.validFrom ?? null,
        validTo: result.accessCode?.validTo ?? null,
        instructions: result.instructions ?? null,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    )
  } catch (err) {
    captureException(err, { source: "api/booking/keyless/release POST", requestId })
    return NextResponse.json(
      { error: "We couldn't release your access code. Please try again.", requestId },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    )
  }
}
