import "server-only"

// Shared server helpers for the Automation v2 builder API routes.
//
//  - Auth + workspace membership resolution (cookie-scoped RLS client).
//  - Tolerant access to the sibling-owned definitions / dry-run libraries:
//    we import them DYNAMICALLY and fall back to a smart_rules-backed
//    implementation when they aren't present yet, so these routes work
//    standalone and never hard-crash on a missing module.
//  - Draft validation against the trigger/action CATALOGUE (single source of
//    truth) — the AI can only ever produce a draft built from real vocabulary.

import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import {
  TRIGGER_CATALOGUE,
  ACTION_CATALOGUE,
  triggerDef,
  actionDef,
} from "@/lib/automation/catalogue"
import type { ActionType, TriggerType } from "@/lib/automation/types"
import type {
  AutomationDefinition,
  DefinitionCondition,
  DryRunResponse,
  DryRunStep,
} from "@/components/automations-builder/types"

export interface AuthedCtx {
  supabase: SupabaseClient
  userId: string
  /** null when caller passed no real workspace (demo / unauthenticated-to-ws). */
  workspaceId: string | null
}

/** Resolve the authenticated user; verify membership when a workspace is given. */
export async function resolveAuthedWorkspace(
  workspaceId: string | undefined
): Promise<{ ok: true; ctx: AuthedCtx } | { ok: false; status: number; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, status: 401, error: "Unauthorized" }

  // Resolve the active workspace if the caller didn't pass one.
  let ws = workspaceId && workspaceId !== "demo-workspace" ? workspaceId : null
  if (!ws) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", user.id)
      .maybeSingle()
    ws = (profile?.current_workspace_id as string | undefined) ?? null
  }

  if (ws) {
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", ws)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!member) return { ok: false, status: 403, error: "Forbidden" }
  }

  return { ok: true, ctx: { supabase: supabase as unknown as SupabaseClient, userId: user.id, workspaceId: ws } }
}

// ── Catalogue-checked draft validation ──────────────────────────────────────

const VALID_OPS = new Set(["lte", "gte", "eq"])

/**
 * Validate + normalise a candidate definition against the live catalogue.
 * Unknown trigger/action types, or config keys not in the catalogue, are
 * dropped (never trusted). Returns the cleaned definition + any honesty notes.
 */
export function validateDefinition(raw: unknown): {
  definition: AutomationDefinition | null
  notes: string[]
} {
  const notes: string[] = []
  if (!raw || typeof raw !== "object") return { definition: null, notes: ["No definition produced."] }
  const r = raw as Record<string, unknown>

  const tDef = triggerDef(String(r.trigger_type))
  if (!tDef) {
    notes.push(`Trigger "${String(r.trigger_type)}" isn't a known automation trigger.`)
    return { definition: null, notes }
  }
  const aDef = actionDef(String(r.action_type))
  if (!aDef) {
    notes.push(`Action "${String(r.action_type)}" isn't a known automation action.`)
    return { definition: null, notes }
  }

  // Trigger config: keep only catalogue keys; coerce number fields.
  const triggerCfg: Record<string, string | number> = {}
  const rawTrigCfg = (r.trigger_config && typeof r.trigger_config === "object" ? r.trigger_config : {}) as Record<string, unknown>
  for (const f of tDef.configFields) {
    const v = rawTrigCfg[f.key]
    if (v == null || v === "") {
      if (f.default != null) triggerCfg[f.key] = f.default
      continue
    }
    triggerCfg[f.key] = f.kind === "number" ? Number(v) || 0 : String(v)
  }

  // Conditions: only allow keys that belong to this trigger's config fields.
  const allowedKeys = new Set(tDef.configFields.map((f) => f.key))
  const conditions: DefinitionCondition[] = []
  if (Array.isArray(r.conditions)) {
    for (const c of r.conditions as unknown[]) {
      if (!c || typeof c !== "object") continue
      const cc = c as Record<string, unknown>
      const key = String(cc.key ?? "")
      const op = String(cc.op ?? "")
      if (!allowedKeys.has(key) || !VALID_OPS.has(op)) {
        if (key) notes.push(`Dropped a condition on "${key}" that isn't supported by this trigger.`)
        continue
      }
      conditions.push({ key, op: op as DefinitionCondition["op"], value: String(cc.value ?? "") })
    }
  }

  // Action config: keep only catalogue keys; fall back to defaults.
  const actionCfg: Record<string, string> = {}
  const rawActCfg = (r.action_config && typeof r.action_config === "object" ? r.action_config : {}) as Record<string, unknown>
  for (const f of aDef.configFields) {
    const v = rawActCfg[f.key]
    actionCfg[f.key] = v == null ? String(f.default ?? "") : String(v)
  }

  const definition: AutomationDefinition = {
    name: String(r.name ?? "").trim().slice(0, 120) || tDef.label,
    description: typeof r.description === "string" ? r.description.slice(0, 400) : "",
    trigger_type: tDef.type as TriggerType,
    trigger_config: triggerCfg,
    conditions,
    action_type: aDef.type as ActionType,
    action_config: actionCfg,
    // Builders are review-first by default; the AI can never force auto-run.
    review_required: r.review_required === false ? false : true,
    enabled: r.enabled === false ? false : true,
  }
  return { definition, notes }
}

