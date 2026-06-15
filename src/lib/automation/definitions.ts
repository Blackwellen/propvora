// Automation v2 — versioned DEFINITIONS data layer.
//
// EXTENDS the existing Smart Rules engine: a "definition" is the v2 superset of a
// smart_rule — it carries a structured `trigger` (event / schedule / webhook), a
// `conditions` block, and an ARRAY of `actions` (vs the single action_type on
// smart_rules). Trigger/action shapes are validated against the EXISTING
// catalogue vocabulary in `catalogue.ts` (TRIGGER_CATALOGUE / ACTION_CATALOGUE)
// so v2 never invents triggers/actions the engine can't evaluate or simulate.
//
// CRUD is tolerant + typed: every read is 42P01/empty-safe (a missing table or a
// query error yields a safe empty result, never throws). All writes go through
// the caller's RLS-scoped Supabase client — workspace isolation is enforced by
// RLS, and every query is additionally scoped by workspace_id defensively.

import type { SupabaseClient } from "@supabase/supabase-js"
import { actionDef, triggerDef } from "./catalogue"
import type { ActionType, TriggerType } from "./types"

/** How a definition was authored. Mirrors the DB CHECK on `source`. */
export type DefinitionSource = "builder" | "nl" | "canvas" | "template" | "api"

/** A structured trigger. `kind` is the dispatch mechanism; `type` is the
 * catalogue trigger (validated against TRIGGER_CATALOGUE). */
export interface DefinitionTrigger {
  kind: "event" | "schedule" | "webhook"
  /** Catalogue trigger type (e.g. "compliance_due_soon"). */
  type: TriggerType
  /** Trigger config (e.g. { within_days: 30 }) — same shape as smart_rules.trigger_config. */
  config?: Record<string, unknown>
}

/** A single action in a definition's action array. */
export interface DefinitionAction {
  action_type: ActionType
  config?: Record<string, unknown>
}

