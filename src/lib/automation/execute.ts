// Smart Rules — action execution.
// Performs ONLY the safe, reversible actions in the catalogue. There are no
// destructive or irreversible operations here: actions create tasks,
// notifications, draft messages, flags, and calendar reminders — all of which
// a human can dismiss or delete. Every execution is audited.

import type { SupabaseClient } from "@supabase/supabase-js"
import { recordAudit } from "@/lib/audit/log"
import type { ActionType, RunContext, SmartRule } from "./types"

export interface ExecutionResult {
  ok: boolean
  result: Record<string, unknown>
  error?: string
}

/** Replace {{token}} tokens from the run context facts + summary. */
function interpolate(template: string, ctx: RunContext): string {
  if (!template) return template
  const dict: Record<string, string> = {
    summary: ctx.summary,
    entity_type: ctx.entity_type,
    entity_id: ctx.entity_id,
  }
  for (const [k, v] of Object.entries(ctx.facts || {})) dict[k] = String(v)
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => dict[key] ?? "")
}

function addDaysISO(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString()
}
function numFrom(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN
  return Number.isFinite(n) ? n : fallback
}

const TASK_PRIORITIES = new Set(["low", "normal", "high", "urgent"])
const NOTIF_SEVERITIES = new Set(["info", "warning", "critical"])

/**
 * Build the concrete payload an action will use, resolving tokens against the
 * run context. Stored on smart_rule_actions BEFORE execution so reviewers see
 * exactly what will happen.
 */
export function buildActionPayload(
  rule: SmartRule,
  ctx: RunContext,
): Record<string, unknown> {
  const cfg = rule.action_config || {}
  const t = (key: string, fallback = "") => interpolate(String(cfg[key] ?? ""), ctx) || fallback

  switch (rule.action_type) {
    case "create_task":
      return {
        title: t("title", ctx.summary),
        description: t("description"),
        priority: TASK_PRIORITIES.has(String(cfg.priority)) ? cfg.priority : "normal",
        due_in_days: numFrom(cfg.due_in_days, 7),
      }
    case "create_notification":
      return {
        title: t("title", ctx.summary),
        body: t("body"),
        severity: NOTIF_SEVERITIES.has(String(cfg.severity)) ? cfg.severity : "info",
      }
    case "draft_message":
      return { subject: t("subject", ctx.summary), body: t("body"), status: "draft", auto_send: false }
    case "flag_record":
      return { reason: t("reason", ctx.summary), entity_type: ctx.entity_type, entity_id: ctx.entity_id }
    case "create_calendar_reminder":
      return { title: t("title", ctx.summary), remind_in_days: numFrom(cfg.remind_in_days, 1) }
    default:
      return {}
  }
}

/**
 * Execute a single, already-resolved action payload. Writes the real record
 * (task / notification / etc.), returns the inserted id(s), and audits it.
 *
 * `actorId` is the approving user (for review_required runs) or the rule's
 * creator (for auto-allowed safe runs).
 */
export async function executeAction(
  supabase: SupabaseClient,
  opts: {
    workspaceId: string
    actorId: string
    actionType: ActionType
    payload: Record<string, unknown>
    runId: string
    ruleId: string
    context: RunContext
  },
): Promise<ExecutionResult> {
  const { workspaceId, actorId, actionType, payload, context } = opts

  try {
    switch (actionType) {
      case "create_task":
      case "create_calendar_reminder": {
        const dueDays =
          actionType === "create_task"
            ? numFrom(payload.due_in_days, 7)
            : numFrom(payload.remind_in_days, 1)
        const insert: Record<string, unknown> = {
          workspace_id: workspaceId,
          title: String(payload.title || context.summary),
          description: actionType === "create_task" ? (payload.description || null) : "Calendar reminder created by Smart Rule.",
          kind: "general",
          status: "todo",
          priority: actionType === "create_task" ? String(payload.priority || "normal") : "normal",
          due_at: addDaysISO(dueDays),
          property_id: context.property_id || null,
          created_by: actorId,
          metadata: { source: "smart_rule", rule_id: opts.ruleId, run_id: opts.runId, entity_type: context.entity_type, entity_id: context.entity_id },
        }
        const { data, error } = await supabase.from("tasks").insert(insert).select("id").single()
        if (error) return { ok: false, result: {}, error: error.message }
        await recordAudit(supabase, {
          workspaceId, userId: actorId,
          action: "automation.action_executed",
          resourceType: "task", resourceId: data?.id,
          metadata: { action_type: actionType, rule_id: opts.ruleId, run_id: opts.runId },
        })
        return { ok: true, result: { kind: "task", task_id: data?.id } }
      }

      case "create_notification":
      case "flag_record": {
        const sev = actionType === "flag_record" ? "warning" : String(payload.severity || "info")
        const insert: Record<string, unknown> = {
          workspace_id: workspaceId,
          user_id: actorId,
          kind: actionType === "flag_record" ? "automation_flag" : "automation",
          title: String(payload.title || payload.reason || context.summary),
          body: actionType === "flag_record" ? `Flagged: ${payload.reason || context.summary}` : (payload.body || null),
          severity: ["info", "warning", "critical"].includes(sev) ? sev : "info",
          entity_type: context.entity_type,
          entity_id: context.entity_id,
          metadata: { source: "smart_rule", rule_id: opts.ruleId, run_id: opts.runId },
        }
        const { data, error } = await supabase.from("notifications").insert(insert).select("id").single()
        if (error) return { ok: false, result: {}, error: error.message }
        await recordAudit(supabase, {
          workspaceId, userId: actorId,
          action: actionType === "flag_record" ? "automation.record_flagged" : "automation.action_executed",
          resourceType: context.entity_type, resourceId: context.entity_id,
          metadata: { action_type: actionType, notification_id: data?.id, rule_id: opts.ruleId, run_id: opts.runId },
        })
        return { ok: true, result: { kind: "notification", notification_id: data?.id } }
      }

      case "draft_message": {
        // SAFE/REVERSIBLE: never sends. We surface the draft as a notification
        // for the user to review and send manually. No email/message dispatch.
        const insert: Record<string, unknown> = {
          workspace_id: workspaceId,
          user_id: actorId,
          kind: "automation_draft",
          title: `Draft ready: ${payload.subject || context.summary}`,
          body: String(payload.body || ""),
          severity: "info",
          entity_type: context.entity_type,
          entity_id: context.entity_id,
          metadata: { source: "smart_rule", draft: true, auto_send: false, subject: payload.subject, rule_id: opts.ruleId, run_id: opts.runId },
        }
        const { data, error } = await supabase.from("notifications").insert(insert).select("id").single()
        if (error) return { ok: false, result: {}, error: error.message }
        await recordAudit(supabase, {
          workspaceId, userId: actorId,
          action: "automation.draft_created",
          resourceType: context.entity_type, resourceId: context.entity_id,
          metadata: { action_type: actionType, notification_id: data?.id, auto_send: false, rule_id: opts.ruleId, run_id: opts.runId },
        })
        return { ok: true, result: { kind: "draft", notification_id: data?.id, auto_send: false } }
      }

      default:
        return { ok: false, result: {}, error: `Unsupported action_type: ${actionType}` }
    }
  } catch (e) {
    return { ok: false, result: {}, error: e instanceof Error ? e.message : "execution failed" }
  }
}
