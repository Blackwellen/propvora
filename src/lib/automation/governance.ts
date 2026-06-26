// Automation governance — workspace-wide safety policy, configured in
// Workspace Settings → Automation Governance and persisted at
// `workspace_settings.automations.governance` (jsonb).
//
// This module is the EXECUTION-TIME enforcement of that policy. The Smart Rules
// engine consults `requiresReview()` so that, when a workspace turns the
// dangerous-action guardrail ON, record-mutating / outbound actions are always
// held for human approval — even if the individual rule is set to auto-run.
//
// The v2 node executor already hard-gates payment/legal/destructive nodes to
// approvals unconditionally (a stronger, always-on contract), so the toggle here
// brings the v1 Smart Rules path up to the same safety bar.

import type { SupabaseClient } from "@supabase/supabase-js"
import type { ActionType } from "./types"

export type PublishPermission = "owners_admins" | "managers_up" | "all_members"
export type AuditRetention = "90" | "180" | "365" | "730" | "forever"

export interface AutomationGovernance {
  reviewFirstDefault: boolean
  dangerousActionGuardrails: boolean
  publishPermission: PublishPermission
  environmentSeparation: boolean
  auditRetentionDays: AuditRetention
}

export const DEFAULT_GOVERNANCE: AutomationGovernance = {
  reviewFirstDefault: true,
  dangerousActionGuardrails: true,
  publishPermission: "owners_admins",
  environmentSeparation: false,
  auditRetentionDays: "365",
}

/**
 * Action types that mutate a record's state, archive it, or reach OUTSIDE
 * Propvora (webhooks, portal messages, supplier quote requests, document
 * generation). When the workspace's dangerous-action guardrail is ON these are
 * always held for human approval, regardless of the rule's own review setting.
 *
 * The purely additive / internal / draft actions (create_task,
 * create_notification, draft_message, flag_record, calendar reminder,
 * assign_task, create_inspection, create_compliance_item, escalate, add_note,
 * create_landlord_report) stay on the auto-allowed path — they are reversible.
 */
export const DANGEROUS_ACTION_TYPES: ReadonlySet<ActionType> = new Set<ActionType>([
  "update_unit_status",
  "archive_record",
  "send_webhook",
  "send_portal_message",
  "request_quote",
  "generate_document",
])

/**
 * Load the workspace's automation governance policy. Tolerant: any error
 * (missing column / RLS / network) yields the safe defaults so the engine never
 * fails open on a read problem.
 */
export async function loadAutomationGovernance(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<AutomationGovernance> {
  try {
    const { data, error } = await supabase
      .from("workspace_settings")
      .select("automations")
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (error) return DEFAULT_GOVERNANCE
    const gov = (data?.automations as { governance?: Partial<AutomationGovernance> } | null)?.governance
    return gov ? { ...DEFAULT_GOVERNANCE, ...gov } : DEFAULT_GOVERNANCE
  } catch {
    return DEFAULT_GOVERNANCE
  }
}

/**
 * Whether a run must be held for human review, combining the rule's own setting
 * with the workspace governance policy. The guardrail can only ADD review — it
 * never downgrades a review-first rule to auto-run.
 */
export function requiresReview(
  gov: AutomationGovernance,
  actionType: ActionType,
  ruleReviewRequired: boolean,
): boolean {
  if (ruleReviewRequired) return true
  if (gov.dangerousActionGuardrails && DANGEROUS_ACTION_TYPES.has(actionType)) return true
  return false
}
