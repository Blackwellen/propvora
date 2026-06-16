// Automation Engine — PLATFORM ADMIN data layer (cross-tenant, service-role).
//
// Read-only aggregates + a few explicit admin controls for the platform console:
//   * overview metrics (definitions / active / runs / approvals / errors)
//   * recent runs across all workspaces
//   * recent errors across all workspaces
//   * abuse signals (workspaces with high run/error/failed volume)
//   * the node registry (with per-node enabled kill-switch)
//   * the plan limits table
//
// Every function takes the SERVICE-ROLE admin client (the (admin) layout already
// gates access). All reads are tolerant (empty on error). The only writes are
// explicit admin actions: toggle a node kill-switch, edit a plan limit.

import type { SupabaseClient } from "@supabase/supabase-js"

type Row = Record<string, unknown>

async function countAll(supabase: SupabaseClient, table: string): Promise<number> {
  try {
    const { count } = await supabase.from(table).select("id", { count: "exact", head: true })
    return count ?? 0
  } catch {
    return 0
  }
}

export interface AdminOverview {
  definitions: number
  activeDefinitions: number
  runsTotal: number
  runsFailed: number
  approvalsPending: number
  errorsOpen: number
  killSwitchedNodes: number
}

export async function getAdminOverview(supabase: SupabaseClient): Promise<AdminOverview> {
  const [definitions, runsTotal, killSwitchedNodes] = await Promise.all([
    countAll(supabase, "automation_definitions"),
    countAll(supabase, "automation_v2_runs"),
    safeCountWhere(supabase, "automation_node_registry", "enabled", false),
  ])
  const activeDefinitions = await safeCountWhere(supabase, "automation_definitions", "enabled", true)
  const runsFailed = await safeCountWhere(supabase, "automation_v2_runs", "status", "failed")
  const approvalsPending = await safeCountWhere(supabase, "automation_approvals", "status", "pending")
  const errorsOpen = await safeCountWhere(supabase, "automation_errors", "resolved", false)
  return { definitions, activeDefinitions, runsTotal, runsFailed, approvalsPending, errorsOpen, killSwitchedNodes }
}

async function safeCountWhere(supabase: SupabaseClient, table: string, col: string, val: unknown): Promise<number> {
  try {
    const { count } = await supabase.from(table).select("id", { count: "exact", head: true }).eq(col, val)
    return count ?? 0
  } catch {
    return 0
  }
}

export async function listRecentRuns(supabase: SupabaseClient, limit = 50): Promise<Row[]> {
  try {
    const { data } = await supabase
      .from("automation_v2_runs")
      .select("id, workspace_id, definition_id, status, is_dry_run, created_at, finished_at, error")
      .order("created_at", { ascending: false })
      .limit(limit)
    return (data as Row[]) ?? []
  } catch { return [] }
}

export async function listRecentErrors(supabase: SupabaseClient, limit = 50): Promise<Row[]> {
  try {
    const { data } = await supabase
      .from("automation_errors")
      .select("id, workspace_id, severity, code, message, node_type, resolved, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)
    return (data as Row[]) ?? []
  } catch { return [] }
}

export interface AbuseSignal { workspace_id: string; runs: number; failed: number }

/** Aggregate run + failure counts per workspace (a simple abuse signal). */
export async function abuseSignals(supabase: SupabaseClient, limit = 20): Promise<AbuseSignal[]> {
  try {
    const { data } = await supabase
      .from("automation_v2_runs")
      .select("workspace_id, status")
      .order("created_at", { ascending: false })
      .limit(2000)
    const map = new Map<string, { runs: number; failed: number }>()
    for (const r of (data as Array<{ workspace_id: string; status: string }>) ?? []) {
      const cur = map.get(r.workspace_id) ?? { runs: 0, failed: 0 }
      cur.runs += 1
      if (r.status === "failed") cur.failed += 1
      map.set(r.workspace_id, cur)
    }
    return Array.from(map.entries())
      .map(([workspace_id, v]) => ({ workspace_id, ...v }))
      .sort((a, b) => b.runs - a.runs || b.failed - a.failed)
      .slice(0, limit)
  } catch { return [] }
}

export async function listNodeRegistry(supabase: SupabaseClient): Promise<Row[]> {
  try {
    const { data } = await supabase
      .from("automation_node_registry")
      .select("*")
      .order("category", { ascending: true })
      .order("risk", { ascending: false })
    return (data as Row[]) ?? []
  } catch { return [] }
}

export async function listPlanLimits(supabase: SupabaseClient): Promise<Row[]> {
  try {
    const { data } = await supabase.from("automation_plan_limits").select("*")
    return (data as Row[]) ?? []
  } catch { return [] }
}

/** Toggle a node's kill-switch (enabled). Service-role admin only. */
export async function setNodeEnabled(supabase: SupabaseClient, nodeType: string, enabled: boolean): Promise<void> {
  await supabase.from("automation_node_registry").update({ enabled, updated_at: new Date().toISOString() }).eq("node_type", nodeType)
}
