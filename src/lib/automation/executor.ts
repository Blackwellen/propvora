// Automation v2 — the QUEUE EXECUTOR (the missing consumer).
//
// THE GAP THIS CLOSES: the inbound webhook receiver
// (`/api/automations/trigger/[token]`) inserts an `automation_v2_runs` row with
// status='queued' and returns 202 — but nothing ever drained that queue. This
// module is that drainer. It is invoked ONLY from the secured cron runner
// (`/api/cron/automation-runner`) with the service-role admin client.
//
// DESIGN (claim → execute → record → cap):
//   1. CLAIM. A queued run is claimed with a GUARDED UPDATE that flips
//      status 'queued'→'running' ONLY while it is still 'queued'
//      (`.eq('status','queued')`). PostgREST returns the row only to the writer
//      that won the transition, so two concurrent drainers can never double-claim
//      the same run. Claiming also stamps started_at.
//   2. LOAD. The run's `automation_definition` is loaded (workspace-scoped). A run
//      with no/disabled/deleted definition is finished honestly as 'skipped'.
//   3. GATE. Plan entitlement (`gateAutomation`) and the per-plan monthly run cap
//      (`isWithinCap`) are checked. If the workspace is over cap or un-entitled,
//      the run is finished 'skipped' with the reason recorded — it is NOT run.
//   4. EXECUTE. Each action in the definition's ordered `actions` array runs
//      through the REAL engine executor (`executeAction` in execute.ts) — the
//      same safe/reversible path the v1 engine and human approvals use. Every
//      action produces an `automation_run_steps` row (succeeded/failed/skipped).
//   5. FINISH. The run is finished 'succeeded' only when at least one action ran
//      and none failed; 'failed' (with the error recorded) if any action failed.
//      A real run that executed increments the monthly cap usage.
//
// SAFETY / APPROVAL CONTRACT (honoured, not bypassed):
//   * The engine's executor only knows how to perform the SAFE, REVERSIBLE
//     catalogue actions (create_task / create_notification / draft_message /
//     flag_record / create_calendar_reminder). There are NO destructive actions
//     in the catalogue, so there is nothing here that could run an irreversible
//     side-effect. `draft_message` NEVER sends — it only prepares a draft.
//   * Any action whose type is NOT in the catalogue is treated as UNSAFE: it is
//     recorded as a skipped step and the run is failed. We never execute an
//     action the engine would reject — this preserves the "destructive actions
//     require their existing approval gates" rule: such actions simply do not
//     exist on the auto-executable path and are refused here.
//   * Dry-run rows (is_dry_run / status='dry_run') are NEVER claimed or executed.
//
// HONESTY: a run is 'succeeded' only when actions actually ran; a failed action
// yields 'failed' with the real error. Caps are incremented only for real runs
// that executed. Everything is idempotent (guarded claim) and tolerant (a single
// bad run never aborts the drain of the rest).

import type { SupabaseClient } from "@supabase/supabase-js"
import { actionDef } from "./catalogue"
import { buildActionPayload, executeAction } from "./execute"
import { finishRun, recordRunStep } from "./runs"
import { getDefinition, type AutomationDefinition, type DefinitionAction } from "./definitions"
import { isWithinCap, incrementRunUsage } from "./caps"
import { getWorkspaceTier } from "@/lib/billing/gates"
import { recordNodeRun, recordRunEvent, createApproval, recordAutomationError } from "./approvals"
import { getActiveVersion } from "./canvas-model"
import { planToDefinitionActions, type CompiledPlanStep } from "./canvas-compile"
import type { ActionType, RunContext, SmartRule } from "./types"

const RUNS_TABLE = "automation_v2_runs"

// ── Per-node timeout guard ────────────────────────────────────────────────────
// Prevents a single slow action (e.g. a webhook call in a future action type, or
// a slow DB insert) from blocking the executor indefinitely. 30 s is generous —
// all current safe actions are DB inserts that should complete in < 2 s.
const NODE_TIMEOUT_MS = 30_000