/** Fold the structured conditions into the condition_config blob for storage. */
export function conditionConfig(def: AutomationDefinition): Record<string, unknown> {
  return { conditions: def.conditions ?? [] }
}

// ── Definitions library (tolerant dynamic import + smart_rules fallback) ─────

interface DefinitionsLib {
  createDefinition?: (...args: unknown[]) => Promise<{ id: string }>
  updateDefinition?: (...args: unknown[]) => Promise<unknown>
  getDefinition?: (...args: unknown[]) => Promise<unknown>
  listDefinitions?: (...args: unknown[]) => Promise<unknown>
}

async function loadDefinitionsLib(): Promise<DefinitionsLib | null> {
  try {
    // Sibling agent owns this module; tolerate absence.
    return (await import("@/lib/automation/definitions")) as DefinitionsLib
  } catch {
    return null
  }
}

/** Save (create or update) a definition. Uses the sibling lib if present, else smart_rules. */
export async function saveDefinition(
  ctx: AuthedCtx,
  def: AutomationDefinition
): Promise<{ id: string }> {
  const { supabase, userId, workspaceId } = ctx
  if (!workspaceId) throw new Error("No active workspace.")

  const lib = await loadDefinitionsLib()
  const payload = {
    workspaceId,
    userId,
    name: def.name,
    description: def.description ?? null,
    trigger_type: def.trigger_type,
    trigger_config: def.trigger_config,
    condition_config: conditionConfig(def),
    action_type: def.action_type,
    action_config: def.action_config,
    review_required: def.review_required,
    enabled: def.enabled,
  }

  if (def.id && lib?.updateDefinition) {
    await lib.updateDefinition(def.id, payload)
    return { id: def.id }
  }
  if (!def.id && lib?.createDefinition) {
    return await lib.createDefinition(payload)
  }

  // Fallback: write straight to smart_rules (RLS-scoped, membership already checked).
  if (def.id) {
    const { error } = await supabase
      .from("smart_rules")
      .update({
        name: def.name || "Untitled automation",
        description: def.description || null,
        trigger_type: def.trigger_type,
        trigger_config: def.trigger_config,
        condition_config: conditionConfig(def),
        action_type: def.action_type,
        action_config: def.action_config,
        review_required: def.review_required,
        enabled: def.enabled,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", def.id)
      .eq("workspace_id", workspaceId)
    if (error) throw new Error(error.message)
    return { id: def.id }
  }

  const { data, error } = await supabase
    .from("smart_rules")
    .insert({
      workspace_id: workspaceId,
      name: def.name || "Untitled automation",
      description: def.description || null,
      trigger_type: def.trigger_type,
      trigger_config: def.trigger_config,
      condition_config: conditionConfig(def),
      action_type: def.action_type,
      action_config: def.action_config,
      review_required: def.review_required,
      enabled: def.enabled,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single()
  if (error || !data) throw new Error(error?.message ?? "Failed to save automation")
  return { id: data.id as string }
}

/** Load one definition (smart_rules fallback). Returns null if not found. */
export async function loadDefinition(
  ctx: AuthedCtx,
  id: string
): Promise<AutomationDefinition | null> {
  const lib = await loadDefinitionsLib()
  if (lib?.getDefinition) {
    try {
      const d = (await lib.getDefinition(id, ctx.workspaceId)) as AutomationDefinition | null
      if (d) return d
    } catch {
      /* fall through to smart_rules */
    }
  }
  const { supabase, workspaceId } = ctx
  if (!workspaceId) return null
  const { data } = await supabase
    .from("smart_rules")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle()
  if (!data) return null
  const row = data as Record<string, unknown>
  const cc = (row.condition_config as { conditions?: DefinitionCondition[] } | null) ?? {}
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    description: (row.description as string | null) ?? "",
    trigger_type: row.trigger_type as TriggerType,
    trigger_config: (row.trigger_config as Record<string, string | number>) ?? {},
    conditions: Array.isArray(cc.conditions) ? cc.conditions : [],
    action_type: row.action_type as ActionType,
    action_config: (row.action_config as Record<string, string>) ?? {},
    review_required: row.review_required !== false,
    enabled: row.enabled !== false,
  }
}

/** List definitions for the workspace (smart_rules fallback). */
export async function listDefinitions(ctx: AuthedCtx): Promise<
  Array<Pick<AutomationDefinition, "id" | "name" | "trigger_type" | "action_type" | "enabled">>
> {
  const lib = await loadDefinitionsLib()
  if (lib?.listDefinitions) {
    try {
      const rows = (await lib.listDefinitions(ctx.workspaceId)) as Array<
        Pick<AutomationDefinition, "id" | "name" | "trigger_type" | "action_type" | "enabled">
      >
      if (Array.isArray(rows)) return rows
    } catch {
      /* fall through */
    }
  }
  const { supabase, workspaceId } = ctx
  if (!workspaceId) return []
  const { data } = await supabase
    .from("smart_rules")
    .select("id, name, trigger_type, action_type, enabled")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100)
  return (data as Array<Pick<AutomationDefinition, "id" | "name" | "trigger_type" | "action_type" | "enabled">>) ?? []
}

// ── Dry run (tolerant dynamic import + safe local simulation) ────────────────

interface DryRunLib {
  dryRunDefinition?: (...args: unknown[]) => Promise<DryRunResponse>
}

/**
 * Produce a SIDE-EFFECT-FREE preview of what a definition would do. Prefers the
 * sibling lib's `dryRunDefinition`; otherwise simulates locally by counting how
 * many records the trigger's entity currently holds (read-only) and describing
 * the steps. NOTHING is ever written.
 */
export async function dryRun(
  ctx: AuthedCtx,
  def: AutomationDefinition
): Promise<DryRunResponse> {
  try {
    const lib = (await import("@/lib/automation/dry-run")) as unknown as DryRunLib
    if (lib?.dryRunDefinition) {
      const res = await lib.dryRunDefinition(ctx.supabase, ctx.workspaceId, def)
      if (res && Array.isArray(res.steps)) return { ...res, preview: true }
    }
  } catch {
    /* sibling lib not present — fall back to a local read-only simulation */
  }
  return localDryRun(ctx, def)
}

async function localDryRun(ctx: AuthedCtx, def: AutomationDefinition): Promise<DryRunResponse> {
  const tDef = triggerDef(def.trigger_type)
  const aDef = actionDef(def.action_type)
  const steps: DryRunStep[] = []
  const notes: string[] = []

  // 1. Trigger step — read-only count of the source entity (best-effort).
  let estimated = 0
  if (tDef && ctx.workspaceId) {
    try {
      const { count } = await ctx.supabase
        .from(tDef.entity)
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", ctx.workspaceId)
      estimated = count ?? 0
    } catch {
      notes.push(`Couldn't read "${tDef?.entity}" to estimate matches (this is only a preview).`)
    }
  }
  steps.push({
    kind: "trigger",
    label: `When: ${tDef?.label ?? def.trigger_type}`,
    detail:
      tDef?.configFields
        .map((f) => `${f.label}: ${def.trigger_config[f.key] ?? f.default ?? "—"}${f.suffix ? ` ${f.suffix}` : ""}`)
        .join(" · ") || "No thresholds set.",
    outcome: `${estimated} record(s) in ${tDef?.entity ?? "the source"} would be checked`,
  })

  // 2. Condition steps.
  if (def.conditions.length === 0) {
    steps.push({ kind: "condition", label: "Conditions", detail: "No extra conditions — the trigger threshold alone decides matches.", outcome: "would pass through" })
  } else {
    for (const c of def.conditions) {
      const opLabel = c.op === "lte" ? "≤" : c.op === "gte" ? "≥" : "="
      steps.push({ kind: "condition", label: `Only if ${c.key} ${opLabel} ${c.value}`, detail: "Filters which matched records continue.", outcome: "would narrow matches" })
    }
  }

  // 3. Action step — described, never executed.
  steps.push({
    kind: "action",
    label: `Then: ${aDef?.label ?? def.action_type}`,
    detail:
      aDef?.configFields
        .map((f) => `${f.label}: ${def.action_config[f.key] || "—"}`)
        .join(" · ") || aDef?.description || "",
    outcome: def.review_required
      ? "would create a PENDING-REVIEW item for you to approve (nothing auto-runs)"
      : "would run automatically (safe, reversible action)",
  })

  notes.push("Preview only — nothing was executed and no records were changed.")
  return { ok: true, preview: true, steps, estimatedMatches: estimated, notes }
}

export const CATALOGUE_FOR_PROMPT = {
  triggers: TRIGGER_CATALOGUE.map((t) => ({
    type: t.type,
    label: t.label,
    description: t.description,
    config: t.configFields.map((f) => ({ key: f.key, kind: f.kind, default: f.default })),
  })),
  actions: ACTION_CATALOGUE.map((a) => ({
    type: a.type,
    label: a.label,
    description: a.description,
    config: a.configFields.map((f) => ({ key: f.key, kind: f.kind, default: f.default })),
  })),
}