export interface AutomationDefinition {
  id: string
  workspace_id: string
  name: string
  description: string | null
  trigger: DefinitionTrigger
  conditions: Record<string, unknown>
  actions: DefinitionAction[]
  enabled: boolean
  version: number
  source: DefinitionSource
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DefinitionInput {
  name: string
  description?: string | null
  trigger: DefinitionTrigger
  conditions?: Record<string, unknown>
  actions: DefinitionAction[]
  enabled?: boolean
  source?: DefinitionSource
}

export interface ValidationResult {
  ok: boolean
  errors: string[]
}

const DEFINITIONS_TABLE = "automation_definitions"
const VALID_SOURCES: DefinitionSource[] = ["builder", "nl", "canvas", "template", "api"]
const VALID_KINDS: DefinitionTrigger["kind"][] = ["event", "schedule", "webhook"]

/**
 * Validate a definition's trigger/conditions/actions against the EXISTING
 * catalogue vocabulary. Pure — no I/O. Returns the list of problems; an empty
 * list means the definition is engine-compatible.
 */
export function validateDefinition(input: Partial<DefinitionInput>): ValidationResult {
  const errors: string[] = []

  if (!input.name || !String(input.name).trim()) errors.push("Name is required.")

  const trig = input.trigger
  if (!trig || typeof trig !== "object") {
    errors.push("A trigger is required.")
  } else {
    if (!VALID_KINDS.includes(trig.kind)) errors.push(`Unknown trigger kind: ${String(trig.kind)}.`)
    if (!trig.type || !triggerDef(String(trig.type))) {
      errors.push(`Unknown trigger type: ${String(trig?.type)}. Must be a catalogue trigger.`)
    }
  }

  const actions = input.actions
  if (!Array.isArray(actions) || actions.length === 0) {
    errors.push("At least one action is required.")
  } else {
    actions.forEach((a, i) => {
      if (!a || typeof a !== "object" || !a.action_type) {
        errors.push(`Action ${i + 1} is malformed.`)
      } else if (!actionDef(String(a.action_type))) {
        errors.push(`Action ${i + 1}: unknown action type "${String(a.action_type)}".`)
      }
    })
  }

  if (input.source && !VALID_SOURCES.includes(input.source)) {
    errors.push(`Unknown source: ${String(input.source)}.`)
  }

  if (input.conditions !== undefined && (typeof input.conditions !== "object" || input.conditions === null || Array.isArray(input.conditions))) {
    errors.push("Conditions must be an object.")
  }

  return { ok: errors.length === 0, errors }
}

type Row = Record<string, unknown>

/** Coerce a DB row into a typed AutomationDefinition (tolerant of jsonb shapes). */
function toDefinition(r: Row): AutomationDefinition {
  const trigger = (r.trigger && typeof r.trigger === "object" ? r.trigger : {}) as DefinitionTrigger
  const actions = Array.isArray(r.actions) ? (r.actions as DefinitionAction[]) : []
  return {
    id: String(r.id),
    workspace_id: String(r.workspace_id),
    name: String(r.name ?? ""),
    description: (r.description as string | null) ?? null,
    trigger,
    conditions: (r.conditions && typeof r.conditions === "object" ? r.conditions : {}) as Record<string, unknown>,
    actions,
    enabled: Boolean(r.enabled),
    version: Number(r.version ?? 1),
    source: (VALID_SOURCES.includes(r.source as DefinitionSource) ? r.source : "builder") as DefinitionSource,
    created_by: (r.created_by as string | null) ?? null,
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
  }
}

/**
 * Create a new definition (version 1). Validates against the catalogue first;
 * throws on invalid input (caller surfaces the message). Returns the new id.
 */
export async function createDefinition(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
  input: DefinitionInput,
): Promise<{ id: string }> {
  const v = validateDefinition(input)
  if (!v.ok) throw new Error(v.errors.join(" "))

  const { data, error } = await supabase
    .from(DEFINITIONS_TABLE)
    .insert({
      workspace_id: workspaceId,
      name: input.name.trim(),
      description: input.description?.toString().trim() || null,
      trigger: input.trigger,
      conditions: input.conditions ?? {},
      actions: input.actions,
      enabled: input.enabled ?? true,
      version: 1,
      source: input.source ?? "builder",
      created_by: userId,
    })
    .select("id")
    .single()
  if (error || !data) throw new Error(error?.message ?? "Failed to create definition")
  return { id: String(data.id) }
}

/**
 * Update a definition. Validates the merged result against the catalogue, then
 * BUMPS the version (every saved change is a new version). Workspace-scoped.
 */
export async function updateDefinition(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string,
  patch: Partial<DefinitionInput>,
): Promise<void> {
  const current = await getDefinition(supabase, workspaceId, id)
  if (!current) throw new Error("Definition not found.")

  const merged: DefinitionInput = {
    name: patch.name ?? current.name,
    description: patch.description ?? current.description,
    trigger: patch.trigger ?? current.trigger,
    conditions: patch.conditions ?? current.conditions,
    actions: patch.actions ?? current.actions,
    enabled: patch.enabled ?? current.enabled,
    source: patch.source ?? current.source,
  }
  const v = validateDefinition(merged)
  if (!v.ok) throw new Error(v.errors.join(" "))

  const update: Row = { updated_at: new Date().toISOString(), version: current.version + 1 }
  if (patch.name !== undefined) update.name = merged.name.trim()
  if (patch.description !== undefined) update.description = (merged.description?.toString().trim() || null)
  if (patch.trigger !== undefined) update.trigger = merged.trigger
  if (patch.conditions !== undefined) update.conditions = merged.conditions
  if (patch.actions !== undefined) update.actions = merged.actions
  if (patch.enabled !== undefined) update.enabled = merged.enabled
  if (patch.source !== undefined) update.source = merged.source

  const { error } = await supabase
    .from(DEFINITIONS_TABLE)
    .update(update)
    .eq("id", id)
    .eq("workspace_id", workspaceId)
  if (error) throw new Error(error.message)
}

/** Enable or disable a definition (does NOT bump version — a lifecycle toggle). */
export async function setDefinitionEnabled(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string,
  enabled: boolean,
): Promise<void> {
  const { error } = await supabase
    .from(DEFINITIONS_TABLE)
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", workspaceId)
  if (error) throw new Error(error.message)
}

/** Explicit version bump without other edits (e.g. republish). */
export async function bumpDefinitionVersion(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string,
): Promise<number | null> {
  const current = await getDefinition(supabase, workspaceId, id)
  if (!current) return null
  const next = current.version + 1
  const { error } = await supabase
    .from(DEFINITIONS_TABLE)
    .update({ version: next, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", workspaceId)
  if (error) throw new Error(error.message)
  return next
}

/** List definitions for a workspace (tolerant — empty on any error). */
export async function listDefinitions(
  supabase: SupabaseClient,
  workspaceId: string,
  opts: { enabledOnly?: boolean } = {},
): Promise<AutomationDefinition[]> {
  try {
    let q = supabase
      .from(DEFINITIONS_TABLE)
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
    if (opts.enabledOnly) q = q.eq("enabled", true)
    const { data, error } = await q
    if (error || !data) return []
    return (data as Row[]).map(toDefinition)
  } catch {
    return []
  }
}

/** Fetch a single definition (tolerant — null if missing/error). */
export async function getDefinition(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string,
): Promise<AutomationDefinition | null> {
  try {
    const { data, error } = await supabase
      .from(DEFINITIONS_TABLE)
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (error || !data) return null
    return toDefinition(data as Row)
  } catch {
    return null
  }
}

/** Delete a definition. Runs reference it via ON DELETE SET NULL, so history is
 * preserved. Workspace-scoped. */
export async function deleteDefinition(
  supabase: SupabaseClient,
  workspaceId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from(DEFINITIONS_TABLE)
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId)
  if (error) throw new Error(error.message)
}
