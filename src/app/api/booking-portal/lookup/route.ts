import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { lookupGuestTrip } from "@/lib/booking"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/booking-portal/lookup
 * Body: { token } OR { ref, email }
 *
 * Anon magic-link guest portal read. Resolves a single trip via the SECURITY
 * DEFINER `booking_portal_lookup` RPC. The RPC enforces the ref+email pairing /
 * token validity; this route never touches `bookings` directly. Returns the safe
 * trip projection or 404 (without leaking which half of ref/email was wrong).
 */
const schema = z.object({
  token: z.string().trim().min(1).optional(),
  ref: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
})

export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    const { token, ref, email } = parsed.data
    if (!token && !(ref && email)) {
      return NextResponse.json({ error: "Provide a booking link, or a reference and email." }, { status: 400 })
    }

    const supabase = await createClient()
    const trip = await lookupGuestTrip(supabase, { token: token ?? null, ref: ref ?? null, email: email ?? null })
    if (!trip) {
      return NextResponse.json(
        { error: "We couldn't find a booking with those details." },
        { status: 404 }
      )
    }
    return NextResponse.json({ trip }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    captureException(err, { source: "api/booking-portal/lookup POST", requestId })
    return NextResponse.json({ error: "Lookup failed", requestId }, { status: 500 })
  }
}
