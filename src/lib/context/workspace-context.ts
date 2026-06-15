import type { SupabaseClient } from "@supabase/supabase-js"
import type { WorkspaceContext, WorkspaceType } from "./context-types"
import { firstString, normaliseCountry, safeRow } from "./_safe"

/**
 * Resolve the WORKSPACE block: type, business country, data region, default
 * currency/language and plan/tier.
 *
 * Safe defaults (used when the row, or the v2 columns on it, are absent):
 *   type=operator, country=GB, region=eu, currency=GBP, language=en-GB,
 *   plan=starter. These keep a v1 (unmigrated) environment fully operational.
 */

const DEFAULTS: Omit<WorkspaceContext, "id" | "isFallback"> = {
  type: "operator",
  businessCountryCode: "GB",
  dataRegion: "eu",
  defaultCurrency: "GBP",
  defaultLanguage: "en-GB",
  plan: "starter",
  tier: "starter",
}

const WORKSPACE_TYPES: WorkspaceType[] = [
  "operator",
  "supplier",
  "customer",
  "platform_admin",
]

function toWorkspaceType(v: unknown): WorkspaceType {
  return typeof v === "string" && (WORKSPACE_TYPES as string[]).includes(v)
    ? (v as WorkspaceType)
    : "operator"
}

export async function resolveWorkspaceContext(
  supabase: SupabaseClient,
  workspaceId?: string | null
): Promise<WorkspaceContext> {
  if (!workspaceId) {
    return { id: null, ...DEFAULTS, isFallback: true }
  }

  // Select '*' so missing v2 columns don't 42703 the whole query; we then read
  // whichever columns happen to exist.
  const row = await safeRow<Record<string, unknown>>(() =>
    supabase.from("workspaces").select("*").eq("id", workspaceId).maybeSingle()
  )

  if (!row) {
    return { id: workspaceId, ...DEFAULTS, isFallback: true }
  }

  const plan =
    firstString(row.plan, row.tier, row.plan_tier) ?? DEFAULTS.plan
  const country =
    normaliseCountry(row.business_country_code) ??
    normaliseCountry(row.country_code) ??
    normaliseCountry(row.country) ??
    DEFAULTS.businessCountryCode

  return {
    id: workspaceId,
    type: toWorkspaceType(row.workspace_type ?? row.type),
    businessCountryCode: country,
    dataRegion: firstString(row.data_region) ?? DEFAULTS.dataRegion,
    defaultCurrency:
      firstString(row.default_currency, row.base_currency, row.currency) ??
      DEFAULTS.defaultCurrency,
    defaultLanguage:
      firstString(row.default_language, row.language, row.locale) ??
      DEFAULTS.defaultLanguage,
    plan,
    tier: plan,
    isFallback: false,
  }
}
