"use client"

// Typed, workspace-scoped data hooks for the Automations control centre.
//
// Honesty rule (FIX: live-vs-seed): on a real workspace these hooks must show
// the workspace's OWN data or an honest empty state — never demo seed. The only
// table that exists in the live schema today is `automation_definitions`; the
// richer additive tables (automation_runs / _approvals / _recipes / _errors /
// _integrations / _webhook_endpoints / _ai_outputs / _usage_daily) are V2 and
// raise 42P01 until their migrations are applied. Any missing table or RLS
// denial yields an HONEST EMPTY result (not seed) so the pages render their own
// empty states. `automation_definitions` rows store trigger/actions as jsonb;
// rendering a jsonb object directly as a React child crashes the page, so every
// field is coerced to a safe primitive in mapDefinitionRow().

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import type {
  ActivityItem,
  AiBuild,
  ApprovalRow,
  AutomationRow,
  CredentialAlert,
  ErrorRow,
  IntegrationRow,
  PlanQuotaRow,
  Recipe,
  ReviewQueueItem,
  RunRow,
  UsageDriver,
  WebhookDelivery,
  WebhookEndpoint,
} from "./types"

export interface HookState<T> {
  data: T
  loading: boolean
  error: string | null
  source: "live" | "empty"
  reload: () => void
}

/**
 * Generic live-data hook. `fetcher` runs a workspace-scoped Supabase query and
 * returns mapped rows; on any throw (42P01 / RLS / network) or empty result it
 * yields the supplied `emptyValue` — an HONEST empty state, never seed.
 */
