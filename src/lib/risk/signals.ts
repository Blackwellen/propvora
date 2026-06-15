import "server-only"

/**
 * P8 — Risk & Fraud Engine: signal I/O + ingest.
 *
 * Responsibilities:
 *   • record a risk_event and recompute the workspace's rolled-up score;
 *   • read a workspace's risk_events;
 *   • INGEST existing platform signals (P2 marketplace_risk_signals /
 *     marketplace_disputes / marketplace_transactions, P6 verification_checks /
 *     sanctions_screenings) by translating each into a risk_event.
 *
 * All reads/writes use a service-role client and MUST only run behind the
 * platform-admin guard. Every query is 42P01-tolerant (a missing source table
 * is a no-op, never a throw).
 *
 * HONESTY: ingested events are SIGNALS to assist human review. Ingest is
 * idempotent per source row (we de-dupe on detail.source_id) so re-running the
 * sync never inflates a score.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import {
  type RecordRiskEventArgs,
  type RiskBand,
  type RiskEvent,
  type RiskResult,
  type RiskScore,
  type RiskSeverity,
  type WorkspaceRiskRow,
} from "./types"
import { recomputeWorkspaceRisk } from "./engine"

type AnyClient = SupabaseClient<any, any, any>

const MISSING_RELATION = "42P01"
const UNDEFINED_COLUMN = "42703"
const PGRST_MISSING_RELATION = "PGRST205"
const PGRST_MISSING_COLUMN = "PGRST204"

export function isSchemaGap(code?: string): boolean {
  return (
    code === MISSING_RELATION ||
    code === UNDEFINED_COLUMN ||
    code === PGRST_MISSING_RELATION ||
    code === PGRST_MISSING_COLUMN
  )
}

function mapEvent(r: Record<string, any>): RiskEvent {
  return {
    id: r.id as string,
    workspaceId: r.workspace_id as string,
    eventType: (r.event_type as string) ?? "",
    severity: ((r.severity as string) ?? "low") as RiskSeverity,
    scoreDelta: Number(r.score_delta ?? 0),
    detail: (r.detail as Record<string, unknown>) ?? {},
    source: (r.source as string) ?? null,
    createdBy: (r.created_by as string) ?? null,
    createdAt: (r.created_at as string) ?? null,
  }
}

/**
 * Insert a risk_event and recompute the workspace's score.
 * Returns the inserted event (or null if the table is absent / insert failed).
 */
export async function recordRiskEvent(
  supabase: AnyClient,
  args: RecordRiskEventArgs
): Promise<RiskEvent | null> {
  const row = {
    workspace_id: args.workspaceId,
    event_type: args.eventType,
    severity: args.severity ?? "low",
    score_delta: args.scoreDelta ?? 0,
    detail: args.detail ?? {},
    source: args.source ?? null,
    created_by: args.createdBy ?? null,
  }

  try {
    const { data, error } = await supabase
      .from("risk_events")
      .insert(row)
      .select(
        "id, workspace_id, event_type, severity, score_delta, detail, source, created_by, created_at"
      )
      .maybeSingle()
    if (error) {
      if (!isSchemaGap(error.code)) {
        console.error("[risk] recordRiskEvent insert failed:", error.message)
      }
      return null
    }
    // Recompute the rolled-up score off the full event history.
    await recomputeWorkspaceRisk(supabase, args.workspaceId)
    return data ? mapEvent(data) : null
  } catch (err) {
    console.error("[risk] recordRiskEvent unexpected:", err)
    return null
  }
}

/** Read a workspace's risk_events, newest first. 42P01-tolerant. */
export async function getWorkspaceRiskEvents(
  supabase: AnyClient,
  workspaceId: string,
  limit = 100
): Promise<RiskResult<RiskEvent[]>> {
  try {
    const { data, error } = await supabase
      .from("risk_events")
      .select(
        "id, workspace_id, event_type, severity, score_delta, detail, source, created_by, created_at"
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, data: [] }
      return { available: true, data: [] }
    }
    return { available: true, data: (data ?? []).map(mapEvent) }
  } catch {
    return { available: false, data: [] }
  }
}

