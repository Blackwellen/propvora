import type { SupabaseClient } from "@supabase/supabase-js"
import {
  defaultFor,
  FLAG_REGISTRY,
  type V2FlagKey,
} from "./registry"

/**
 * v2 feature-flag accessor.
 *
 * Resolution order for a flag (first definitive answer wins):
 *   1. Per-workspace override row in `workspace_feature_flags` (if the table
 *      exists and a row is present for this workspace + flag).
 *   2. Global row in `platform_feature_flags` (live schema: flag_key / enabled).
 *   3. Registry default (OFF for every v2 flag).
 *
 * TOLERANT BY DESIGN: a missing table, missing column, RLS denial, transient
 * error or absent Supabase client all collapse to the registry default. This
 * means that before the foundation tables/migration land, EVERY v2 flag reads
 * as its default (false) and the app is unchanged. The accessor never throws.
 *
 * NOTE: defaults are OFF, so failing to the default is also failing CLOSED for
 * v2 surface area — we never accidentally light up marketplace/customer/etc.
 */

export type { V2FlagKey } from "./registry"
export {
  FLAG_REGISTRY,
  FLAG_DEFINITIONS,
  V2_FLAG_KEYS,
  defaultFor,
  isV2FlagKey,
} from "./registry"

export interface IsFeatureEnabledOptions {
  /** Optional workspace to check per-workspace overrides for. */
  workspaceId?: string | null
  /**
   * Optional Supabase client. If omitted, no DB lookup happens and the flag
   * resolves to its registry default (OFF). Pass any anon/server/admin client.
   */
  supabase?: SupabaseClient | null
}

// PostgREST surfaces missing relations/columns differently from raw Postgres.
const SCHEMA_GAP_CODES = new Set(["42P01", "42703", "PGRST205", "PGRST204", "PGRST116"])
function isSchemaGap(code?: string | null): boolean {
  return !!code && SCHEMA_GAP_CODES.has(code)
}

/**
 * Read the global `platform_feature_flags` row for a flag. Returns the boolean
 * `enabled`, or null if the row/table is absent or unreadable.
 */
async function readGlobalFlag(
  supabase: SupabaseClient,
  dbKey: string
): Promise<boolean | null> {
  try {
    const { data, error } = await supabase
      .from("platform_feature_flags")
      .select("enabled")
      .eq("flag_key", dbKey)
      .maybeSingle()
    if (error) {
      // Schema gap or RLS/transient — defer to the default.
      void isSchemaGap(error.code)
      return null
    }
    if (!data) return null
    return Boolean((data as { enabled?: boolean }).enabled)
  } catch {
    return null
  }
}

/**
 * Read a per-workspace override from `workspace_feature_flags` (owned by the
 * foundation agent; may not exist yet). Returns the override boolean, or null
 * if there is no override / the table is absent / unreadable.
 */
async function readWorkspaceOverride(
  supabase: SupabaseClient,
  workspaceId: string,
  dbKey: string
): Promise<boolean | null> {
  try {
    const { data, error } = await supabase
      .from("workspace_feature_flags")
      .select("enabled")
      .eq("workspace_id", workspaceId)
      .eq("flag_key", dbKey)
      .maybeSingle()
    if (error) {
      void isSchemaGap(error.code)
      return null
    }
    if (!data) return null
    const v = (data as { enabled?: boolean | null }).enabled
    return v === null || v === undefined ? null : Boolean(v)
  } catch {
    return null
  }
}

/**
 * Is a v2 feature enabled? Tolerant, never throws. Resolves per-workspace
 * override → global flag → registry default (OFF).
 *
 * When NEXT_PUBLIC_QA_ALL_FLAGS=true all flags return true — QA discovery only.
 */
export async function isFeatureEnabled(
  flag: V2FlagKey,
  options: IsFeatureEnabledOptions = {}
): Promise<boolean> {
  if (process.env.NEXT_PUBLIC_QA_ALL_FLAGS === "true") return true
  const def = FLAG_REGISTRY[flag]
  const fallback = defaultFor(flag)
  if (!def) return fallback

  const { supabase, workspaceId } = options
  if (!supabase) return fallback

  // 1) Per-workspace override takes precedence.
  if (workspaceId) {
    const override = await readWorkspaceOverride(supabase, workspaceId, def.dbKey)
    if (override !== null) return override
  }

  // 2) Global platform flag.
  const global = await readGlobalFlag(supabase, def.dbKey)
  if (global !== null) return global

  // 3) Registry default (OFF).
  return fallback
}

/**
 * Batch resolver: evaluate several flags at once for the same context.
 * Convenience wrapper around isFeatureEnabled (kept simple/tolerant).
 */
export async function resolveFlags(
  flags: V2FlagKey[],
  options: IsFeatureEnabledOptions = {}
): Promise<Record<string, boolean>> {
  const entries = await Promise.all(
    flags.map(async (f) => [f, await isFeatureEnabled(f, options)] as const)
  )
  return Object.fromEntries(entries)
}

/**
 * Parent/child flag dependency rules (audit doc 17 §5.3). Applied AFTER raw
 * resolution so a child flag can never be effectively-on while its parent is
 * off — even if a stray DB row says otherwise. Pure + tolerant: only mutates
 * keys that are present in the supplied map.
 */
export function applyFlagDependencies(
  map: Record<string, boolean>
): Record<string, boolean> {
  const out = { ...map }
  const off = (k: string) => { if (k in out) out[k] = false }

  // Marketplace sub-flags require the master switch.
  if (out.marketplaceEnabled === false) {
    ["marketplaceStays", "marketplaceSuppliers", "marketplaceEmergency",
     "marketplacePayments", "marketplaceEscrow", "marketplaceDisputes"].forEach(off)
  }
  // Escrow + disputes require marketplace payments.
  if (out.marketplacePayments === false) {
    ["marketplaceEscrow", "marketplaceDisputes"].forEach(off)
  }
  // Full automation canvas implies (and requires) canvas-lite.
  if (out.automationsFull === true && "canvasLite" in out) out.canvasLite = true
  return out
}

/** Flag keys that influence operator navigation / surface visibility. */
export const NAV_FLAG_KEYS: V2FlagKey[] = [
  "marketplaceEnabled",
  "bookingManagement",
  "directBookingPages",
  "accountingGl",
  "automationsFull",
  "canvasLite",
  "customerWorkspace",
  "supplierWorkspace",
  "planningEnabled",
  "legalSection",
  "affiliateEnabled",
  "helpCentre",
  "guidedHelp",
]

/**
 * Resolve the nav-relevant flags for a context and apply dependency rules.
 * Returns a plain serialisable boolean map safe to pass from a server layout
 * into client navigation components. Defaults (all OFF) on any failure.
 */
export async function resolveNavFlags(
  options: IsFeatureEnabledOptions = {}
): Promise<Record<string, boolean>> {
  const raw = await resolveFlags(NAV_FLAG_KEYS, options)
  return applyFlagDependencies(raw)
}
