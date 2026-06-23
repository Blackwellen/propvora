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

export function useAutomationsHome() {
  const automations = useLiveData<AutomationRow[]>([], fetchDefinitions)
  return {
    automations,
    reviewQueue: [] as ReviewQueueItem[],
    activity: [] as ActivityItem[],
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
    const { error } = await sb.from("automation_approvals").select("id").eq("workspace_id", wid).limit(1)
    if (error) throw error
    return null
  })
}

export function useAutomationErrors() {
  return useLiveData<ErrorRow[]>([], async (sb, wid) => {
    const { error } = await sb.from("automation_errors").select("id").eq("workspace_id", wid).limit(1)
    if (error) throw error
    return null
  })
}

export function useAutomationIntegrations() {
  return useLiveData<{ integrations: IntegrationRow[]; credentialAlerts: CredentialAlert[] }>(
    { integrations: [], credentialAlerts: [] },
    async (sb, wid) => {
      const { error } = await sb.from("automation_integrations").select("id").eq("workspace_id", wid).limit(1)
      if (error) throw error
      return null
    },
  )
}

export function useAutomationWebhooks() {
  return useLiveData<{ endpoints: WebhookEndpoint[]; deliveries: WebhookDelivery[] }>(
    { endpoints: [], deliveries: [] },
    async (sb, wid) => {
      const { error } = await sb.from("automation_webhook_endpoints").select("id").eq("workspace_id", wid).limit(1)
      if (error) throw error
      return null
    },
  )
}

export function useAutomationAiBuilder() {
  return useLiveData<AiBuild[]>([], async (sb, wid) => {
    const { error } = await sb.from("automation_ai_outputs").select("id").eq("workspace_id", wid).limit(1)
    if (error) throw error
    return null
  })
}

export function useAutomationUsageLimits() {
  return useLiveData<{ drivers: UsageDriver[]; quotas: PlanQuotaRow[] }>(
    { drivers: [], quotas: [] },
    async (sb, wid) => {
      const { error } = await sb.from("automation_usage_daily").select("id").eq("workspace_id", wid).limit(1)
      if (error) throw error
      return null
    },
  )
}