/**
 * Has this exact source row already been ingested for the workspace? We key on
 * detail->>'source_id' so re-running ingest is idempotent.
 */
async function alreadyIngested(
  supabase: AnyClient,
  workspaceId: string,
  eventType: string,
  sourceId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("risk_events")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("event_type", eventType)
      .eq("detail->>source_id", sourceId)
      .limit(1)
    if (error) return false
    return (data?.length ?? 0) > 0
  } catch {
    return false
  }
}

/** Severity → score weighting is handled by rules; ingest sets a sane severity. */
interface IngestSummary {
  available: boolean
  ingested: number
  skipped: number
}

/**
 * Ingest P6 sanctions screenings: each `matched` screening becomes a
 * `sanctions_signal` event. Non-matches are ignored (no signal).
 */
export async function ingestSanctionsSignals(
  supabase: AnyClient,
  workspaceId: string
): Promise<IngestSummary> {
  let ingested = 0
  let skipped = 0
  try {
    const { data, error } = await supabase
      .from("sanctions_screenings")
      .select("id, subject_name, country_code, matched, match_detail, screened_at")
      .eq("workspace_id", workspaceId)
      .eq("matched", true)
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, ingested, skipped }
      return { available: true, ingested, skipped }
    }
    for (const s of data ?? []) {
      const sourceId = s.id as string
      if (await alreadyIngested(supabase, workspaceId, "sanctions_signal", sourceId)) {
        skipped++
        continue
      }
      const ev = await recordRiskEvent(supabase, {
        workspaceId,
        eventType: "sanctions_signal",
        severity: "critical",
        source: "sanctions",
        detail: {
          source_id: sourceId,
          subject: (s.subject_name as string) ?? null,
          country: (s.country_code as string) ?? null,
          screened_at: (s.screened_at as string) ?? null,
        },
      })
      if (ev) ingested++
    }
    return { available: true, ingested, skipped }
  } catch {
    return { available: false, ingested, skipped }
  }
}

/**
 * Ingest P6 KYC failures. A `verification_checks` row whose result is a fail
 * becomes a `kyc_failed` event. We resolve the owning workspace via
 * identity_verifications.
 */
export async function ingestKycFailures(
  supabase: AnyClient,
  workspaceId: string
): Promise<IngestSummary> {
  let ingested = 0
  let skipped = 0
  try {
    // Resolve verification ids for this workspace first.
    const { data: vers, error: vErr } = await supabase
      .from("identity_verifications")
      .select("id")
      .eq("workspace_id", workspaceId)
    if (vErr) {
      if (isSchemaGap(vErr.code)) return { available: false, ingested, skipped }
      return { available: true, ingested, skipped }
    }
    const verIds = (vers ?? []).map((v: Record<string, any>) => v.id as string)
    if (verIds.length === 0) return { available: true, ingested, skipped }

    const { data, error } = await supabase
      .from("verification_checks")
      .select("id, verification_id, check_type, result, detail, created_at")
      .in("verification_id", verIds)
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, ingested, skipped }
      return { available: true, ingested, skipped }
    }
    for (const c of data ?? []) {
      const result = ((c.result as string) ?? "").toLowerCase()
      const isFail = result === "fail" || result === "failed" || result === "rejected"
      if (!isFail) continue
      const sourceId = c.id as string
      if (await alreadyIngested(supabase, workspaceId, "kyc_failed", sourceId)) {
        skipped++
        continue
      }
      const ev = await recordRiskEvent(supabase, {
        workspaceId,
        eventType: "kyc_failed",
        severity: "high",
        source: "verification",
        detail: {
          source_id: sourceId,
          check_type: (c.check_type as string) ?? null,
          result,
        },
      })
      if (ev) ingested++
    }
    return { available: true, ingested, skipped }
  } catch {
    return { available: false, ingested, skipped }
  }
}

/**
 * Ingest P2 marketplace disputes RAISED AGAINST this workspace as
 * `dispute_opened` events.
 */
