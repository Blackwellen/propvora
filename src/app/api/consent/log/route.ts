import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/consent/log — durable, server-side evidence of a cookie-consent
 * choice (PECR record-keeping).
 *
 * The AUTHORITATIVE consent state lives client-side (first-party cookie +
 * localStorage); this endpoint just mirrors each choice into
 * `cookie_consent_log` so we retain proof even if the client clears storage.
 *
 * - Works for logged-out visitors (keyed by an anonymous client_id from the
 *   consent cookie) and logged-in users (additionally linked to user_id).
 * - Writes via the service role because anonymous visitors have no auth.uid()
 *   and the table is otherwise write-closed to clients (RLS).
 * - Stores only the choice + minimal evidence (IP / UA). No other PII.
 */

const schema = z.object({
  clientId: z.string().min(1).max(128).optional(),
  policyVersion: z.number().int().min(0).max(1000),
  analytics: z.boolean(),
  marketing: z.boolean(),
})

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
  const { clientId, policyVersion, analytics, marketing } = parsed.data

  // Link to the user if one is signed in (optional — anon visitors are allowed).
  let userId: string | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? null
  } catch {
    /* anonymous visitor */
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    null

  try {
    const admin = createAdminClient()
    const { error } = await admin.from("cookie_consent_log").insert({
      client_id: clientId ?? null,
      user_id: userId,
      policy_version: policyVersion,
      necessary: true,
      analytics,
      marketing,
      ip,
      user_agent: request.headers.get("user-agent"),
    })
    if (error) {
      // Logging is best-effort evidence; never fail the user's consent action.
      console.error("[consent/log] insert failed:", error.message)
      return NextResponse.json({ ok: false }, { status: 200 })
    }
  } catch (err) {
    console.error("[consent/log] error:", err)
    return NextResponse.json({ ok: false }, { status: 200 })
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
}
