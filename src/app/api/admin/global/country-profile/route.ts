import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/admin/guard"
import { createAdminClient } from "@/lib/supabase/admin"
import { isHardBlockedCode } from "@/lib/context/sanctions-context"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Admin: update a country's per-domain pack statuses + offer status.
 *
 * GB is the protected baseline — its statuses cannot be downgraded here.
 * Sanctioned countries cannot be moved off 'disabled'/'banned'. Mirrors the
 * per-domain status columns into the normalised tax/privacy tables.
 */

const STATUS = z.enum(["disabled", "generic_only", "research_only", "beta", "reviewed", "enabled"])

const bodySchema = z.object({
  countryCode: z.string().trim().length(2).transform((s) => s.toUpperCase()),
  offerStatus: z.enum(["offer", "restricted", "banned", "unknown"]).optional(),
  legalStatus: STATUS.optional(),
  taxStatus: STATUS.optional(),
  privacyStatus: STATUS.optional(),
  consumerStatus: STATUS.optional(),
  propertyFeaturesStatus: STATUS.optional(),
})

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
  const { countryCode } = parsed.data

  // GB protected baseline.
  if (countryCode === "GB") {
    return NextResponse.json(
      { error: "GB is the protected reviewed baseline and cannot be edited here." },
      { status: 422 }
    )
  }
  // Sanctioned countries stay disabled.
  if (isHardBlockedCode(countryCode)) {
    return NextResponse.json(
      { error: "Sanctioned countries cannot have their pack statuses changed." },
      { status: 422 }
    )
  }

  const supabase = createAdminClient()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (parsed.data.offerStatus) update.offer_status = parsed.data.offerStatus
  if (parsed.data.legalStatus) update.legal_status = parsed.data.legalStatus
  if (parsed.data.taxStatus) update.tax_status = parsed.data.taxStatus
  if (parsed.data.privacyStatus) update.privacy_status = parsed.data.privacyStatus
  if (parsed.data.consumerStatus) update.consumer_status = parsed.data.consumerStatus
  if (parsed.data.propertyFeaturesStatus)
    update.property_features_status = parsed.data.propertyFeaturesStatus

  const { error } = await supabase
    .from("country_profiles")
    .update(update)
    .eq("country_code", countryCode)
  if (error) {
    return NextResponse.json({ error: "Failed to update country profile." }, { status: 500 })
  }

  // Keep the normalised domain tables in step.
  if (parsed.data.taxStatus) {
    await supabase
      .from("country_tax_profiles")
      .update({ status: parsed.data.taxStatus, updated_at: new Date().toISOString() })
      .eq("country_code", countryCode)
  }
  if (parsed.data.privacyStatus) {
    await supabase
      .from("country_privacy_profiles")
      .update({ status: parsed.data.privacyStatus, updated_at: new Date().toISOString() })
      .eq("country_code", countryCode)
  }

  try {
    await supabase.from("country_pack_audit_events").insert({
      country_code: countryCode,
      actor_user_id: admin.userId,
      action: "country.profile.updated",
      detail: update,
    })
  } catch {
    /* non-fatal */
  }

  return NextResponse.json({ ok: true })
}