export async function ingestDisputes(
  supabase: AnyClient,
  workspaceId: string
): Promise<IngestSummary> {
  let ingested = 0
  let skipped = 0
  try {
    const { data, error } = await supabase
      .from("marketplace_disputes")
      .select("id, reason, status, against_workspace_id, created_at")
      .eq("against_workspace_id", workspaceId)
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, ingested, skipped }
      return { available: true, ingested, skipped }
    }
    for (const d of data ?? []) {
      const sourceId = d.id as string
      if (await alreadyIngested(supabase, workspaceId, "dispute_opened", sourceId)) {
        skipped++
        continue
      }
      const open = ((d.status as string) ?? "").toLowerCase()
      const severity: RiskSeverity = open === "resolved" || open === "closed" ? "low" : "medium"
      const ev = await recordRiskEvent(supabase, {
        workspaceId,
        eventType: "dispute_opened",
        severity,
        source: "dispute",
        detail: {
          source_id: sourceId,
          reason: (d.reason as string) ?? null,
          status: (d.status as string) ?? null,
        },
      })
      if (ev) ingested++
    }
    return { available: true, ingested, skipped }
  } catch {
    return { available: false, ingested, skipped }
  }
}

/**
 * Ingest P2 marketplace risk signals (the pre-existing per-workspace signal
 * feed) as generic `marketplace_signal` events, preserving their severity.
 */
export async function ingestMarketplaceSignals(
  supabase: AnyClient,
  workspaceId: string
): Promise<IngestSummary> {
  let ingested = 0
  let skipped = 0
  try {
    const { data, error } = await supabase
      .from("marketplace_risk_signals")
      .select("id, signal_type, severity, detail, created_at")
      .eq("workspace_id", workspaceId)
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, ingested, skipped }
      return { available: true, ingested, skipped }
    }
    for (const s of data ?? []) {
      const sourceId = s.id as string
      if (await alreadyIngested(supabase, workspaceId, "marketplace_signal", sourceId)) {
        skipped++
        continue
      }
      const raw = ((s.severity as string) ?? "low").toLowerCase()
      const severity: RiskSeverity = (["low", "medium", "high", "critical"].includes(raw)
        ? raw
        : "low") as RiskSeverity
      const ev = await recordRiskEvent(supabase, {
        workspaceId,
        eventType: "marketplace_signal",
        severity,
        source: "marketplace",
        detail: {
          source_id: sourceId,
          signal_type: (s.signal_type as string) ?? null,
        },
      })
      if (ev) ingested++
    }
    return { available: true, ingested, skipped }
  } catch {
    return { available: false, ingested, skipped }
  }
}

// ── Dashboard reads ──────────────────────────────────────────────────────────

function mapScore(r: Record<string, any>): RiskScore {
  return {
    workspaceId: r.workspace_id as string,
    score: Number(r.score ?? 0),
    band: ((r.band as string) ?? "low") as RiskBand,
    lastEventAt: (r.last_event_at as string) ?? null,
    flagged: Boolean(r.flagged),
    flaggedReason: (r.flagged_reason as string) ?? null,
    updatedAt: (r.updated_at as string) ?? null,
  }
}

/** Read a single workspace's score row. 42P01-tolerant. */
export async function getWorkspaceRiskScore(
  supabase: AnyClient,
  workspaceId: string
): Promise<RiskResult<RiskScore | null>> {
  try {
    const { data, error } = await supabase
      .from("risk_scores")
      .select("workspace_id, score, band, last_event_at, flagged, flagged_reason, updated_at")
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, data: null }
      return { available: true, data: null }
    }
    return { available: true, data: data ? mapScore(data) : null }
  } catch {
    return { available: false, data: null }
  }
}

/**
 * List workspaces ranked by risk score (highest first) joined with workspace
 * display info + event counts, for the admin dashboard. 42P01-tolerant.
 */
