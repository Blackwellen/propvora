// Automation enqueue — the missing producer for the v2 run pipeline.
//
// The v2 engine already had: evaluate.ts (trigger → live-data matches),
// execute.ts (real, review-first actions), executor.ts (drainAutomationQueue
// claims `queued` automation_v2_runs and executes them), and the cron that
// drains. What was missing was the step that EVALUATES the active
// `automation_definitions` and ENQUEUES `queued` runs — so nothing ever fed the
// drain and automations never fired on real events.
//
// This module closes that gap. It is the V1 "Smart Recipes" base entitlement:
// it fires for any workspace whose plan includes `automation` (Scale+), and is
// independent of the canvasLite / automationsFull UI flags (those gate the
// visual builder / advanced surfaces, not whether saved automations run).
//
// Reuses the existing, real evaluateRule() by shaping each definition's nested
// trigger ({type, config}) into the flat SmartRule shape evaluateRule reads.

import type { SupabaseClient } from "@supabase/supabase-js"
import { evaluateRule } from "./evaluate"
import { recordRun } from "./runs"
import type { SmartRule, TriggerType } from "./types"
import { getWorkspaceTier } from "@/lib/billing/gates"
import { featuresForTier } from "@/lib/billing/entitlements"

export interface EnqueueSummary {
  definitionsEvaluated: number
  matches: number
  enqueued: number
  errors: string[]
}

/**
 * Evaluate one workspace's enabled automation_definitions against live data and
 * enqueue a `queued` automation_v2_run for each NEW match. Deduped against runs
 * from the last 30 days so the same overdue item doesn't re-enqueue every cycle.
 * The existing drain then executes each queued run (review-first; gated nodes
 * become approvals, never auto-destructive).
 */
export async function enqueueDueRuns(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<EnqueueSummary> {
  const summary: EnqueueSummary = { definitionsEvaluated: 0, matches: 0, enqueued: 0, errors: [] }

  const { data: defs, error } = await supabase
    .from("automation_definitions")
    .select("id, name, trigger, enabled")
    .eq("workspace_id", workspaceId)
    .eq("enabled", true)
  if (error || !defs) {
    if (error) summary.errors.push(error.message)
    return summary
  }

  // Dedupe set: dedupe_keys already enqueued/run in the last 30 days.
  const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const seen = new Set<string>()
  try {
    const { data: recent } = await supabase
      .from("automation_v2_runs")
      .select("trigger_context")
      .eq("workspace_id", workspaceId)
      .gte("created_at", cutoff)
    for (const r of recent ?? []) {
      const k = (r as { trigger_context?: { dedupe_key?: string } }).trigger_context?.dedupe_key
      if (k) seen.add(k)
    }
  } catch {
    /* best-effort dedupe — a missing index/table must not block enqueue */
  }

  for (const raw of defs) {
    summary.definitionsEvaluated++
    const d = raw as { id: string; name: string; trigger: { type?: string; config?: Record<string, unknown> } | null }
    const trig = d.trigger ?? {}
    if (!trig.type) continue

    // Shape into the flat SmartRule that evaluateRule reads (it only uses
    // workspace_id, trigger_type and trigger_config).
    const ruleLike = {
      id: d.id,
      workspace_id: workspaceId,
      name: d.name,
      enabled: true,
      trigger_type: trig.type as TriggerType,
      trigger_config: (trig.config ?? {}) as Record<string, unknown>,
    } as unknown as SmartRule

    let matches
    try {
      matches = await evaluateRule(supabase, ruleLike)
    } catch (e) {
      summary.errors.push(`${d.name}: ${e instanceof Error ? e.message : "evaluation failed"}`)
      continue
    }
    summary.matches += matches.length

    for (const m of matches) {
      const dedupeKey = `${d.id}:${m.entity_type}:${m.entity_id}`
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)
      const res = await recordRun(supabase, workspaceId, {
        definitionId: d.id,
        status: "queued",
        start: false,
        triggerContext: {
          dedupe_key: dedupeKey,
          trigger_type: trig.type,
          entity_type: m.entity_type,
          entity_id: m.entity_id,
          property_id: m.property_id ?? null,
          summary: m.summary,
          facts: m.facts,
        },
      })
      if (res) summary.enqueued++
    }
  }
  return summary
}

/**
 * Evaluate + enqueue across ALL workspaces that have enabled automations and an
 * entitled plan. Called by the cron BEFORE drainAutomationQueue. Best-effort and
 * never throws — a single bad workspace is skipped, not allowed to fail the run.
 */
export async function enqueueAllDue(
  supabase: SupabaseClient,
  opts: { maxWorkspaces?: number } = {},
): Promise<{ workspacesEnqueued: number; enqueued: number }> {
  let workspacesEnqueued = 0
  let enqueued = 0
  try {
    const { data } = await supabase
      .from("automation_definitions")
      .select("workspace_id")
      .eq("enabled", true)
      .limit(5000)
    const ids = [...new Set((data ?? []).map((r) => (r as { workspace_id: string }).workspace_id))].slice(
      0,
      opts.maxWorkspaces ?? 2000,
    )
    for (const wid of ids) {
      // Entitlement gate: automations only fire for plans that include them.
      try {
        const tier = await getWorkspaceTier(supabase, wid)
        if (!featuresForTier(tier).automation) continue
      } catch {
        continue
      }
      const s = await enqueueDueRuns(supabase, wid)
      if (s.enqueued > 0) workspacesEnqueued++
      enqueued += s.enqueued
    }
  } catch {
    /* best-effort */
  }
  return { workspacesEnqueued, enqueued }
}
