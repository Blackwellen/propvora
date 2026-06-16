import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { captureException, requestIdFrom } from "@/lib/observability"
import { generateAccessCode, revokeAccessCode, listAccessCodeAudit } from "@/lib/booking/keyless"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/booking/keyless/generate  — OPERATOR issues / revokes a per-booking
 * access code for a CONFIRMED booking.
 *
 * Authorisation: the caller must be a workspace member able to READ the booking
 * via RLS (cookie client). We resolve the booking with the RLS-bound client
 * first; if it isn't visible, we 404. Only then do we use the service role to
 * write the code row (the codes table is service/member-only and the generation
 * itself must succeed even where member RLS WITH CHECK is strict).
 *
 * The PIN itself is NOT returned here — generation stores + audits it; the guest
 * receives it only through the gated safe-release route.
 */

const bodySchema = z.object({
  bookingId: z.string().trim().uuid(),
  action: z.enum(["generate", "revoke"]).default("generate"),
})

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "A valid bookingId is required." }, { status: 400 })
    }
    const { bookingId, action } = parsed.data

    // 1) Authorise: caller must see the booking via RLS.
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 })

    const { data: visible, error: visErr } = await supabase
      .from("bookings")
      .select("id, workspace_id, status")
      .eq("id", bookingId)
      .maybeSingle()
    if (visErr || !visible) {
      return NextResponse.json({ error: "not_found_or_unauthorised" }, { status: 404 })
    }

    // 2) Privileged write with the service role.
    const admin = createAdminClient()

    if (action === "revoke") {
      const ok = await revokeAccessCode(admin, bookingId, { actor: user.id })
      if (!ok) return NextResponse.json({ error: "Could not revoke the access code." }, { status: 400 })
      const audit = await listAccessCodeAudit(admin, bookingId)
      return NextResponse.json({ ok: true, revoked: true, audit }, { status: 200, headers: { "Cache-Control": "no-store" } })
    }

    const result = await generateAccessCode(admin, bookingId, { actor: user.id })
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Could not generate an access code." }, { status: 400 })
    }
    const audit = await listAccessCodeAudit(admin, bookingId)

    // Return the (non-secret) metadata only — never the PIN.
    return NextResponse.json(
      {
        ok: true,
        accessCode: {
          status: result.accessCode?.status ?? "active",
          provider: result.accessCode?.provider ?? null,
          validFrom: result.accessCode?.validFrom ?? null,
          validTo: result.accessCode?.validTo ?? null,
          providerRef: result.accessCode?.providerRef ?? null,
        },
        audit,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    )
  } catch (err) {
    captureException(err, { source: "api/booking/keyless/generate POST", requestId })
    return NextResponse.json(
      { error: "We couldn't issue the access code. Please try again.", requestId },
      { status: 500 }
    )
  }
}