function withTimeout<T>(fn: () => Promise<T>, ms = NODE_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Node timeout after ${ms}ms`)), ms)
    ),
  ])
}

/** A run that has been claimed (queued→running) and is ready to execute. */
interface ClaimedRun {
  id: string
  workspaceId: string
  definitionId: string | null
  triggerContext: Record<string, unknown>
}

export interface RunOutcome {
  runId: string
  workspaceId: string
  status: "succeeded" | "failed" | "skipped"
  stepsRun: number
  stepsFailed: number
  reason?: string
}

export interface DrainResult {
  claimed: number
  executed: number
  succeeded: number
  failed: number
  skipped: number
  outcomes: RunOutcome[]
}

/**
 * Adapt a v2 definition + a single action into the SmartRule shape the engine's
 * payload builder + executor expect (they read `action_type` + `action_config`).
 * Pure — a throwaway object only to reuse the engine. Mirrors dry-run.ts.
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
 * Build the RunContext to execute against. A webhook-triggered run carries its
 * payload in trigger_context; we surface it to actions as facts + a summary so
 * tokens like {{summary}} resolve. There is no matched DB record for a webhook
 * trigger, so entity_type/entity_id describe the definition itself.
 */
function contextForRun(def: AutomationDefinition, trigger: Record<string, unknown>): RunContext {
  const payload =
    trigger && typeof trigger.payload === "object" && trigger.payload !== null
      ? (trigger.payload as Record<string, unknown>)
      : {}
  const source = typeof trigger.source === "string" ? trigger.source : "automation"
  return {
    dedupe_key: `${def.id}:run`,
    entity_type: "automation_definition",
    entity_id: def.id,
    property_id: null,
    summary: def.name || "Automation",
    // Expose the trigger payload's scalar fields as facts for token interpolation.
    facts: { source, ...payload },
  }
}

/**
 * Claim up to `limit` queued runs with a guarded transition. We select candidate
 * ids first (read), then attempt to flip each one queued→running individually;
 * the `.eq('status','queued')` predicate makes the flip the atomic claim — only
 * the writer that observes it still queued gets the row back. Dry runs are never
 * candidates.
 */
async function claimQueuedRuns(
  supabase: SupabaseClient,
  limit: number,
): Promise<ClaimedRun[]> {
  let candidates: Array<{ id: string }> = []
  try {
    const { data, error } = await supabase
      .from(RUNS_TABLE)
      .select("id")
      .eq("status", "queued")
      .eq("is_dry_run", false)
      .order("created_at", { ascending: true })
      .limit(limit)
    if (error || !data) return []
    candidates = data as Array<{ id: string }>
  } catch {
    return []
  }

  const claimed: ClaimedRun[] = []
  for (const c of candidates) {
    try {
      const { data, error } = await supabase
        .from(RUNS_TABLE)
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", c.id)
        .eq("status", "queued") // GUARD: only claim if still queued (no double-claim)
        .eq("is_dry_run", false)
        .select("id, workspace_id, definition_id, trigger_context")
        .maybeSingle()
      if (error || !data) continue // lost the race or vanished — skip
      const row = data as {
        id: string
        workspace_id: string
        definition_id: string | null
        trigger_context: Record<string, unknown> | null
      }
      claimed.push({
        id: String(row.id),
        workspaceId: String(row.workspace_id),
        definitionId: row.definition_id ?? null,
        triggerContext: (row.trigger_context && typeof row.trigger_context === "object" ? row.trigger_context : {}) as Record<string, unknown>,
      })
    } catch {
      continue
    }
  }
  return claimed
}

/**
 * Execute a single claimed run: load its definition, enforce gates, run each
 * action through the REAL executor, record steps, and finish the run honestly.
 */
async function executeClaimedRun(
  supabase: SupabaseClient,
  run: ClaimedRun,
): Promise<RunOutcome> {
  const base: RunOutcome = {
    runId: run.id,
    workspaceId: run.workspaceId,
    status: "skipped",
    stepsRun: 0,
    stepsFailed: 0,
  }

  // ── Load the linked definition (workspace-scoped) ─────────────────────────
  if (!run.definitionId) {
    await finishRun(supabase, run.id, "skipped", "Run has no linked definition.")
    return { ...base, reason: "no_definition" }
  }
  const def = await getDefinition(supabase, run.workspaceId, run.definitionId)
  if (!def) {
    await finishRun(supabase, run.id, "skipped", "Linked definition not found.")
    return { ...base, reason: "definition_missing" }
  }
  if (!def.enabled) {
    await finishRun(supabase, run.id, "skipped", "Definition is disabled.")
    return { ...base, reason: "definition_disabled" }
  }

  // ── Plan entitlement + monthly run cap ────────────────────────────────────
  const tier = await getWorkspaceTier(supabase, run.workspaceId)
  const cap = await isWithinCap(supabase, run.workspaceId, tier)
  if (!cap.allowed) {
    const reason = cap.limit <= 0
      ? "Automation isn't entitled on this plan."
      : `Monthly automation run cap reached (${cap.used}/${cap.limit}).`
    await finishRun(supabase, run.id, "skipped", reason)
    return { ...base, reason: cap.limit <= 0 ? "not_entitled" : "cap_reached" }
  }

  // ── Resolve actions; refuse anything outside the SAFE catalogue ───────────
  const actions = Array.isArray(def.actions) ? def.actions : []
  if (actions.length === 0) {
    await finishRun(supabase, run.id, "skipped", "Definition has no actions.")
    return { ...base, reason: "no_actions" }
  }

  const context = contextForRun(def, run.triggerContext)
  // The actor on whose behalf safe actions are performed: the definition's
  // author (same as the engine's auto-allowed path). Service-role writes still
  // record an actor for the audit trail.
  const actorId = def.created_by ?? run.workspaceId

  await recordRunEvent(supabase, run.workspaceId, run.id, {
    eventType: "run.started",
    message: `Executing "${def.name}" (${actions.length} action(s)).`,
    data: { definition_id: def.id, version: def.version },
  })

  // ── GOVERNANCE / SAFETY: gate any compiled gated steps to approvals ───────
  // If the definition has an ACTIVE compiled node-graph version, surface its
  // gated steps (payment/legal/approval/blocked) as APPROVAL objects and record
  // them as awaiting_approval/blocked node-runs. The engine NEVER auto-runs these
  // — payment/legal/destructive nodes always require a human decision. This is
  // the executor-path enforcement of the safety contract.
  let seq = 0
  try {
    const activeVersion = await getActiveVersion(supabase, run.workspaceId, def.id)
    if (activeVersion && activeVersion.graph.nodes.length > 0) {
      const compiledPlan = activeVersion.compiled as unknown as { steps?: CompiledPlanStep[] }
      const steps = Array.isArray(compiledPlan?.steps) ? compiledPlan.steps : []
      const { gated } = planToDefinitionActions({ trigger: null, steps, hasApprovalGate: false })
      for (const g of gated) {
        if (g.blocked) {
          // Hard-blocked node (e.g. legal.auto_serve_notice): never executes.
          await recordNodeRun(supabase, run.workspaceId, run.id, {
            nodeKey: g.node_key, nodeType: g.node_type, category: g.category, seq: seq++,
            status: "blocked",
            output: { blocked: true, reason: "blocked_from_autorun" },
            error: "This node is blocked from automated execution and requires a manual, audited action.",
          })
          await recordRunEvent(supabase, run.workspaceId, run.id, {
            level: "warn", eventType: "node.blocked", nodeKey: g.node_key,
            message: `"${g.node_type}" is blocked from auto-run.`,
          })
          continue
        }
        // Gated node (payment/legal/approval): create an approval, await it.
        const approval = await createApproval(supabase, run.workspaceId, {
          runId: run.id,
          definitionId: def.id,
          nodeKey: g.node_key,
          nodeType: g.node_type,
          category: g.category,
          risk: g.risk,
          title: `Approval required: ${g.node_type}`,
          summary: `Automation "${def.name}" reached a ${g.category} node that needs human approval before anything happens.`,
          payload: g.config,
          requestedBy: def.created_by,
          slaHours: Number(g.config?.sla_hours ?? 24),
        })
        await recordNodeRun(supabase, run.workspaceId, run.id, {
          nodeKey: g.node_key, nodeType: g.node_type, category: g.category, seq: seq++,
          status: "awaiting_approval",
          approvalId: approval?.id ?? null,
          output: { gated: true, approval_id: approval?.id ?? null },
        })
        await recordRunEvent(supabase, run.workspaceId, run.id, {
          level: "warn", eventType: "approval.requested", nodeKey: g.node_key,
          message: `Created approval for ${g.category} node "${g.node_type}".`,
          data: { approval_id: approval?.id ?? null },
        })
      }
    }
  } catch {
    /* governance recording is best-effort; never aborts the safe-action run */
  }

  let stepsRun = 0
  let stepsFailed = 0
  let firstError: string | null = null
  let executedAny = false

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i]
    const actionType = action?.action_type as ActionType | undefined

    // SAFETY GATE: only catalogue actions are auto-executable. Anything else is
    // refused (recorded as skipped) and fails the run — we never run an action
    // the engine would reject without its approval path.
    if (!actionType || !actionDef(String(actionType))) {
      stepsFailed++
      if (!firstError) firstError = `Action ${i + 1}: "${String(actionType)}" is not a safe, auto-executable action.`
      await recordRunStep(supabase, run.id, {
        stepIndex: i,
        actionType: String(actionType ?? "unknown"),
        status: "skipped",
        input: (action?.config as Record<string, unknown>) ?? {},
        output: { skipped: true, reason: "unsafe_or_unknown_action" },
        error: firstError,
      })
      await recordNodeRun(supabase, run.workspaceId, run.id, {
        nodeKey: `action_${i}`, nodeType: String(actionType ?? "unknown"), category: "action", seq: seq++,
        status: "blocked",
        input: (action?.config as Record<string, unknown>) ?? {},
        output: { blocked: true, reason: "unsafe_or_unknown_action" },
        error: firstError,
      })
      continue
    }

    const ruleLike = asSmartRuleForAction(def, action)
    const payload = buildActionPayload(ruleLike, context)

    // Wrap in timeout so a single action can never block the queue drainer
    // indefinitely. On timeout, treat as a failed step and continue.
    let res: Awaited<ReturnType<typeof executeAction>>
    try {
      res = await withTimeout(() =>
        executeAction(supabase, {
          workspaceId: run.workspaceId,
          actorId,
          actionType,
          payload,
          runId: run.id,
          ruleId: def.id,
          context,
        })
      )
    } catch (timeoutErr) {
      const timeoutMsg = timeoutErr instanceof Error ? timeoutErr.message : "Action timed out."
      res = { ok: false, result: {}, error: timeoutMsg }
    }

    if (res.ok) {
      stepsRun++
      executedAny = true
      await recordRunStep(supabase, run.id, {
        stepIndex: i,
        actionType,
        status: "succeeded",
        input: payload,
        output: res.result,
      })
      await recordNodeRun(supabase, run.workspaceId, run.id, {
        nodeKey: `action_${i}`, nodeType: String(actionType), category: "action", seq: seq++,
        status: "succeeded", input: payload, output: res.result,
      })
    } else {
      stepsFailed++
      if (!firstError) firstError = res.error ?? "Action failed."
      await recordRunStep(supabase, run.id, {
        stepIndex: i,
        actionType,
        status: "failed",
        input: payload,
        output: {},
        error: res.error ?? "Action failed.",
      })
      await recordNodeRun(supabase, run.workspaceId, run.id, {
        nodeKey: `action_${i}`, nodeType: String(actionType), category: "action", seq: seq++,
        status: "failed", input: payload, output: {}, error: res.error ?? "Action failed.",
      })
      await recordAutomationError(supabase, run.workspaceId, {
        definitionId: def.id, runId: run.id, nodeKey: `action_${i}`, nodeType: String(actionType),
        severity: "error", code: "action_failed", message: res.error ?? "Action failed.",
      })
    }
  }

  // ── Finish honestly + meter only real, executed runs ──────────────────────
  if (stepsFailed > 0) {
    await finishRun(supabase, run.id, "failed", firstError ?? "One or more actions failed.")
    await recordRunEvent(supabase, run.workspaceId, run.id, {
      level: "error", eventType: "run.failed",
      message: firstError ?? "One or more actions failed.",
      data: { steps_run: stepsRun, steps_failed: stepsFailed },
    })
    if (executedAny) await incrementRunUsage(supabase, run.workspaceId)
    return { ...base, status: "failed", stepsRun, stepsFailed, reason: firstError ?? undefined }
  }

  await finishRun(supabase, run.id, "succeeded", null)
  await recordRunEvent(supabase, run.workspaceId, run.id, {
    eventType: "run.succeeded", message: `Completed ${stepsRun} action(s).`,
    data: { steps_run: stepsRun },
  })
  await incrementRunUsage(supabase, run.workspaceId)
  return { ...base, status: "succeeded", stepsRun, stepsFailed }
}

export interface DrainOptions {
  /** Maximum number of queued runs to claim + execute in this pass. */
  limit?: number
}

/**
 * drainAutomationQueue — claim queued automation_v2_runs, execute each through
 * the real engine, record steps, and finish them. Cross-workspace: the
 * service-role admin client claims across all workspaces; each run executes
 * scoped to its own workspace_id (and RLS is moot under service-role, so every
 * write is explicitly workspace-scoped by the libs it calls).
 *
 * Idempotent (guarded claim) and tolerant (one failing run never aborts the
 * rest). Returns a per-run outcome summary for the cron response.
 */
export async function drainAutomationQueue(
  supabase: SupabaseClient,
  opts: DrainOptions = {},
): Promise<DrainResult> {
  const limit = Math.max(1, Math.min(opts.limit ?? 25, 200))

  const claimed = await claimQueuedRuns(supabase, limit)
  const outcomes: RunOutcome[] = []

  for (const run of claimed) {
    try {
      outcomes.push(await executeClaimedRun(supabase, run))
    } catch (err) {
      // A claimed run that throws unexpectedly must not be left 'running'
      // forever — finish it failed honestly and move on.
      const message = err instanceof Error ? err.message : "Run execution error."
      await finishRun(supabase, run.id, "failed", message)
      outcomes.push({
        runId: run.id,
        workspaceId: run.workspaceId,
        status: "failed",
        stepsRun: 0,
        stepsFailed: 0,
        reason: message,
      })
    }
  }

  const succeeded = outcomes.filter((o) => o.status === "succeeded").length
  const failed = outcomes.filter((o) => o.status === "failed").length
  const skipped = outcomes.filter((o) => o.status === "skipped").length

  return {
    claimed: claimed.length,
    executed: succeeded + failed,
    succeeded,
    failed,
    skipped,
    outcomes,
  }
}
