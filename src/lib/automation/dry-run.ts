// Automation v2 — DRY-RUN engine.
//
// SAFETY CONTRACT (the whole point of this file):
//   A dry run NEVER performs a real side-effect. It does NOT send emails, does
//   NOT insert tasks/notifications, does NOT mutate any record. It evaluates the
//   trigger against LIVE data (read-only) and, for each matched record, produces
//   a SIMULATED step per action that DESCRIBES what would happen — using the
//   exact payload the real executor would build (buildActionPayload) so the
//   preview is faithful.
//
// HOW SIDE-EFFECTS ARE PREVENTED:
//   * We reuse the engine's READ-ONLY evaluator (`evaluateRule` in evaluate.ts),
//     which only SELECTs. We never import or call `executeAction` (the only code
//     path that writes). Instead we call `buildActionPayload` (pure — it just
//     resolves tokens) and call `describeAction` to render a human "would do".
//   * Every step is status='simulated'; the recorded run is is_dry_run=true /
//     status='dry_run'. Caps are NOT incremented (see caps.ts contract).
//   * Because we drive everything through the caller's RLS-scoped client and only
//     issue reads, there is no way for a dry run to escalate into a write.
//
// This EXTENDS the engine: it composes evaluate.ts + execute.ts's pure payload
// builder + catalogue.ts's action vocabulary, without reimplementing any of them.

import type { SupabaseClient } from "@supabase/supabase-js"
import { actionDef } from "./catalogue"
import { evaluateRule } from "./evaluate"
import { buildActionPayload } from "./execute"
import type { RunContext, SmartRule, TriggerMatch } from "./types"
import type { AutomationDefinition, DefinitionAction } from "./definitions"

export interface SimulatedStep {
  step_index: number
  action_type: string
  status: "simulated"
  /** The resolved payload the REAL run would have used (token-interpolated). */
  input: Record<string, unknown>
  /** A description of what WOULD happen (no side-effect performed). */
  output: { simulated: true; would: string; payload: Record<string, unknown> }
}

export interface DryRunMatch {
  context: RunContext
  steps: SimulatedStep[]
}

export interface DryRunResult {
  is_dry_run: true
  /** Number of records the trigger matched against live data. */
  matched: number
  /** Per-matched-record simulated steps. */
  matches: DryRunMatch[]
  /** Flat list of all simulated steps (for a simple preview list). */
  steps: SimulatedStep[]
  /** Any non-fatal notes (e.g. unknown action skipped). */
  notes: string[]
}

/**
 * Human "this is what would happen" line for an action + its resolved payload.
 * Mirrors the SAFE/REVERSIBLE semantics of execute.ts (e.g. draft_message
 * explicitly never sends).
 */
function describeAction(actionType: string, payload: Record<string, unknown>): string {
  switch (actionType) {
    case "create_task":
      return `Would create a task "${String(payload.title ?? "")}" (priority ${String(payload.priority ?? "normal")}, due in ${String(payload.due_in_days ?? 7)} day(s)). No task created in this dry run.`
    case "create_calendar_reminder":
      return `Would create a calendar reminder "${String(payload.title ?? "")}" in ${String(payload.remind_in_days ?? 1)} day(s). No reminder created in this dry run.`
    case "create_notification":
      return `Would post a "${String(payload.severity ?? "info")}" notification "${String(payload.title ?? "")}". No notification sent in this dry run.`
    case "flag_record":
      return `Would flag the record (${String(payload.entity_type ?? "")} ${String(payload.entity_id ?? "")}): "${String(payload.reason ?? "")}". No flag raised in this dry run.`
    case "draft_message":
      return `Would PREPARE a DRAFT message "${String(payload.subject ?? "")}" for manual review (never auto-sent). No message sent in this dry run.`
    default:
      return `Would run action "${actionType}". No side-effect performed in this dry run.`
  }
}

