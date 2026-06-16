import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/admin/guard"
import { createAdminClient } from "@/lib/supabase/admin"
import { isHardBlockedCode } from "@/lib/context/sanctions-context"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Admin: change a country's RELEASE GATE state.
 *
 * The hard guarantee — a country CANNOT be enabled unless every required review
 * is approved and it is not sanctioned — is enforced in THREE layers:
 *   1. This route refuses an 'enabled' transition for a sanctioned code outright.
 *   2. This route pre-checks release readiness via country_release_ready().
 *   3. The DB BEFORE UPDATE trigger physically rejects an illegal enable
 *      (23514) — so even a direct DB write cannot bypass it.
 *
 * Platform-admin only.
 */

const bodySchema = z.object({
  countryCode: z.string().trim().length(2).transform((s) => s.toUpperCase()),
  state: z.enum(["locked", "in_review", "staged", "enabled", "suspended"]),
  suspendedReason: z.string().trim().max(500).optional(),
})

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("country_release_gates")
    .select("country_code, state, required_reviews, enabled_at, suspended_reason")
  return NextResponse.json({ gates: data ?? [] })
}

export async function PATCH(request: NextRequest) {
  let admin
  try {
    admin = await requireAdmin()
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }
  const { countryCode, state, suspendedReason } = parsed.data

  const supabase = createAdminClient()

  // Layer 1: never enable a sanctioned country.
  if (state === "enabled" && isHardBlockedCode(countryCode)) {
    return NextResponse.json(
      { error: "Sanctioned countries can never be enabled." },
      { status: 422 }
    )
  }

  // Layer 2: pre-check release readiness via the DB function for a clear message.
  if (state === "enabled") {
    const { data: ready, error: rpcErr } = await supabase.rpc("country_release_ready", {
      p_country_code: countryCode,
    })
    if (!rpcErr && ready === false) {
      return NextResponse.json(
        {
          error:
            "This country cannot be enabled: not all required reviews are approved (or it is sanctioned).",
        },
        { status: 422 }
      )
    }
  }

  const update: Record<string, unknown> = { state, updated_at: new Date().toISOString() }
  if (state === "suspended") update.suspended_reason = suspendedReason ?? null
  if (state === "enabled") update.enabled_by = admin.userId

  // Layer 3: the BEFORE UPDATE trigger is the physical backstop.
  const { error } = await supabase
    .from("country_release_gates")
    .update(update)
    .eq("country_code", countryCode)

  if (error) {
    // 23514 = check_violation raised by enforce_country_release_gate().
    const blocked = error.code === "23514" || /cannot be enabled/i.test(error.message)
    return NextResponse.json(
      {
        error: blocked
          ? "Blocked by release gate: required reviews are not all approved (or the country is sanctioned)."
          : "Failed to update release gate.",
      },
      { status: blocked ? 422 : 500 }
    )
  }

  try {
    await supabase.from("country_pack_audit_events").insert({
      country_code: countryCode,
      actor_user_id: admin.userId,
      action: "country.release_gate.changed",
      detail: { state },
    })
  } catch {
    /* non-fatal */
  }

  return NextResponse.json({ ok: true, countryCode, state })
}