function useLiveData<T>(
  emptyValue: T,
  fetcher: (supabase: ReturnType<typeof createClient>, workspaceId: string) => Promise<T | null>,
): HookState<T> {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const [data, setData] = useState<T>(emptyValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<"live" | "empty">("empty")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (!workspaceId) {
      setData(emptyValue)
      setSource("empty")
      setLoading(false)
      return
    }
    try {
      const supabase = createClient()
      const result = await fetcher(supabase, workspaceId)
      if (result && (!Array.isArray(result) || result.length > 0)) {
        setData(result)
        setSource("live")
      } else {
        setData(emptyValue)
        setSource("empty")
      }
    } catch {
      // 42P01 / RLS / network — honest empty so the page renders its empty state.
      setData(emptyValue)
      setSource("empty")
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, source, reload: load }
}

/**
 * Map a raw `automation_definitions` row (trigger/actions are jsonb; most UI
 * display fields don't exist as columns) into the UI AutomationRow shape.
 * Everything is coerced to a safe primitive — never pass a jsonb object to React.
 */
function mapDefinitionRow(raw: Record<string, unknown>): AutomationRow {
  const trig = raw.trigger as { type?: string; label?: string } | string | null | undefined
  const actions = Array.isArray(raw.actions) ? (raw.actions as unknown[]) : []
  const id = String(raw.id ?? "")
  const enabled = Boolean(raw.enabled)
  const triggerLabel =
    typeof trig === "string"
      ? trig
      : (trig?.label ?? trig?.type ?? "Manual")
  return {
    id,
    ref: `AUT-${id.replace(/-/g, "").slice(0, 6).toUpperCase() || "000000"}`,
    name: (raw.name as string) || "Automation",
    category: (raw.category as string) || "Workflow",
    trigger: String(triggerLabel),
    actionsSummary: actions.length ? `${actions.length} action${actions.length === 1 ? "" : "s"}` : "—",
    actionCount: actions.length,
    status: enabled ? "live" : "paused",
    lastChecked: (raw.updated_at as string) || (raw.created_at as string) || "",
    owner: "—",
    modules: [],
    frequency: "—",
    reviewFirst: Boolean(raw.review_first ?? true),
    enabled,
    lastRun: "—",
    nextRun: "—",
    health: "unknown",
    version: raw.version != null ? String(raw.version) : "1",
  }
}

async function fetchDefinitions(
  sb: ReturnType<typeof createClient>,
  wid: string,
): Promise<AutomationRow[] | null> {
  const { data, error } = await sb
    .from("automation_definitions")
    .select("*")
    .eq("workspace_id", wid)
    .order("created_at", { ascending: false })
    .limit(100)
  if (error) throw error
  if (!data || !data.length) return null
  return (data as Record<string, unknown>[]).map(mapDefinitionRow)
}

/* ── Home + My automations — live `automation_definitions`, safe-mapped ─────── */

// Compose a recent-activity feed from real run + approval rows. Both tables are
// workspace-scoped by RLS; any missing table / denial yields an honest empty feed.
async function fetchActivity(
  sb: ReturnType<typeof createClient>,
  wid: string,
): Promise<ActivityItem[] | null> {
  const items: ActivityItem[] = []
  try {
    const { data: runs } = await sb
      .from("automation_v2_runs")
      .select("id, status, finished_at, created_at, is_dry_run")
      .eq("workspace_id", wid)
      .order("created_at", { ascending: false })
      .limit(40)
    for (const raw of (runs ?? []) as Array<{ id: string; status?: string; finished_at?: string | null; created_at?: string | null; is_dry_run?: boolean }>) {
      if (raw.is_dry_run) continue
      const kind: ActivityItem["kind"] = raw.status === "failed" ? "error" : raw.status === "succeeded" ? "run_completed" : "action_executed"
      const verb = raw.status === "failed" ? "Run failed" : raw.status === "succeeded" ? "Run completed" : `Run ${raw.status ?? "queued"}`
      items.push({ id: `run-${raw.id}`, kind, text: `${verb} · RUN-${String(raw.id).slice(0, 8).toUpperCase()}`, at: String(raw.finished_at ?? raw.created_at ?? "") })
    }
  } catch { /* tolerant */ }
  try {
    const { data: approvals } = await sb
      .from("automation_approvals")
      .select("id, title, summary, status, created_at")
      .eq("workspace_id", wid)
      .order("created_at", { ascending: false })
      .limit(20)
    for (const raw of (approvals ?? []) as Array<{ id: string; title?: string; summary?: string; status?: string; created_at?: string | null }>) {
      items.push({ id: `apr-${raw.id}`, kind: "approval_required", text: `${raw.status === "pending" ? "Approval required" : `Approval ${raw.status}`} · ${raw.title ?? raw.summary ?? "Automation action"}`, at: String(raw.created_at ?? "") })
    }
  } catch { /* tolerant */ }
  if (items.length === 0) return null
  items.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
  return items.slice(0, 50)
}

async function fetchReviewQueue(
  sb: ReturnType<typeof createClient>,
  wid: string,
): Promise<ReviewQueueItem[] | null> {
  const { data, error } = await sb
    .from("automation_approvals")
    .select("id, title, summary, risk, status")
    .eq("workspace_id", wid)
    .in("status", ["pending", "escalated"])
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(20)
  if (error) throw error
  if (!data || data.length === 0) return null
  const mapRisk = (r: string): ReviewQueueItem["risk"] =>
    (["low", "medium", "high", "critical"] as const).includes(r as ReviewQueueItem["risk"]) ? (r as ReviewQueueItem["risk"]) : "low"
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    title: String(row.title ?? row.summary ?? "Automation action"),
    risk: mapRisk(String(row.risk ?? "low")),
  }))
}

export function useAutomationActivity() {
  return useLiveData<ActivityItem[]>([], fetchActivity)
}

export function useAutomationsHome() {
  const automations = useLiveData<AutomationRow[]>([], fetchDefinitions)
  const reviewQueue = useLiveData<ReviewQueueItem[]>([], fetchReviewQueue)
  const activity = useLiveData<ActivityItem[]>([], fetchActivity)
  return {
    automations,
    reviewQueue: reviewQueue.data,
    activity: activity.data,
  }
}

export function useMyAutomations() {
  return useLiveData<AutomationRow[]>([], fetchDefinitions)
}

/* ── V2 additive tables — honest empty until migrations applied ─────────────── */