export async function listWorkspaceRiskRows(
  supabase: AnyClient,
  opts: { band?: RiskBand | null; flaggedOnly?: boolean; limit?: number } = {}
): Promise<RiskResult<WorkspaceRiskRow[]>> {
  const limit = opts.limit ?? 200
  let scores: Array<Record<string, any>> = []
  try {
    let query = supabase
      .from("risk_scores")
      .select("workspace_id, score, band, last_event_at, flagged, flagged_reason, updated_at")
      .order("score", { ascending: false })
      .limit(limit)
    if (opts.band) query = query.eq("band", opts.band)
    if (opts.flaggedOnly) query = query.eq("flagged", true)
    const { data, error } = await query
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, data: [] }
      return { available: true, data: [] }
    }
    scores = data ?? []
  } catch {
    return { available: false, data: [] }
  }

  const ids = scores.map((s) => s.workspace_id as string)
  const [wsInfo, eventCounts] = await Promise.all([
    workspaceInfoFor(supabase, ids),
    eventCountsFor(supabase, ids),
  ])

  const rows: WorkspaceRiskRow[] = scores.map((s) => {
    const wsId = s.workspace_id as string
    const ws = wsInfo[wsId]
    return {
      ...mapScore(s),
      workspaceName: ws?.name ?? null,
      country: ws?.country ?? null,
      eventCount: eventCounts[wsId] ?? 0,
    }
  })
  return { available: true, data: rows }
}

interface WsInfo {
  name: string
  country: string | null
}

async function workspaceInfoFor(
  supabase: AnyClient,
  ids: string[]
): Promise<Record<string, WsInfo>> {
  const out: Record<string, WsInfo> = {}
  const unique = Array.from(new Set(ids.filter(Boolean)))
  if (unique.length === 0) return out
  try {
    const { data } = await supabase
      .from("workspaces")
      .select("id, name, business_country_code")
      .in("id", unique)
    for (const w of data ?? []) {
      out[w.id as string] = {
        name: (w.name as string) ?? "Workspace",
        country: (w.business_country_code as string) ?? null,
      }
    }
  } catch {
    /* ignore */
  }
  return out
}

async function eventCountsFor(
  supabase: AnyClient,
  ids: string[]
): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  if (ids.length === 0) return out
  try {
    const { data, error } = await supabase
      .from("risk_events")
      .select("workspace_id")
      .in("workspace_id", ids)
    if (error) return out
    for (const e of data ?? []) {
      const k = e.workspace_id as string
      out[k] = (out[k] ?? 0) + 1
    }
  } catch {
    /* ignore */
  }
  return out
}

/** Recent high/critical-severity events across ALL workspaces. 42P01-tolerant. */
export async function recentHighSeverityEvents(
  supabase: AnyClient,
  limit = 25
): Promise<RiskResult<Array<RiskEvent & { workspaceName: string | null }>>> {
  let events: RiskEvent[] = []
  try {
    const { data, error } = await supabase
      .from("risk_events")
      .select(
        "id, workspace_id, event_type, severity, score_delta, detail, source, created_by, created_at"
      )
      .in("severity", ["high", "critical"])
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, data: [] }
      return { available: true, data: [] }
    }
    events = (data ?? []).map(mapEvent)
  } catch {
    return { available: false, data: [] }
  }

  const wsInfo = await workspaceInfoFor(
    supabase,
    events.map((e) => e.workspaceId)
  )
  return {
    available: true,
    data: events.map((e) => ({
      ...e,
      workspaceName: wsInfo[e.workspaceId]?.name ?? null,
    })),
  }
}

/**
 * Run every ingest path for a workspace, then ensure the score is recomputed.
 * Returns a per-source summary. Safe to re-run (idempotent per source row).
 */
export async function syncWorkspaceSignals(
  supabase: AnyClient,
  workspaceId: string
): Promise<{
  sanctions: IngestSummary
  kyc: IngestSummary
  disputes: IngestSummary
  marketplace: IngestSummary
}> {
  const [sanctions, kyc, disputes, marketplace] = await Promise.all([
    ingestSanctionsSignals(supabase, workspaceId),
    ingestKycFailures(supabase, workspaceId),
    ingestDisputes(supabase, workspaceId),
    ingestMarketplaceSignals(supabase, workspaceId),
  ])
  await recomputeWorkspaceRisk(supabase, workspaceId)
  return { sanctions, kyc, disputes, marketplace }
}
