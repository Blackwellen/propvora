/**
 * Workspace custom LEGAL modules — data layer + merge logic.
 *
 * Parity with src/lib/compliance/customRequirements.ts. Lets a workspace layer
 * its own legal/regulatory guidance on top of the built-in jurisdiction catalogue
 * (jurisdiction.ts): override a built-in module's label/note, disable a module,
 * or add a bespoke informational module card. Backed by `workspace_legal_modules`
 * (RLS: members read; owner/admin/manager write).
 *
 * SAFETY: custom rows are informational only — they never unlock the England &
 * Wales statutory tooling for a non-reviewed jurisdiction. They change copy +
 * visibility, not capability.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import {
  getLegalJurisdiction,
  type LegalJurisdiction,
  type LegalModuleInfo,
  type LegalModuleKey,
} from "./jurisdiction"

const TABLE = "workspace_legal_modules"
const BUILT_IN_KEYS: LegalModuleKey[] = ["possession", "hmo", "epc", "rra"]

export interface CustomLegalModuleRow {
  id: string
  workspace_id: string
  module_key: string
  label: string | null
  note: string | null
  icon: string
  is_custom: boolean
  disabled: boolean
  sort_order: number
}

/** Merged jurisdiction: built-in modules with workspace overrides + custom cards. */
export interface MergedLegalJurisdiction extends LegalJurisdiction {
  /** Workspace-authored informational modules (no statutory tooling). */
  customModules: LegalModuleInfo[]
}

function isBuiltInKey(k: string): k is LegalModuleKey {
  return (BUILT_IN_KEYS as string[]).includes(k)
}

/**
 * Apply workspace customisations to a built-in jurisdiction.
 * - override rows (is_custom=false) matching a built-in key relabel/renote it and
 *   may mark it disabled (Overview card hidden)
 * - custom rows (is_custom=true) become informational `customModules`
 * Pure — safe to unit test.
 */
export function mergeLegalModules(
  base: LegalJurisdiction,
  rows: CustomLegalModuleRow[]
): MergedLegalJurisdiction {
  const modules = {
    possession: { ...base.modules.possession },
    hmo: { ...base.modules.hmo },
    epc: { ...base.modules.epc },
    rra: { ...base.modules.rra },
  }

  for (const r of rows) {
    if (r.is_custom || !isBuiltInKey(r.module_key)) continue
    const m = modules[r.module_key]
    if (r.label) m.label = r.label
    if (r.note) m.note = r.note
    if (r.disabled) m.disabled = true
  }

  const customModules: LegalModuleInfo[] = rows
    .filter((r) => r.is_custom && !r.disabled)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => ({
      // custom cards re-use the union type but carry their own string key via label;
      // `key` is set to "possession" only to satisfy the type — consumers read label/note.
      key: "possession" as LegalModuleKey,
      applies: true,
      custom: true,
      label: r.label || r.module_key,
      note: r.note || "Workspace-defined legal/regulatory note.",
    }))

  return { ...base, modules, customModules }
}

/** Built-in + custom merged jurisdiction for a workspace. */
export function resolveLegalJurisdiction(
  countryCode: string | null | undefined,
  region: string | null | undefined,
  rows: CustomLegalModuleRow[]
): MergedLegalJurisdiction {
  return mergeLegalModules(getLegalJurisdiction(countryCode, region), rows)
}

// ── CRUD (42P01-safe) ────────────────────────────────────────────────────────

export async function fetchCustomLegalModules(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<CustomLegalModuleRow[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, workspace_id, module_key, label, note, icon, is_custom, disabled, sort_order")
      .eq("workspace_id", workspaceId)
      .order("sort_order", { ascending: true })
    if (error) return []
    return (data as CustomLegalModuleRow[]) ?? []
  } catch {
    return []
  }
}

export interface UpsertLegalModuleInput {
  workspaceId: string
  moduleKey: string
  label: string
  note?: string
  icon?: string
  isCustom?: boolean
  sortOrder?: number
  createdBy?: string | null
}

export async function upsertLegalModule(
  supabase: SupabaseClient,
  input: UpsertLegalModuleInput
): Promise<{ error: string | null }> {
  const { error } = await supabase.from(TABLE).upsert(
    {
      workspace_id: input.workspaceId,
      module_key: input.moduleKey,
      label: input.label,
      note: input.note ?? null,
      icon: input.icon ?? "scale",
      is_custom: input.isCustom ?? false,
      disabled: false,
      sort_order: input.sortOrder ?? 0,
      created_by: input.createdBy ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id,module_key" }
  )
  return { error: error?.message ?? null }
}

/** Disable (hide) a built-in module's Overview card, or re-enable it. */
export async function setLegalModuleDisabled(
  supabase: SupabaseClient,
  workspaceId: string,
  moduleKey: string,
  disabled: boolean,
  createdBy?: string | null
): Promise<{ error: string | null }> {
  if (!disabled) {
    const { error } = await supabase.from(TABLE).delete().eq("workspace_id", workspaceId).eq("module_key", moduleKey).eq("is_custom", false)
    return { error: error?.message ?? null }
  }
  const { error } = await supabase.from(TABLE).upsert(
    {
      workspace_id: workspaceId,
      module_key: moduleKey,
      is_custom: false,
      disabled: true,
      created_by: createdBy ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id,module_key" }
  )
  return { error: error?.message ?? null }
}

export async function deleteCustomLegalModule(
  supabase: SupabaseClient,
  workspaceId: string,
  moduleKey: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from(TABLE).delete().eq("workspace_id", workspaceId).eq("module_key", moduleKey)
  return { error: error?.message ?? null }
}
