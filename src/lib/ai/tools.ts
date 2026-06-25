import "server-only"
import { randomUUID } from "crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  type ActionClass,
  type EffectiveLevel,
  decideAction,
} from "./permissions"
import { checkCreditBalance, debitCredits } from "./credits"
import { resolveNavigation } from "./navigation"
import { writeWorkspaceMemory, writeUserMemory } from "./memory"
import { compareProperties, renderCompare } from "./graph"
import { generateDocument } from "./documents"
import { buildPatch, CHILD_SCHEMA, coerceField, RECORD_TABLES } from "./field-schema"
import { executeAction } from "@/lib/automation/execute"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionType, RunContext } from "@/lib/automation/types"

// ============================================================================
// Tool registry — the single place where the Copilot's proposed actions become
// real, SAFE, audited side effects. The LLM proposes a tool call; this module:
//   1. resolves the tool definition (action_class, credit op, criticality),
//   2. checks the 7-level permission engine → execute | approval | denied,
//   3. reserves/checks the credit class balance,
//   4. executes via a DETERMINISTIC handler (reusing the audited automation
//      executeAction for safe writes; never free-form model text),
//   5. debits credits + writes ai_tool_runs + ai_audit_log.
//
// Only tools with a REAL backend are registered here. Web/market/doc tools are
// added in Phase 2/3 when their handlers land — there are no placeholder tools.
// ============================================================================

export interface ToolDef {
  name: string
  category: string
  actionClass: ActionClass
  creditOp: string | null
  /** Marks irreversible / money / bulk actions (never auto-run below L5). */
  critical?: boolean
}

export const TOOL_REGISTRY: Record<string, ToolDef> = {
  "navigate.to": { name: "navigate.to", category: "navigation", actionClass: "navigate", creditOp: null },
  "compare.entities": { name: "compare.entities", category: "read", actionClass: "read", creditOp: "tool.read" },
  "record.create": { name: "record.create", category: "write", actionClass: "write", creditOp: "record.create" },
  "record.update": { name: "record.update", category: "write", actionClass: "write", creditOp: "record.update" },
  "record.line.add": { name: "record.line.add", category: "write", actionClass: "write", creditOp: "record.create" },
  "memory.write": { name: "memory.write", category: "write", actionClass: "write", creditOp: "memory.write" },
  "comms.email.draft": { name: "comms.email.draft", category: "comms", actionClass: "draft", creditOp: "comms.email.draft" },
  "doc.generate": { name: "doc.generate", category: "generate", actionClass: "generate", creditOp: "doc.generate" },
}

/**
 * Map a slash-command's `mutationType` to the tool that should execute it once
 * the user approves the model's draft. Returns null for draft types that have
 * no safe executor yet (they stay draft-only — correct, not a stub). The client
 * shows an approval card and POSTs the chosen tool + args to /api/ai/tool.
 */
export function commandToTool(mutationType: string | undefined): string | null {
  switch (mutationType) {
    case "task-draft":
    case "job-draft":
      return "record.create"
    case "message-draft":
      return "comms.email.draft"
    case "document-draft":
    case "doc-generate":
      return "doc.generate" // letters, notices, offers → real branded PDF in Documents
    default:
      return null // listing-draft etc. stay draft-only in V1
  }
}

export type ToolStatus = "succeeded" | "awaiting_approval" | "denied" | "failed"

export interface ToolRunResult {
  status: ToolStatus
  result?: unknown
  reason?: string
  requiresApproval?: boolean
  creditCost?: number
  toolRunId: string
}

interface ExecuteToolArgs {
  supabase: SupabaseClient
  workspaceId: string
  userId: string
  chatId?: string | null
  toolName: string
  args: Record<string, unknown>
  effective: EffectiveLevel
  /** Set true once a human has approved a previously-gated run. */
  approved?: boolean
  surface?: string
}

/**
 * Run a tool through the full permission → credit → execute → audit pipeline.
 * Returns a structured result; NEVER throws (failures are captured as
 * status:"failed"). The append-only audit row is written for every outcome,
 * including denials, so the trail is complete.
 */
