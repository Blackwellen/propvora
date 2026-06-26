import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { canOnboardCode, isSanctionedCode } from "@/lib/international/guardrails"
import {
  getWorkspaceJurisdiction,
  listSelectableCountries,
} from "@/lib/international/workspace-jurisdiction"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ============================================================================
// Workspace jurisdiction + locale.
//
//   GET  → current jurisdiction (status, currency, locale) + the selectable
//          (offer, non-sanctioned) country list for the picker.
//   POST → set business_country_code / tax_country_code / default_currency /
//          default_language, validated against the live country pack
//          (must be `offer` and not sanctioned). Owner/admin only.
//
// All writes are 42P01/42703-tolerant: a column the live schema lacks is simply
// dropped from the update so the request still succeeds on the columns present.
// ============================================================================

const ALLOWED_ROLES = new Set(["owner", "admin"])

const bodySchema = z.object({
  workspaceId: z.string().min(1).max(100),
  countryCode: z
    .string()
    .trim()
    .length(2, "countryCode must be a 2-letter ISO code")
    .transform((s) => s.toUpperCase()),
  // Optional overrides; if omitted we fall back to the pack defaults.
  currency: z.string().trim().min(1).max(8).optional(),
  locale: z.string().trim().min(2).max(12).optional(),
  // Optional sub-jurisdiction refinement (GB only): "EW" | "SCT" | "NI".
  region: z.string().trim().max(8).optional(),
  // Optional reporting/roll-up currency for mixed-portfolio totals.
  reportingCurrency: z.string().trim().min(1).max(8).optional(),
})

async function requireOwnerAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle()
  return !!member && ALLOWED_ROLES.has(String(member.role))
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = request.nextUrl.searchParams.get("workspaceId")
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
  }

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [current, countries] = await Promise.all([
    getWorkspaceJurisdiction(supabase, workspaceId),
    listSelectableCountries(supabase),
  ])

  // Sub-jurisdiction region + reporting currency live in workspaces.settings JSONB.
  let region: string | null = null
  let reportingCurrency: string | null = null
  try {
    const { data: ws } = await supabase.from("workspaces").select("settings").eq("id", workspaceId).maybeSingle()
    const settings = (ws?.settings ?? {}) as { region?: string; reportingCurrency?: string }
    region = settings.region ?? null
    reportingCurrency = settings.reportingCurrency ?? null
  } catch {
    /* settings column absent — region/reportingCurrency stay null */
  }

  return NextResponse.json({
    current,
    region,
    reportingCurrency,
    countries,
    canEdit: ALLOWED_ROLES.has(String(member.role)),
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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
  const { workspaceId, countryCode } = parsed.data

  // Owner/admin only.
  if (!(await requireOwnerAdmin(supabase, workspaceId, user.id))) {
    return NextResponse.json(
      { error: "Only a workspace owner or admin can change the jurisdiction." },
      { status: 403 }
    )
  }

  // Hard backstop: never accept a sanctioned code, regardless of pack state.
  if (isSanctionedCode(countryCode)) {
    return NextResponse.json(
      { error: "This country is sanctioned and cannot be selected." },
      { status: 422 }
    )
  }

  // Validate against the live pack: must be selectable (offer, non-sanctioned).
  const selectable = await listSelectableCountries(supabase)
  const pack = selectable.find((c) => c.code === countryCode)
  const verdict = canOnboardCode(countryCode, pack?.offerStatus)
  if (!verdict.allowed) {
    return NextResponse.json({ error: verdict.reason }, { status: 422 })
  }
  if (!pack) {
    // No matching offer pack — refuse rather than silently persisting.
    return NextResponse.json(
      { error: "This country is not currently available for selection." },
      { status: 422 }
    )
  }

  const currency = parsed.data.currency ?? pack.defaultCurrency ?? undefined
  const locale = parsed.data.locale ?? pack.defaultLocale ?? undefined

  // CRITICAL: the client reads jurisdiction from the `settings` JSONB column via
  // useWorkspaceJurisdiction() — that hook (not business_country_code) drives the
  // compliance requirement packs, the jurisdiction banner and the Legal section
  // gate. Writing only the dedicated columns left those packs stuck on the GB
  // default, so the selection never took effect client-side. We merge the choice
  // into settings (preserving any existing keys) so the packs go live in V1.
  const { data: wsRow } = await supabase
    .from("workspaces")
    .select("settings")
    .eq("id", workspaceId)
    .maybeSingle()
  const existingSettings = ((wsRow?.settings as Record<string, unknown> | null) ?? {})
  // Sub-jurisdiction region (GB only): EW | SCT | NI. Cleared for any other
  // country so a stale "SCT" can't linger after switching away from GB.
  const regionRaw = (parsed.data.region ?? "").toUpperCase().trim()
  const region = countryCode === "GB" && ["EW", "SCT", "NI"].includes(regionRaw) ? regionRaw : null
  const reportingCurrency = parsed.data.reportingCurrency?.toUpperCase()
  const mergedSettings: Record<string, unknown> = {
    ...existingSettings,
    countryCode,
    ...(currency ? { currency } : {}),
    ...(locale ? { locale } : {}),
    ...(region ? { region } : {}),
    ...(reportingCurrency ? { reportingCurrency } : {}),
  }
  if (!region) delete mergedSettings.region

  // Build the update, then trim to the columns the live schema actually has so
  // a 42703 on any single column can't fail the whole request.
  const desired: Record<string, unknown> = {
    business_country_code: countryCode,
    tax_country_code: countryCode,
    default_currency: currency ?? null,
    currency: currency ?? null,
    default_language: locale ?? null,
    settings: mergedSettings,
    updated_at: new Date().toISOString(),
  }

  async function tryUpdate(payload: Record<string, unknown>) {
    return supabase.from("workspaces").update(payload).eq("id", workspaceId)
  }

  let { error } = await tryUpdate(desired)
  if (error && (error.code === "42703" || /column .* does not exist/i.test(error.message))) {
    // Drop the offending column and retry with the safe core set. `settings`
    // exists in every lineage (the client loads it), so it stays in the safe set
    // — that is what actually drives the packs.
    const safe: Record<string, unknown> = {
      business_country_code: countryCode,
      settings: mergedSettings,
      updated_at: new Date().toISOString(),
    }
    ;({ error } = await tryUpdate(safe))
  }
  if (error) {
    return NextResponse.json({ error: "Failed to save jurisdiction." }, { status: 500 })
  }

  // Record the choice (best-effort; never blocks the save).
  try {
    await supabase.from("audit_log").insert({
      workspace_id: workspaceId,
      actor_user_id: user.id,
      action: "workspace.jurisdiction.updated",
      target_kind: "workspace",
      target_id: workspaceId,
      summary: `Jurisdiction set to ${pack.name} (${countryCode})`,
      metadata: {
        country_code: countryCode,
        currency: currency ?? null,
        locale: locale ?? null,
        legal_status: pack.legalStatus,
        tax_status: pack.taxStatus,
      },
    })
  } catch {
    /* audit table may be absent — non-fatal */
  }

  const current = await getWorkspaceJurisdiction(supabase, workspaceId)
  return NextResponse.json({ ok: true, current })
}
