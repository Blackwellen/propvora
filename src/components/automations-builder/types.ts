// Shared types for the Automation v2 builders (NL + Canvas Lite) and their APIs.
// A "definition" is the editable shape of an automation BEFORE it becomes a live
// smart_rules row. It mirrors the smart_rules columns (trigger → condition →
// action) so it can be saved through the definitions library / smart_rules.
//
// These types are UI/transport-only. The runtime catalogue of valid trigger and
// action types lives in `@/lib/automation/catalogue` — the single source of
// truth the AI draft is validated against.

import type { ActionType, TriggerType } from "@/lib/automation/types"

/** A single condition row layered on top of the trigger threshold. */
export interface DefinitionCondition {
  /** A trigger config key, e.g. "within_days" / "min_amount". */
  key: string
  /** Comparison operator. Kept deliberately small + safe. */
  op: "lte" | "gte" | "eq"
  /** Literal value to compare against. */
  value: string
}

/** The editable automation definition (pre-save). */
export interface AutomationDefinition {
  /** Present when editing/loading an existing definition. */
  id?: string
  name: string
  description?: string
  trigger_type: TriggerType
  trigger_config: Record<string, string | number>
  /** Structured extra conditions (UI-friendly). Persisted into condition_config. */
  conditions: DefinitionCondition[]
  action_type: ActionType
  action_config: Record<string, string>
  review_required: boolean
  enabled: boolean
}

/** What `/api/automations/nl` returns: a reviewable DRAFT, never saved. */
export interface NlDraftResponse {
  /** True only when the model produced a valid, catalogue-checked draft. */
  ok: boolean
  /** The proposed (unsaved) definition. */
  draft?: AutomationDefinition
  /** Plain-language explanation of what the draft would do (for the user). */
  explanation?: string
  /** Notes about anything the model could not map (honesty surface). */
  notes?: string[]
  /** Always true — the user MUST review + confirm before anything is saved. */
  reviewRequired: true
  error?: string
}

/** One simulated step from a dry run — nothing is executed. */
export interface DryRunStep {
  label: string
  detail: string
  kind: "trigger" | "condition" | "action"
  /** "would-match" / "would-skip" / "would-create" — clearly hypothetical. */
  outcome: string
}

export interface DryRunResponse {
  ok: boolean
  /** Always true — this is a preview; nothing ran. */
  preview: true
  steps: DryRunStep[]
  /** How many records the trigger WOULD have matched (estimate). */
  estimatedMatches: number
  notes?: string[]
  error?: string
}

/** Helper: a blank definition seeded from the first catalogue entries. */
export function emptyDefinition(
  trigger: TriggerType,
  action: ActionType
): AutomationDefinition {
  return {
    name: "",
    description: "",
    trigger_type: trigger,
    trigger_config: {},
    conditions: [],
    action_type: action,
    action_config: {},
    review_required: true,
    enabled: true,
  }
}