export function useAutomationRecipes() {
  return useLiveData<{ featured: Recipe[]; recipes: Recipe[] }>(
    { featured: [], recipes: [] },
    async () => {
      // The curated catalogue lives in lib/automation/recipes (SMART_RECIPES),
      // served by /api/automations/recipes. The previous version queried the
      // empty automation_recipes table and returned null, so the page showed 0.
      const res = await fetch("/api/automations/recipes")
      if (!res.ok) return null
      const json = (await res.json()) as { ok?: boolean; recipes?: Array<Record<string, unknown>> }
      const raw = json.recipes ?? []
      if (raw.length === 0) return null
      const map = (r: Record<string, unknown>): Recipe => {
        const cat = String(r.domainLabel ?? r.domain ?? "General")
        const diff = String(r.difficulty ?? "Medium")
        return {
          id: String(r.slug),
          name: String(r.name),
          category: cat,
          tags: [cat].filter(Boolean),
          badge: r.recommended ? "Most popular" : undefined,
          trigger: String(r.triggerLabel ?? ""),
          actionCount: Number(r.actionCount ?? 0),
          modules: [cat].filter(Boolean),
          timeSaved: "",
          successRate: 0,
          difficulty: (["Easy", "Medium", "Hard"].includes(diff) ? diff : "Medium") as Recipe["difficulty"],
          reviewFirst: true,
        }
      }
      const recipes = raw.map(map)
      const featured = raw.filter((r) => r.recommended).slice(0, 6).map(map)
      return { featured, recipes }
    },
  )
}

export function useAutomationRunsLogs() {
  return useLiveData<RunRow[]>([], async (sb, wid) => {
    // Real runs live in automation_v2_runs (lib/automation/runs.ts RUNS_TABLE).
    // The previous version queried the empty `automation_runs` table just to
    // probe existence and always returned null, so the UI showed 0 runs even
    // though the engine had executed dozens.
    const { data, error } = await sb
      .from("automation_v2_runs")
      .select("id, definition_id, status, trigger_context, started_at, finished_at, is_dry_run, created_at")
      .eq("workspace_id", wid)
      .order("started_at", { ascending: false, nullsFirst: false })
      .limit(100)
    if (error) throw error
    const rows = (data ?? []).filter((r) => !(r as { is_dry_run?: boolean }).is_dry_run)
    if (rows.length === 0) return null

    // Resolve definition names in one round-trip.
    const defIds = [...new Set(rows.map((r) => (r as { definition_id?: string }).definition_id).filter(Boolean))] as string[]
    const names = new Map<string, string>()
    if (defIds.length) {
      const { data: defs } = await sb.from("automation_definitions").select("id, name").in("id", defIds)
      for (const d of (defs ?? []) as Array<{ id: string; name: string }>) names.set(d.id, d.name)
    }
    const mapStatus = (s: string): RunRow["status"] => (s === "succeeded" ? "success" : s === "failed" ? "failed" : "skipped")
    const fmtDur = (start: string | null, end: string | null): string => {
      if (!start || !end) return "—"
      const ms = new Date(end).getTime() - new Date(start).getTime()
      if (!Number.isFinite(ms) || ms < 0) return "—"
      return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
    }
    return rows.map((raw) => {
      const r = raw as {
        id: string; definition_id?: string; status?: string
        trigger_context?: Record<string, unknown> | null
        started_at?: string | null; finished_at?: string | null; created_at?: string | null
      }
      const tc = r.trigger_context ?? {}
      const trig = String((tc.trigger_type ?? tc.type ?? tc.event ?? "event") as string)
      return {
        id: r.id,
        ref: `RUN-${String(r.id).slice(0, 8).toUpperCase()}`,
        automation: (r.definition_id && names.get(r.definition_id)) || "Automation",
        triggerEvent: trig,
        status: mapStatus(r.status ?? "skipped"),
        startedAt: r.started_at ?? r.created_at ?? "",
        duration: fmtDur(r.started_at ?? r.created_at ?? null, r.finished_at ?? null),
        outputs: 0,
        approvals: 0,
        initiatedBy: "System",
        initiatedKind: "System" as const,
      }
    })
  })
}