export async function executeTool(opts: ExecuteToolArgs): Promise<ToolRunResult> {
  const { supabase, workspaceId, userId, toolName, args, effective } = opts
  const toolRunId = randomUUID()
  const def = TOOL_REGISTRY[toolName]

  if (!def) {
    await writeAudit(opts, toolRunId, "denied", { error: "unknown_tool" })
    return { status: "denied", reason: `Unknown tool: ${toolName}`, toolRunId }
  }

  // 1. Permission decision (server-side; the model has no authority here).
  const decision = decideAction(def.actionClass, effective, {
    actionKey: toolName,
    critical: def.critical,
  })
  if (decision.mode === "denied") {
    await recordToolRun(opts, toolRunId, def, "denied", { decision }, 0)
    await writeAudit(opts, toolRunId, "denied", { decision })
    return { status: "denied", reason: decision.reason, toolRunId }
  }
  if (decision.mode === "approval" && !opts.approved) {
    await recordToolRun(opts, toolRunId, def, "awaiting_approval", { decision }, 0)
    await writeAudit(opts, toolRunId, "awaiting_approval", { decision })
    return { status: "awaiting_approval", requiresApproval: true, reason: "This action needs your approval before it runs.", toolRunId }
  }

  // 2. Credit pre-flight (fail-open in checkCreditBalance for conversation).
  const units = typeof args.units === "number" ? args.units : 0
  if (def.creditOp) {
    const credit = await checkCreditBalance(supabase, workspaceId, def.creditOp, units)
    if (!credit.allowed) {
      await recordToolRun(opts, toolRunId, def, "failed", { credit }, 0)
      await writeAudit(opts, toolRunId, "failed", { credit })
      return { status: "failed", reason: credit.reason, toolRunId }
    }
  }

  // 3. Execute via a deterministic handler.
  let result: unknown
  try {
    result = await runHandler(opts, def)
  } catch (err) {
    const message = err instanceof Error ? err.message : "tool execution failed"
    await recordToolRun(opts, toolRunId, def, "failed", { error: message }, 0)
    await writeAudit(opts, toolRunId, "failed", { error: message })
    return { status: "failed", reason: message, toolRunId }
  }

  // 4. Debit credits + record the run + audit.
  let creditCost = 0
  if (def.creditOp) {
    const { estimateCredits } = await import("./credits")
    creditCost = estimateCredits(def.creditOp, units)
    await debitCredits(supabase, {
      workspaceId,
      userId,
      operationKey: def.creditOp,
      units,
      refType: "ai_tool_run",
      refId: toolRunId,
    })
  }
  await recordToolRun(opts, toolRunId, def, "succeeded", { result }, creditCost)
  await writeAudit(opts, toolRunId, "succeeded", { result })

  return { status: "succeeded", result, creditCost, toolRunId }
}

// ── Handlers (deterministic) ─────────────────────────────────────────────────

async function runHandler(opts: ExecuteToolArgs, def: ToolDef): Promise<unknown> {
  const { supabase, workspaceId, userId, args } = opts
  switch (def.name) {
    case "navigate.to": {
      const intent = String(args.intent ?? "")
      const target = resolveNavigation(intent, Array.isArray(args.highlightIds) ? (args.highlightIds as string[]) : undefined)
      if (!target) throw new Error("No matching destination for that request.")
      return target
    }
    case "compare.entities": {
      const ids = Array.isArray(args.propertyIds) ? (args.propertyIds as string[]).map(String) : []
      if (ids.length === 0) throw new Error("compare.entities requires propertyIds")
      const result = await compareProperties(supabase, workspaceId, ids)
      return { ...result, rendered: renderCompare(result) }
    }
    case "doc.generate": {
      const title = String(args.title ?? "Document")
      const kind = String(args.kind ?? "report")
      const instructions = String(args.instructions ?? args.summary ?? title)
      const propertyId = typeof args.propertyId === "string" ? args.propertyId : null
      return await generateDocument(supabase, { workspaceId, userId, kind, title, instructions, propertyId })
    }
    case "record.update": {
      // Safe in-place edit of a SPECIFIC record. Runs under the caller's
      // RLS-scoped client (a user can only change records they may see). The
      // editable fields per type are defined in field-schema.ts (config, not
      // code) and every value is validated/coerced — arbitrary writes are
      // impossible.
      const recordType = String(args.recordType ?? "")
      const recordId = String(args.recordId ?? "")
      if (!recordId) throw new Error("record.update needs a recordId")
      const { table, patch } = buildPatch(recordType, args) // throws on bad type/field/value
      const { error } = await supabase.from(table).update(patch).eq("id", recordId).eq("workspace_id", workspaceId)
      if (error) throw new Error(error.message)
      return { updated: true, recordType, recordId, ...patch }
    }
    case "record.line.add": {
      // Add a row to a whitelisted CHILD collection (e.g. an invoice line item),
      // verifying the parent belongs to this workspace first (RLS-scoped).
      const kind = String(args.kind ?? "invoice.line")
      const def = CHILD_SCHEMA[kind]
      if (!def) throw new Error(`Unsupported line type "${kind}"`)
      const parentId = String(args.parentId ?? "")
      if (!parentId) throw new Error(`${kind} needs a parentId`)
      // Confirm the parent is in this workspace (RLS + explicit check).
      const { data: parent } = await supabase.from(RECORD_TABLES[def.parentType] ?? `${def.parentType}s`).select("id").eq("id", parentId).eq("workspace_id", workspaceId).maybeSingle()
      if (!parent) throw new Error("Parent record not found in this workspace")
      const row: Record<string, unknown> = {
        [def.parentColumn]: parentId,
        ...(def.hasWorkspaceId !== false ? { workspace_id: workspaceId } : {}),
        ...(def.defaults ?? {}),
      }
      let userFields = 0
      for (const [field, fdef] of Object.entries(def.fields)) {
        if (args[field] !== undefined && args[field] !== null && args[field] !== "") { row[fdef.column] = coerceField(fdef, args[field]); userFields++ }
      }
      if (userFields === 0) throw new Error(`Provide at least one field (${Object.keys(def.fields).join(", ")})`)
      const { data, error } = await supabase.from(def.table).insert(row).select("id").single()
      if (error) throw new Error(error.message)
      return { added: true, kind, lineId: (data as { id?: string } | null)?.id ?? null }
    }
    case "memory.write": {
      const key = String(args.key ?? "")
      const value = args.value
      if (!key) throw new Error("memory.write requires a key")
      if (args.scope === "user") {
        await writeUserMemory(supabase, { workspaceId, userId, key, value })
      } else {
        await writeWorkspaceMemory(supabase, { workspaceId, key, value })
      }
      return { saved: true, key, scope: args.scope === "user" ? "user" : "workspace" }
    }
    case "comms.email.draft": {
      // A draft is returned to the caller for review; it is NEVER sent here.
      return {
        kind: "email_draft",
        to: String(args.to ?? ""),
        subject: String(args.subject ?? ""),
        body: String(args.body ?? ""),
        status: "draft",
        auto_send: false,
      }
    }
    case "record.create": {
      // Delegate to the audited, SAFE automation executor. Only reversible
      // record types are permitted (task / notification / note / reminder).
      const actionType = mapRecordType(String(args.recordType ?? "task"))
      const ctx: RunContext = {
        dedupe_key: `copilot:${opts.chatId ?? "adhoc"}:${randomUUID()}`,
        summary: String(args.summary ?? args.title ?? "Created by Copilot"),
        entity_type: String(args.entityType ?? "workspace"),
        entity_id: String(args.entityId ?? workspaceId),
        property_id: typeof args.propertyId === "string" ? args.propertyId : null,
        facts: (args.facts as Record<string, unknown>) ?? {},
      }
      const res = await executeAction(supabase, {
        workspaceId,
        actorId: userId,
        actionType,
        payload: {
          title: String(args.title ?? ctx.summary),
          description: String(args.description ?? ""),
          body: String(args.body ?? args.description ?? ""),
          priority: String(args.priority ?? "normal"),
          severity: String(args.severity ?? "info"),
          due_in_days: typeof args.dueInDays === "number" ? args.dueInDays : 7,
        },
        runId: opts.chatId ?? workspaceId,
        ruleId: "copilot",
        context: ctx,
      })
      if (!res.ok) throw new Error(res.error ?? "record.create failed")
      return res.result
    }
    default:
      throw new Error(`No handler for ${def.name}`)
  }
}

