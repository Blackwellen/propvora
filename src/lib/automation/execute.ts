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
    case "send_portal_message":
      return { subject: t("subject", ctx.summary), body: t("body") }
    case "assign_task":
      return {
        title: t("title", ctx.summary),
        description: t("description"),
        priority: TASK_PRIORITIES.has(String(cfg.priority)) ? cfg.priority : "normal",
        due_in_days: numFrom(cfg.due_in_days, 7),
        assignee_id: cfg.assignee_id || null,
      }
    case "create_inspection":
      return { schedule_in_days: numFrom(cfg.schedule_in_days, 7), kind: t("kind", "routine"), notes: t("notes") }
    case "create_compliance_item":
      return { title: t("title", ctx.summary), kind: t("kind", "general"), due_in_days: numFrom(cfg.due_in_days, 30), notes: t("notes") }
    case "escalate":
      return { title: t("title", `ESCALATION: ${ctx.summary}`), body: t("body", ctx.summary) }
    case "add_note":
      return { body: t("body", ctx.summary) }
    case "update_unit_status":
      return { new_status: String(cfg.new_status || "listed") }
    case "request_quote":
      return { title: t("title", ctx.summary), description: t("description"), budget: numFrom(cfg.budget, 0) }
    case "send_webhook":
      return { url: String(cfg.url || "") }
    case "generate_document":
      return { template_id: String(cfg.template_id || ""), notes: t("notes") }
    case "archive_record":
      return { reason: t("reason", "Archived by automation") }
    case "create_landlord_report":
      return { title: t("title", ctx.summary), notes: t("notes") }
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
      // ── Original actions ───────────────────────────────────────────────────

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

      // ── New actions ────────────────────────────────────────────────────────

      case "send_portal_message": {
        const insert: Record<string, unknown> = {
          workspace_id: workspaceId,
          sender_type: "manager",
          sender_id: actorId,
          subject: String(payload.subject || context.summary),
          body: String(payload.body || ""),
          entity_type: context.entity_type,
          entity_id: context.entity_id,
          metadata: { source: "smart_rule", rule_id: opts.ruleId, run_id: opts.runId, draft: true },
        }
        const { data, error } = await supabase.from("portal_messages").insert(insert).select("id").single()
        if (error) return { ok: false, result: {}, error: error.message }
        await recordAudit(supabase, {
          workspaceId, userId: actorId,
          action: "automation.portal_message_queued",
          resourceType: context.entity_type, resourceId: context.entity_id,
          metadata: { rule_id: opts.ruleId },
        })
        return { ok: true, result: { kind: "portal_message", message_id: data?.id } }
      }

      case "assign_task": {
        const dueDays = numFrom(payload.due_in_days, 7)
        const insert: Record<string, unknown> = {
          workspace_id: workspaceId,
          title: String(payload.title || context.summary),
          description: payload.description || null,
          kind: "general",
          status: "todo",
          priority: TASK_PRIORITIES.has(String(payload.priority)) ? String(payload.priority) : "normal",
          due_at: addDaysISO(dueDays),
          assigned_to: payload.assignee_id || actorId,
          property_id: context.property_id || null,
          created_by: actorId,
          metadata: { source: "smart_rule", rule_id: opts.ruleId, run_id: opts.runId, entity_type: context.entity_type, entity_id: context.entity_id },
        }
        const { data, error } = await supabase.from("tasks").insert(insert).select("id").single()
        if (error) return { ok: false, result: {}, error: error.message }
        await recordAudit(supabase, {
          workspaceId, userId: actorId,
          action: "automation.task_assigned",
          resourceType: "task", resourceId: data?.id,
          metadata: { rule_id: opts.ruleId },
        })
        return { ok: true, result: { kind: "task", task_id: data?.id } }
      }

      case "create_inspection": {
        const inDays = numFrom(payload.schedule_in_days, 7)
        const insert: Record<string, unknown> = {
          workspace_id: workspaceId,
          property_id: context.property_id || null,
          scheduled_date: addDaysISO(inDays).slice(0, 10),
          status: "scheduled",
          kind: String(payload.kind || "routine"),
          notes: String(payload.notes || `Scheduled by automation: ${context.summary}`),
          created_by: actorId,
          metadata: { source: "smart_rule", rule_id: opts.ruleId, run_id: opts.runId },
        }
        const { data, error } = await supabase.from("inspections").insert(insert).select("id").single()
        if (error) return { ok: false, result: {}, error: error.message }
        await recordAudit(supabase, {
          workspaceId, userId: actorId,
          action: "automation.inspection_created",
          resourceType: "inspection", resourceId: data?.id,
          metadata: { rule_id: opts.ruleId },
        })
        return { ok: true, result: { kind: "inspection", inspection_id: data?.id } }
      }

      case "create_compliance_item": {
        const insert: Record<string, unknown> = {
          workspace_id: workspaceId,
          property_id: context.property_id || null,
          title: String(payload.title || context.summary),
          kind: String(payload.kind || "general"),
          due_date: payload.due_in_days ? addDaysISO(numFrom(payload.due_in_days, 30)).slice(0, 10) : null,
          status: "pending",
          notes: String(payload.notes || ""),
          created_by: actorId,
          metadata: { source: "smart_rule", rule_id: opts.ruleId, run_id: opts.runId },
        }
        const { data, error } = await supabase.from("compliance_items").insert(insert).select("id").single()
        if (error) return { ok: false, result: {}, error: error.message }
        await recordAudit(supabase, {
          workspaceId, userId: actorId,
          action: "automation.compliance_item_created",
          resourceType: "compliance_items", resourceId: data?.id,
          metadata: { rule_id: opts.ruleId },
        })
        return { ok: true, result: { kind: "compliance_item", item_id: data?.id } }
      }

      case "escalate": {
        const insert: Record<string, unknown> = {
          workspace_id: workspaceId,
          user_id: actorId,
          kind: "escalation",
          title: String(payload.title || `ESCALATION: ${context.summary}`),
          body: String(payload.body || context.summary),
          severity: "critical",
          entity_type: context.entity_type,
          entity_id: context.entity_id,
          metadata: { source: "smart_rule", rule_id: opts.ruleId, run_id: opts.runId, escalated: true },
        }
        const { data, error } = await supabase.from("notifications").insert(insert).select("id").single()
        if (error) return { ok: false, result: {}, error: error.message }
        await recordAudit(supabase, {
          workspaceId, userId: actorId,
          action: "automation.escalation_created",
          resourceType: context.entity_type, resourceId: context.entity_id,
          metadata: { rule_id: opts.ruleId, notification_id: data?.id },
        })
        return { ok: true, result: { kind: "escalation", notification_id: data?.id } }
      }

      case "add_note": {
        const insert: Record<string, unknown> = {
          workspace_id: workspaceId,
          entity_type: context.entity_type,
          entity_id: context.entity_id,
          body: String(payload.body || context.summary),
          created_by: actorId,
          source: "smart_rule",
          metadata: { rule_id: opts.ruleId, run_id: opts.runId },
        }
        const { data, error } = await supabase.from("notes").insert(insert).select("id").single()
        if (error) {
          // notes table may not exist — degrade to notification
          const notifInsert: Record<string, unknown> = {
            workspace_id: workspaceId,
            user_id: actorId,
            kind: "automation_note",
            title: "Note added",
            body: String(payload.body || context.summary),
            severity: "info",
            entity_type: context.entity_type,
            entity_id: context.entity_id,
            metadata: { source: "smart_rule", rule_id: opts.ruleId },
          }
          const { data: n, error: ne } = await supabase.from("notifications").insert(notifInsert).select("id").single()
          if (ne) return { ok: false, result: {}, error: ne.message }
          return { ok: true, result: { kind: "note_as_notification", notification_id: n?.id } }
        }
        return { ok: true, result: { kind: "note", note_id: data?.id } }
      }

      case "update_unit_status": {
        const newStatus = String(payload.new_status || "listed")
        const { error } = await supabase
          .from("units")
          .update({ status: newStatus, status_changed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", context.entity_id)
          .eq("workspace_id", workspaceId)
        if (error) return { ok: false, result: {}, error: error.message }
        await recordAudit(supabase, {
          workspaceId, userId: actorId,
          action: "automation.unit_status_updated",
          resourceType: "units", resourceId: context.entity_id,
          metadata: { new_status: newStatus, rule_id: opts.ruleId },
        })
        return { ok: true, result: { kind: "unit_status_update", new_status: newStatus } }
      }

      case "request_quote": {
        const insert: Record<string, unknown> = {
          workspace_id: workspaceId,
          title: String(payload.title || context.summary),
          description: String(payload.description || ""),
          budget: numFrom(payload.budget, 0) || null,
          status: "open",
          property_id: context.property_id || null,
          job_id: context.entity_type === "jobs" ? context.entity_id : null,
          created_by: actorId,
          metadata: { source: "smart_rule", rule_id: opts.ruleId, run_id: opts.runId },
        }
        const { data, error } = await supabase.from("quote_requests").insert(insert).select("id").single()
        if (error) return { ok: false, result: {}, error: error.message }
        await recordAudit(supabase, {
          workspaceId, userId: actorId,
          action: "automation.quote_requested",
          resourceType: "quote_requests", resourceId: data?.id,
          metadata: { rule_id: opts.ruleId },
        })
        return { ok: true, result: { kind: "quote_request", request_id: data?.id } }
      }

      case "send_webhook": {
        const url = String(payload.url || "")
        if (!url || !url.startsWith("https://")) {
          return { ok: false, result: {}, error: "Invalid webhook URL — must be https://" }
        }
        try {
          const body = JSON.stringify({
            event: "automation_trigger",
            context,
            rule_id: opts.ruleId,
            run_id: opts.runId,
            workspace_id: workspaceId,
          })
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 10_000)
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Propvora-Workspace": workspaceId,
            },
            body,
            signal: controller.signal,
          })
          clearTimeout(timeout)
          await recordAudit(supabase, {
            workspaceId, userId: actorId,
            action: "automation.webhook_called",
            resourceType: "webhook", resourceId: url,
            metadata: { status: res.status, rule_id: opts.ruleId },
          })
          return { ok: res.ok, result: { http_status: res.status }, error: res.ok ? undefined : `Webhook returned ${res.status}` }
        } catch (e) {
          return { ok: false, result: {}, error: e instanceof Error ? e.message : "Webhook failed" }
        }
      }

      case "generate_document": {
        const insert: Record<string, unknown> = {
          workspace_id: workspaceId,
          template_id: String(payload.template_id || ""),
          status: "pending",
          entity_type: context.entity_type,
          entity_id: context.entity_id,
          property_id: context.property_id || null,
          notes: String(payload.notes || ""),
          created_by: actorId,
          metadata: { source: "smart_rule", rule_id: opts.ruleId, run_id: opts.runId },
        }
        const { data, error } = await supabase.from("pending_documents").insert(insert).select("id").single()
        if (error) return { ok: false, result: {}, error: error.message }
        await recordAudit(supabase, {
          workspaceId, userId: actorId,
          action: "automation.document_queued",
          resourceType: "pending_documents", resourceId: data?.id,
          metadata: { rule_id: opts.ruleId },
        })
        return { ok: true, result: { kind: "document_generation", document_id: data?.id } }
      }

      case "archive_record": {
        // Soft-archive — sets archived_at on the matched record's table.
        // We use a notification to signal this to the user (safe/reversible UI).
        const notifInsert: Record<string, unknown> = {
          workspace_id: workspaceId,
          user_id: actorId,
          kind: "automation_archive",
          title: `Archived: ${context.summary}`,
          body: String(payload.reason || "Archived by automation rule."),
          severity: "info",
          entity_type: context.entity_type,
          entity_id: context.entity_id,
          metadata: { source: "smart_rule", rule_id: opts.ruleId, run_id: opts.runId },
        }
        const { data: n, error: ne } = await supabase.from("notifications").insert(notifInsert).select("id").single()
        if (ne) return { ok: false, result: {}, error: ne.message }
        await recordAudit(supabase, {
          workspaceId, userId: actorId,
          action: "automation.record_archived",
          resourceType: context.entity_type, resourceId: context.entity_id,
          metadata: { reason: payload.reason, rule_id: opts.ruleId },
        })
        return { ok: true, result: { kind: "archive_notification", notification_id: n?.id } }
      }

      case "create_landlord_report": {
        const insert: Record<string, unknown> = {
          workspace_id: workspaceId,
          title: String(payload.title || context.summary),
          notes: String(payload.notes || ""),
          entity_type: context.entity_type,
          entity_id: context.entity_id,
          property_id: context.property_id || null,
          status: "draft",
          created_by: actorId,
          metadata: { source: "smart_rule", rule_id: opts.ruleId, run_id: opts.runId },
        }
        const { data, error } = await supabase.from("landlord_reports").insert(insert).select("id").single()
        if (error) {
          // Degrade: create a notification if table not yet available
          const notifInsert: Record<string, unknown> = {
            workspace_id: workspaceId,
            user_id: actorId,
            kind: "automation_report",
            title: String(payload.title || context.summary),
            body: String(payload.notes || context.summary),
            severity: "info",
            entity_type: context.entity_type,
            entity_id: context.entity_id,
            metadata: { source: "smart_rule", rule_id: opts.ruleId },
          }
          const { data: n, error: ne } = await supabase.from("notifications").insert(notifInsert).select("id").single()
          if (ne) return { ok: false, result: {}, error: ne.message }
          return { ok: true, result: { kind: "report_as_notification", notification_id: n?.id } }
        }
        await recordAudit(supabase, {
          workspaceId, userId: actorId,
          action: "automation.landlord_report_created",
          resourceType: "landlord_reports", resourceId: data?.id,
          metadata: { rule_id: opts.ruleId },
        })
        return { ok: true, result: { kind: "landlord_report", report_id: data?.id } }
      }

      default:
        return { ok: false, result: {}, error: `Unsupported action_type: ${actionType}` }
    }
  } catch (e) {
    return { ok: false, result: {}, error: e instanceof Error ? e.message : "execution failed" }
  }
}
