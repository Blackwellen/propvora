import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { cancelGuestTrip } from "@/lib/booking"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/booking-portal/cancel
 * Body: { token } OR { ref, email }
 *
 * Anon guest self-cancel of an UNPAID hold/pending reservation via the SECURITY
 * DEFINER `booking_portal_cancel` RPC (which only flips hold/pending → cancelled,
 * never a confirmed/paid stay). Honest: returns the new status.
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
    const result = await cancelGuestTrip(supabase, { token: token ?? null, ref: ref ?? null, email: email ?? null })
    if (!result) {
      return NextResponse.json({ error: "We couldn't cancel that booking." }, { status: 404 })
    }
    if (result.status !== "cancelled") {
      return NextResponse.json(
        { error: "This booking can no longer be cancelled here. Please contact the host.", status: result.status },
        { status: 409 }
      )
    }
    return NextResponse.json({ ok: true, status: result.status })
  } catch (err) {
    captureException(err, { source: "api/booking-portal/cancel POST", requestId })
    return NextResponse.json({ error: "Cancel failed", requestId }, { status: 500 })
  }
}
