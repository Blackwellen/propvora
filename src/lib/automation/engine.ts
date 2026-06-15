// Smart Rules — orchestration engine.
//
// evaluateWorkspace(): the on-demand (and schedule-safe) entry point. It loads
// enabled rules, evaluates each against live data, and creates smart_rule_runs
// for new matches. Review-first:
//   * review_required rule  → run stays 'pending_review' (awaits human Approve)
//   * review_required=false → run auto-executes the SAFE action immediately
// De-dupe: a stable (rule_id + entity) key prevents re-firing on the same
// record while an earlier run is still open/recent.
//
// approveRun(): a human approves a pending_review run → executes the action.
// skipRun():   a human dismisses a pending_review run.

import type { SupabaseClient } from "@supabase/supabase-js"
import { recordAudit } from "@/lib/audit/log"
import { evaluateRule } from "./evaluate"
import { buildActionPayload, executeAction } from "./execute"
import type { RunContext, SmartRule, TriggerMatch } from "./types"

export interface EvaluateSummary {
  rulesEvaluated: number
  matches: number
  runsCreated: number
  autoExecuted: number
  pendingReview: number
  errors: string[]
}

function dedupeKey(ruleId: string, m: TriggerMatch): string {
  return `${ruleId}:${m.entity_type}:${m.entity_id}`
}

/**
 * Evaluate every enabled rule in a workspace and create runs for new matches.
 * Safe to call on demand or from a future schedule. Uses the caller's
 * RLS-scoped client, so it only ever touches the caller's workspace.
 */
export async function evaluateWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  actorId: string,
  opts: { ruleId?: string } = {},
): Promise<EvaluateSummary> {
  const summary: EvaluateSummary = {
    rulesEvaluated: 0, matches: 0, runsCreated: 0, autoExecuted: 0, pendingReview: 0, errors: [],
  }

  let q = supabase
    .from("smart_rules")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("enabled", true)
  if (opts.ruleId) q = q.eq("id", opts.ruleId)

  const { data: rules, error } = await q
  if (error || !rules) {
    if (error) summary.errors.push(error.message)
    return summary
  }

  // Existing open/recent run dedupe keys (pending_review or executed in last 30d).
  const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const { data: recentRuns } = await supabase
    .from("smart_rule_runs")
    .select("rule_id, context, status, triggered_at")
    .eq("workspace_id", workspaceId)
    .gte("triggered_at", cutoff)
  const seen = new Set<string>()
  for (const r of recentRuns || []) {
    const ctx = (r.context || {}) as Partial<RunContext>
    if (ctx.dedupe_key) seen.add(ctx.dedupe_key)
  }

  for (const rule of rules as SmartRule[]) {
    summary.rulesEvaluated++
    let matches: TriggerMatch[] = []
    try {
      matches = await evaluateRule(supabase, rule)
    } catch (e) {
      summary.errors.push(`${rule.name}: ${e instanceof Error ? e.message : "eval failed"}`)
      continue
    }
    summary.matches += matches.length

    for (const m of matches) {
      const key = dedupeKey(rule.id, m)
      if (seen.has(key)) continue
      seen.add(key)

      const context: RunContext = {
        dedupe_key: key,
        entity_type: m.entity_type,
        entity_id: m.entity_id,
        property_id: m.property_id ?? null,
        summary: m.summary,
        facts: m.facts,
      }

      const initialStatus = rule.review_required ? "pending_review" : "approved"
      const { data: run, error: runErr } = await supabase
        .from("smart_rule_runs")
        .insert({
          rule_id: rule.id,
          workspace_id: workspaceId,
          status: initialStatus,
          context,
        })
        .select("id")
        .single()
      if (runErr || !run) {
        summary.errors.push(`run insert: ${runErr?.message ?? "unknown"}`)
        continue
      }
      summary.runsCreated++

      // Record the planned action (pending) so reviewers see what will happen.
      const payload = buildActionPayload(rule, context)
      const { data: actionRow } = await supabase
        .from("smart_rule_actions")
        .insert({
          run_id: run.id,
          workspace_id: workspaceId,
          action_type: rule.action_type,
          payload,
          status: "pending",
        })
        .select("id")
        .single()

      await recordAudit(supabase, {
        workspaceId, userId: actorId,
        action: "automation.run_created",
        resourceType: "smart_rule_run", resourceId: run.id,
        metadata: { rule_id: rule.id, trigger_type: rule.trigger_type, action_type: rule.action_type, review_required: rule.review_required, entity_type: m.entity_type, entity_id: m.entity_id },
      })

      if (rule.review_required) {
        summary.pendingReview++
      } else {
        // Auto-execute SAFE action immediately (no destructive types allowed).
        const res = await executeAction(supabase, {
          workspaceId, actorId,
          actionType: rule.action_type,
          payload, runId: run.id, ruleId: rule.id, context,
        })
        await finaliseRun(supabase, run.id, actionRow?.id, res, actorId)
        if (res.ok) summary.autoExecuted++
      }
    }

    await supabase.from("smart_rules").update({ last_evaluated_at: new Date().toISOString() }).eq("id", rule.id)
  }

  return summary
}

