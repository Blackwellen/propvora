import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { reportGuestIssue } from "@/lib/booking"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  token: z.string().trim().min(1).optional(),
  ref: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  category: z.string().trim().max(60).optional(),
  severity: z.enum(["low", "normal", "urgent"]).optional(),
  subject: z.string().trim().min(2).max(160),
  detail: z.string().trim().max(4000).optional(),
})

/** POST /api/booking-portal/issue — guest reports a problem with their stay. */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: "Please describe the issue." }, { status: 400 })
    const { token, ref, email, ...input } = parsed.data
    if (!token && !(ref && email)) {
      return NextResponse.json({ error: "Provide a booking link, or a reference and email." }, { status: 400 })
    }
    const supabase = await createClient()
    const result = await reportGuestIssue(
      supabase,
      { token: token ?? null, ref: ref ?? null, email: email ?? null },
      input
    )
    if (result.error || !result.id) {
      return NextResponse.json({ error: result.error ?? "Could not report the issue." }, { status: 400 })
    }
    return NextResponse.json({ ok: true, id: result.id }, { status: 201 })
  } catch (err) {
    captureException(err, { source: "api/booking-portal/issue POST", requestId })
    return NextResponse.json({ error: "Could not report the issue.", requestId }, { status: 500 })
  }
}