/** Map a Copilot record type to a SAFE, reversible automation action type. */
function mapRecordType(recordType: string): ActionType {
  switch (recordType) {
    case "notification":
      return "create_notification" as ActionType
    case "note":
      return "add_note" as ActionType
    case "reminder":
      return "create_calendar_reminder" as ActionType
    case "task":
    default:
      return "create_task" as ActionType
  }
}

// ── Persistence (best-effort) ─────────────────────────────────────────────────

async function recordToolRun(
  opts: ExecuteToolArgs,
  toolRunId: string,
  def: ToolDef,
  status: string,
  detail: Record<string, unknown>,
  creditCost: number
): Promise<void> {
  if (!opts.workspaceId || opts.workspaceId === "demo-workspace") return
  try {
    // Service-role: ai_tool_runs is server-written (SELECT-only client policy).
    await createAdminClient().from("ai_tool_runs").insert({
      id: toolRunId,
      workspace_id: opts.workspaceId,
      chat_id: opts.chatId ?? null,
      tool_name: def.name,
      args: opts.args as object,
      result: (detail as object) ?? null,
      status,
      permission_check: { decision: detail.decision ?? null },
      credit_cost: creditCost,
      created_by: opts.userId,
    })
  } catch {
    /* non-fatal */
  }
}

async function writeAudit(
  opts: ExecuteToolArgs,
  toolRunId: string,
  status: string,
  detail: Record<string, unknown>
): Promise<void> {
  if (!opts.workspaceId || opts.workspaceId === "demo-workspace") return
  try {
    // Service-role: ai_audit_log is APPEND-ONLY and server-written. No client
    // INSERT/UPDATE/DELETE policy exists, so the trail can't be forged or erased.
    await createAdminClient().from("ai_audit_log").insert({
      workspace_id: opts.workspaceId,
      actor_user_id: opts.userId,
      surface: opts.surface ?? "chat",
      chat_id: opts.chatId ?? null,
      run_id: toolRunId,
      action_type: opts.toolName,
      tool_calls: { tool: opts.toolName, args: opts.args } as object,
      result: { status, ...detail } as object,
    })
  } catch {
    /* non-fatal — the ai_usage_events ledger is the financial backstop */
  }
}