export function useAutomationApprovals() {
  return useLiveData<ApprovalRow[]>([], async (sb, wid) => {
    const { data, error } = await sb
      .from("automation_approvals")
      .select("id, node_key, node_type, category, risk, title, summary, status, requested_by, due_at, created_at")
      .eq("workspace_id", wid)
      .in("status", ["pending", "escalated"])
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(50)
    if (error) throw error
    if (!data || data.length === 0) return null
    const mapRisk = (r: string): ApprovalRow["risk"] =>
      (["low", "medium", "high", "critical"] as const).includes(r as ApprovalRow["risk"])
        ? (r as ApprovalRow["risk"])
        : "low"
    return (data as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      ref: `APR-${String(row.id).slice(0, 8).toUpperCase()}`,
      automation: String(row.category ?? "Automation"),
      proposedAction: String(row.node_key ?? row.node_type ?? "Action"),
      risk: mapRisk(String(row.risk ?? "low")),
      relatedTo: String(row.category ?? "—"),
      relatedRef: "—",
      created: String(row.created_at ?? ""),
      requestedBy: String(row.requested_by ?? "System"),
      impact: "medium" as const,
      deadline: String(row.due_at ?? ""),
      deadlineSoon: row.due_at ? new Date(String(row.due_at)) < new Date(Date.now() + 2 * 86_400_000) : false,
      summary: String(row.summary ?? ""),
    }))
  })
}

export function useAutomationErrors() {
  return useLiveData<ErrorRow[]>([], async (sb, wid) => {
    const { data, error } = await sb
      .from("automation_errors")
      .select("id, definition_id, run_id, node_key, node_type, severity, code, message, resolved, created_at")
      .eq("workspace_id", wid)
      .order("created_at", { ascending: false })
      .limit(50)
    if (error) throw error
    if (!data || data.length === 0) return null
    const mapSev = (s: string): ErrorRow["severity"] => {
      if (s === "critical") return "critical"
      if (s === "error") return "high"
      if (s === "warning") return "medium"
      return "low"
    }
    return (data as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      ref: `ERR-${String(row.id).slice(0, 8).toUpperCase()}`,
      title: String(row.code ?? "Error"),
      subtitle: String(row.message ?? ""),
      automation: String(row.definition_id ?? "Automation"),
      automationRef: row.definition_id ? `AUT-${String(row.definition_id).slice(0, 6).toUpperCase()}` : "—",
      severity: mapSev(String(row.severity ?? "warning")),
      firstSeen: String(row.created_at ?? ""),
      latestSeen: String(row.created_at ?? ""),
      impactedRecord: "—",
      retryCount: 0,
      owner: "—",
      status: row.resolved ? "resolved" as const : "active" as const,
      safeToRetry: !row.resolved,
    }))
  })
}

export function useAutomationIntegrations() {
  return useLiveData<{ integrations: IntegrationRow[]; credentialAlerts: CredentialAlert[] }>(
    { integrations: [], credentialAlerts: [] },
    async (sb, wid) => {
      const { data, error } = await sb
        .from("automation_integrations")
        .select("id, provider, name, category, health, environment, last_sync, permissions, capabilities, executions, success_rate, enabled")
        .eq("workspace_id", wid)
        .order("created_at", { ascending: false })
        .limit(50)
      if (error) throw error
      if (!data || data.length === 0) return null
      const mapHealth = (h: string): IntegrationRow["health"] =>
        (["healthy", "warning", "error", "disconnected"] as const).includes(h as IntegrationRow["health"])
          ? (h as IntegrationRow["health"])
          : "disconnected"
      const integrations: IntegrationRow[] = (data as Record<string, unknown>[]).map((row) => ({
        id: String(row.id),
        name: String(row.name ?? row.provider ?? "Integration"),
        category: String(row.category ?? "General"),
        health: mapHealth(String(row.health ?? "disconnected")),
        environment: String(row.environment ?? "Production"),
        lastSync: String(row.last_sync ?? ""),
        permissions: String(row.permissions ?? "—"),
        capabilities: String(row.capabilities ?? "—"),
        executions: Number(row.executions ?? 0),
        successRate: Number(row.success_rate ?? 0),
      }))
      return { integrations, credentialAlerts: [] }
    },
  )
}

