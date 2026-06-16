import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/admin/guard"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Admin: record a country-pack review verdict for a domain. Upserts the
 * (country_code, domain) row. Recording an 'approved' verdict for every required
 * domain is what makes a country release-ready (see ../release-gate).
 *
 * Platform-admin only (requireAdmin fails closed).
 */

const DOMAINS = ["legal", "tax", "privacy", "sanctions", "commercial"] as const

const bodySchema = z.object({
  countryCode: z.string().trim().length(2).transform((s) => s.toUpperCase()),
  domain: z.enum(DOMAINS),
  verdict: z.enum(["pending", "approved", "rejected"]),
  notes: z.string().trim().max(2000).optional(),
})

export async function POST(request: NextRequest) {
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
  const { countryCode, domain, verdict, notes } = parsed.data

  const supabase = createAdminClient()
  const { error } = await supabase.from("country_pack_reviews").upsert(
    {
      country_code: countryCode,
      domain,
      verdict,
      reviewer: admin.userId,
      reviewer_name: admin.email ?? "Platform admin",
      reviewed_at: verdict === "pending" ? null : new Date().toISOString(),
      notes: notes ?? null,
    },
    { onConflict: "country_code,domain" }
  )
  if (error) {
    return NextResponse.json({ error: "Failed to record review." }, { status: 500 })
  }

  // Best-effort audit event.
  try {
    await supabase.from("country_pack_audit_events").insert({
      country_code: countryCode,
      actor_user_id: admin.userId,
      action: "country.review.recorded",
      detail: { domain, verdict },
    })
  } catch {
    /* audit table absent — non-fatal */
  }

  return NextResponse.json({ ok: true })
}