/** Build the RunContext the engine would build for a match (same shape as engine.ts). */
function contextFromMatch(definitionId: string, m: TriggerMatch): RunContext {
  return {
    dedupe_key: `${definitionId}:${m.entity_type}:${m.entity_id}`,
    entity_type: m.entity_type,
    entity_id: m.entity_id,
    property_id: m.property_id ?? null,
    summary: m.summary,
    facts: m.facts,
  }
}

/**
 * Adapt a v2 definition action into the SmartRule shape that buildActionPayload
 * expects (it reads `action_type` + `action_config`). Pure — produces a
 * throwaway SmartRule-like object only to reuse the payload builder.
 */
function asSmartRuleForAction(def: AutomationDefinition, action: DefinitionAction): SmartRule {
  return {
    id: def.id,
    workspace_id: def.workspace_id,
    name: def.name,
    description: def.description,
    enabled: def.enabled,
    trigger_type: def.trigger.type,
    trigger_config: def.trigger.config ?? {},
    condition_config: def.conditions ?? {},
    action_type: action.action_type,
    action_config: action.config ?? {},
    review_required: true,
    template_id: null,
    last_evaluated_at: null,
    created_by: def.created_by,
    created_at: def.created_at,
    updated_at: def.updated_at,
  }
}

/**
 * DRY-RUN a definition: evaluate its trigger against live data (read-only) and
 * produce simulated steps for every action against every matched record.
 *
 * NEVER performs a real side-effect (see file header). Returns is_dry_run=true.
 *
 * @param context optional override match context for an ad-hoc single-record
 *   simulation (e.g. webhook payload preview). When provided, the trigger is NOT
 *   evaluated against the DB and the single supplied context is simulated.
 */
export async function dryRunDefinition(
  supabase: SupabaseClient,
  definition: AutomationDefinition,
  context?: Partial<RunContext>,
  opts: { limit?: number } = {},
): Promise<DryRunResult> {
  const notes: string[] = []
  const actions = Array.isArray(definition.actions) ? definition.actions : []

  // Validate actions up-front; unknown actions are skipped (noted), never run.
  const usableActions = actions.filter((a) => {
    if (a && a.action_type && actionDef(a.action_type)) return true
    notes.push(`Skipped unknown action "${String(a?.action_type)}".`)
    return false
  })

  // Resolve the set of contexts to simulate.
  let contexts: RunContext[] = []
  if (context && context.entity_type && context.entity_id) {
    contexts = [
      {
        dedupe_key: context.dedupe_key ?? `${definition.id}:${context.entity_type}:${context.entity_id}`,
        entity_type: context.entity_type,
        entity_id: context.entity_id,
        property_id: context.property_id ?? null,
        summary: context.summary ?? `${definition.name} (preview)`,
        facts: context.facts ?? {},
      },
    ]
  } else {
    // Reuse the READ-ONLY evaluator. Adapt the definition trigger into the
    // SmartRule shape evaluateRule expects.
    const ruleForEval = asSmartRuleForAction(
      definition,
      usableActions[0] ?? { action_type: "create_notification" },
    )
    let matches: TriggerMatch[] = []
    try {
      matches = await evaluateRule(supabase, ruleForEval, opts.limit ?? 25)
    } catch {
      matches = []
      notes.push("Trigger evaluation returned no live matches (table may be empty or unmigrated).")
    }
    contexts = matches.map((m) => contextFromMatch(definition.id, m))
  }

  const matchResults: DryRunMatch[] = contexts.map((ctx) => {
    const steps: SimulatedStep[] = usableActions.map((action, idx) => {
      // buildActionPayload is PURE: resolves tokens from the context. No write.
      const ruleLike = asSmartRuleForAction(definition, action)
      const payload = buildActionPayload(ruleLike, ctx)
      return {
        step_index: idx,
        action_type: action.action_type,
        status: "simulated" as const,
        input: payload,
        output: { simulated: true, would: describeAction(action.action_type, payload), payload },
      }
    })
    return { context: ctx, steps }
  })

  const allSteps = matchResults.flatMap((m) => m.steps)

  return {
    is_dry_run: true,
    matched: contexts.length,
    matches: matchResults,
    steps: allSteps,
    notes,
  }
}