export function useAutomationWebhooks() {
  return useLiveData<{ endpoints: WebhookEndpoint[]; deliveries: WebhookDelivery[] }>(
    { endpoints: [], deliveries: [] },
    async (sb, wid) => {
      const [epRes, dlRes] = await Promise.all([
        sb
          .from("automation_webhook_endpoints")
          .select("id, name, token, secret_hash, active, last_triggered_at, created_at")
          .eq("workspace_id", wid)
          .order("created_at", { ascending: false })
          .limit(50),
        sb
          .from("automation_webhook_deliveries")
          .select("id, endpoint_id, received_at, source_ip, status")
          .order("received_at", { ascending: false })
          .limit(100),
      ])
      if (epRes.error) throw epRes.error
      if (!epRes.data || epRes.data.length === 0) return null
      const endpoints: WebhookEndpoint[] = (epRes.data as Record<string, unknown>[]).map((row) => ({
        id: String(row.id),
        name: String(row.name ?? "Webhook"),
        slug: String(row.token ?? "").slice(0, 12),
        url: `/api/webhooks/${String(row.token ?? "")}`,
        eventGroups: [],
        eventCount: 0,
        secretSet: Boolean(row.secret_hash),
        environment: "Production" as const,
        lastDelivery: String(row.last_triggered_at ?? row.created_at ?? ""),
        successRate: 0,
        enabled: Boolean(row.active),
      }))
      const deliveries: WebhookDelivery[] = (dlRes.data ?? []).slice(0, 30).map((row) => {
        const r = row as Record<string, unknown>
        const s = String(r.status ?? "accepted")
        return {
          id: String(r.id),
          event: "webhook.received",
          eventId: `EVT-${String(r.id).slice(0, 8).toUpperCase()}`,
          endpoint: String(r.endpoint_id ?? ""),
          environment: "Production",
          status: s === "accepted" ? "success" as const : "failed" as const,
          deliveredAt: String(r.received_at ?? ""),
          response: s === "accepted" ? 200 : 400,
          latency: "—",
          retries: 0,
        }
      })
      return { endpoints, deliveries }
    },
  )
}

export function useAutomationAiBuilder() {
  return useLiveData<AiBuild[]>([], async (sb, wid) => {
    const { data, error } = await sb
      .from("automation_ai_outputs")
      .select("id, created_at")
      .eq("workspace_id", wid)
      .order("created_at", { ascending: false })
      .limit(20)
    if (error) throw error
    if (!data || data.length === 0) return null
    return (data as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      name: `AI Build ${String(row.id).slice(0, 6).toUpperCase()}`,
      status: "Draft" as const,
      at: String(row.created_at ?? ""),
    }))
  })
}

export function useAutomationUsageLimits() {
  return useLiveData<{ drivers: UsageDriver[]; quotas: PlanQuotaRow[] }>(
    { drivers: [], quotas: [] },
    async (sb, wid) => {
      const { data, error } = await sb
        .from("automation_usage_daily")
        .select("id, day, runs, ai_credits, webhook_volume, storage_gb, module")
        .eq("workspace_id", wid)
        .order("day", { ascending: false })
        .limit(30)
      if (error) throw error
      if (!data || data.length === 0) return null
      const rows = data as Array<{ id: string; day: string; runs: number; ai_credits: number; webhook_volume: number; storage_gb: number; module: string }>
      const totalRuns = rows.reduce((s, r) => s + (r.runs ?? 0), 0)
      // Group by module for top drivers
      const byModule = new Map<string, number>()
      for (const r of rows) {
        byModule.set(r.module ?? "all", (byModule.get(r.module ?? "all") ?? 0) + (r.runs ?? 0))
      }
      const drivers: UsageDriver[] = [...byModule.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, runs]) => ({
          id: name,
          name: name === "all" ? "All automations" : name,
          runs,
          share: totalRuns > 0 ? Math.round((runs / totalRuns) * 100) : 0,
        }))
      return { drivers, quotas: [] }
    },
  )
}
