/**
 * Workspace custom compliance requirements — data layer + merge logic.
 *
 * Lets a workspace layer its own requirements on top of the built-in
 * per-jurisdiction catalogue (requirements.ts): add bespoke requirement types and
 * disable built-ins that don't apply. Backed by `workspace_compliance_requirements`
 * (RLS: members read; owner/admin/manager write).
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import {
  getComplianceJurisdiction,
  type ComplianceRequirementDef,
  type ComplianceIconKey,
  type ComplianceKind,
} from "./requirements"

/** Raw row of `workspace_compliance_requirements`. */
export interface CustomRequirementRow {
  id: string
  workspace_id: string
  req_key: string
  label: string | null
  helper: string | null
  critical: boolean
  kind: ComplianceKind
  icon: ComplianceIconKey
  is_custom: boolean
  disabled: boolean
  sort_order: number
}

const TABLE = "workspace_compliance_requirements"

/** Allowed icon keys (mirror of ComplianceIconKey) for validation. */
export const ICON_KEYS: ComplianceIconKey[] = [
  "flame", "zap", "leaf", "fire", "building", "shield", "plug", "droplet", "wind", "home", "file",
]

/** Allowed enum-safe kinds for a custom requirement. */
export const KIND_KEYS: ComplianceKind[] = [
  "gas_safety", "eicr", "epc", "fire_alarm", "hmo_licence", "insurance", "pat", "other",
]

/**
 * Merge built-in requirements with workspace customisations.
 * - rows flagged `disabled` hide the matching built-in (by req_key)
 * - rows flagged `is_custom` are appended (ordered by sort_order), kept before
 *   the always-last "Other" entry
 * Pure — safe to unit test.
 */
export function mergeRequirements(
  builtIn: ComplianceRequirementDef[],
  rows: CustomRequirementRow[]
): ComplianceRequirementDef[] {
  const disabled = new Set(rows.filter((r) => r.disabled).map((r) => r.req_key))
  const customs = rows
    .filter((r) => r.is_custom && !r.disabled)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map<ComplianceRequirementDef>((r) => ({
      key: r.req_key,
      label: r.label || r.req_key,
      helper: r.helper || "Custom compliance requirement",
      critical: r.critical,
      kind: r.kind,
      icon: r.icon,
    }))

  const kept = builtIn.filter((b) => !disabled.has(b.key))
  // Keep the catalogue's trailing "Other" entry last.
  const otherIdx = kept.findIndex((b) => b.key === "other")
  if (otherIdx === -1) return [...kept, ...customs]
  const other = kept[otherIdx]
  const head = kept.filter((_, i) => i !== otherIdx)
  return [...head, ...customs, other]
}

/** Built-in + custom requirements for a workspace jurisdiction. */
export function resolveRequirements(
  countryCode: string | null | undefined,
  region: string | null | undefined,
  rows: CustomRequirementRow[]
): ComplianceRequirementDef[] {
  const builtIn = getComplianceJurisdiction(countryCode, region).reqs
  return mergeRequirements(builtIn, rows)
}

// ── CRUD (42P01-safe) ────────────────────────────────────────────────────────

export async function fetchCustomRequirements(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<CustomRequirementRow[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, workspace_id, req_key, label, helper, critical, kind, icon, is_custom, disabled, sort_order")
      .eq("workspace_id", workspaceId)
      .order("sort_order", { ascending: true })
    if (error) return []
    return (data as CustomRequirementRow[]) ?? []
  } catch {
    return []
  }
}

export interface UpsertCustomRequirementInput {
  workspaceId: string
  reqKey: string
  label: string
  helper?: string
  critical?: boolean
  kind?: ComplianceKind
  icon?: ComplianceIconKey
  sortOrder?: number
  createdBy?: string | null
}

export async function upsertCustomRequirement(
  supabase: SupabaseClient,
  input: UpsertCustomRequirementInput
): Promise<{ error: string | null }> {
  const { error } = await supabase.from(TABLE).upsert(
    {
      workspace_id: input.workspaceId,
      req_key: input.reqKey,
      label: input.label,
      helper: input.helper ?? null,
      critical: input.critical ?? false,
      kind: input.kind ?? "other",
      icon: input.icon ?? "file",
      is_custom: true,
      disabled: false,
      sort_order: input.sortOrder ?? 0,
      created_by: input.createdBy ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id,req_key" }
  )
  return { error: error?.message ?? null }
}

/** Toggle a built-in requirement on/off by persisting a disable marker. */
export async function setBuiltInDisabled(
  supabase: SupabaseClient,
  workspaceId: string,
  reqKey: string,
  disabled: boolean,
  createdBy?: string | null
): Promise<{ error: string | null }> {
  if (!disabled) {
    // Re-enable: remove the disable marker.
    const { error } = await supabase.from(TABLE).delete().eq("workspace_id", workspaceId).eq("req_key", reqKey).eq("is_custom", false)
    return { error: error?.message ?? null }
  }
  const { error } = await supabase.from(TABLE).upsert(
    {
      workspace_id: workspaceId,
      req_key: reqKey,
      is_custom: false,
      disabled: true,
      kind: "other",
      icon: "file",
      created_by: createdBy ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id,req_key" }
  )
  return { error: error?.message ?? null }
}

export async function deleteCustomRequirement(
  supabase: SupabaseClient,
  workspaceId: string,
  reqKey: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from(TABLE).delete().eq("workspace_id", workspaceId).eq("req_key", reqKey)
  return { error: error?.message ?? null }
}
