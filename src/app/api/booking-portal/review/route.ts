import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { submitGuestReview } from "@/lib/booking"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  token: z.string().trim().min(1).optional(),
  ref: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().max(4000).optional(),
})

/** POST /api/booking-portal/review — post-checkout guest review (unlocked server-side). */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: "Please choose a rating." }, { status: 400 })
    const { token, ref, email, rating, title, body } = parsed.data
    if (!token && !(ref && email)) {
      return NextResponse.json({ error: "Provide a booking link, or a reference and email." }, { status: 400 })
    }
    const supabase = await createClient()
    const result = await submitGuestReview(
      supabase,
      { token: token ?? null, ref: ref ?? null, email: email ?? null },
      { rating, title, body }
    )
    if (result.error || !result.id) {
      const isLocked = /unlock after/i.test(result.error ?? "")
      return NextResponse.json({ error: result.error ?? "Could not submit the review." }, { status: isLocked ? 409 : 400 })
    }
    return NextResponse.json({ ok: true, id: result.id }, { status: 201 })
  } catch (err) {
    captureException(err, { source: "api/booking-portal/review POST", requestId })
    return NextResponse.json({ error: "Could not submit the review.", requestId }, { status: 500 })
  }
}