async function finaliseRun(
  supabase: SupabaseClient,
  runId: string,
  actionId: string | undefined,
  res: { ok: boolean; result: Record<string, unknown>; error?: string },
  actorId: string,
) {
  if (actionId) {
    await supabase.from("smart_rule_actions").update({
      status: res.ok ? "executed" : "failed",
      executed_at: new Date().toISOString(),
      result: res.ok ? res.result : { error: res.error },
    }).eq("id", actionId)
  }
  await supabase.from("smart_rule_runs").update({
    status: res.ok ? "executed" : "failed",
    error: res.ok ? null : (res.error ?? "execution failed"),
    reviewed_by: actorId,
    reviewed_at: new Date().toISOString(),
  }).eq("id", runId)
}

/**
 * Approve a pending_review run: execute its planned safe action, then mark the
 * run executed (or failed). Audited end-to-end.
 */
export async function approveRun(
  supabase: SupabaseClient,
  workspaceId: string,
  actorId: string,
  runId: string,
): Promise<{ ok: boolean; error?: string; result?: Record<string, unknown> }> {
  const { data: run, error } = await supabase
    .from("smart_rule_runs")
    .select("id, rule_id, workspace_id, status, context")
    .eq("id", runId)
    .eq("workspace_id", workspaceId)
    .single()
  if (error || !run) return { ok: false, error: "Run not found" }
  if (run.status !== "pending_review" && run.status !== "approved") {
    return { ok: false, error: `Run is ${run.status}, cannot approve` }
  }

  const { data: rule } = await supabase
    .from("smart_rules").select("*").eq("id", run.rule_id).single()
  if (!rule) return { ok: false, error: "Rule not found" }

  const context = (run.context || {}) as RunContext
  const { data: actionRow } = await supabase
    .from("smart_rule_actions").select("id, payload").eq("run_id", runId).limit(1).single()
  const payload = (actionRow?.payload as Record<string, unknown>) || buildActionPayload(rule as SmartRule, context)

  await recordAudit(supabase, {
    workspaceId, userId: actorId,
    action: "automation.run_approved",
    resourceType: "smart_rule_run", resourceId: runId,
    metadata: { rule_id: run.rule_id, action_type: (rule as SmartRule).action_type },
  })

  const res = await executeAction(supabase, {
    workspaceId, actorId,
    actionType: (rule as SmartRule).action_type,
    payload, runId, ruleId: run.rule_id, context,
  })
  await finaliseRun(supabase, runId, actionRow?.id, res, actorId)
  return { ok: res.ok, error: res.error, result: res.result }
}

/** Dismiss a pending_review run without executing. Audited. */
export async function skipRun(
  supabase: SupabaseClient,
  workspaceId: string,
  actorId: string,
  runId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data: run, error } = await supabase
    .from("smart_rule_runs")
    .select("id, rule_id, status")
    .eq("id", runId)
    .eq("workspace_id", workspaceId)
    .single()
  if (error || !run) return { ok: false, error: "Run not found" }
  if (run.status !== "pending_review") return { ok: false, error: `Run is ${run.status}` }

  await supabase.from("smart_rule_actions").update({ status: "skipped" }).eq("run_id", runId)
  await supabase.from("smart_rule_runs").update({
    status: "skipped", reviewed_by: actorId, reviewed_at: new Date().toISOString(),
  }).eq("id", runId)

  await recordAudit(supabase, {
    workspaceId, userId: actorId,
    action: "automation.run_skipped",
    resourceType: "smart_rule_run", resourceId: runId,
    metadata: { rule_id: run.rule_id },
  })
  return { ok: true }
}
