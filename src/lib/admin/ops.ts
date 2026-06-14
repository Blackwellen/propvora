import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Read helpers for the platform-admin "ops" console (GDPR data requests,
 * Stripe webhook events, AI usage). All reads use the service-role client and
 * run only in server components gated by the (admin) layout guard.
 *
 * Every function is schema-gap-safe: a missing table/column resolves to an
 * empty / "not provisioned" result rather than throwing, so the console renders
 * an honest state. No payloads, secrets, or card data are ever surfaced.
 */

const MISSING_RELATION = "42P01"
const UNDEFINED_COLUMN = "42703"
// PostgREST reports a missing table/view as PGRST205 and a missing column as
// PGRST204 (the request fails against the schema cache before reaching Postgres,
// so the raw 42P01/42703 codes are never returned over the REST path). Treat all
// four as schema gaps so a not-yet-provisioned relation renders an honest
// "not provisioned" state.
const PGRST_MISSING_RELATION = "PGRST205"
const PGRST_MISSING_COLUMN = "PGRST204"

function isSchemaGap(code?: string) {
  return (
    code === MISSING_RELATION ||
    code === UNDEFINED_COLUMN ||
    code === PGRST_MISSING_RELATION ||
    code === PGRST_MISSING_COLUMN
  )
}

/** Short, non-identifying display form of a UUID (first 8 chars). */
export function shortId(id: string | null | undefined): string {
  if (!id) return "—"
  return id.slice(0, 8)
}

/** Map of workspace_id -> name for a set of ids. Best-effort, never throws. */
async function workspaceNamesFor(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  const unique = Array.from(new Set(ids.filter(Boolean)))
  if (unique.length === 0) return out
  try {
    const admin = createAdminClient()
    const { data } = await admin.from("workspaces").select("id, name").in("id", unique)
    for (const w of data ?? []) out[w.id as string] = (w.name as string) ?? "Workspace"
  } catch {
    /* ignore */
  }
  return out
}

// ── GDPR: account deletion requests ─────────────────────────────────────────

export interface AccountDeletionRow {
  id: string
  userId: string
  workspaceId: string | null
  workspaceName: string | null
  requestType: string
  status: string
  requestedAt: string | null
  scheduledFor: string | null
  completedAt: string | null
}

export async function listAccountDeletionRequests(
  limit = 200,
): Promise<{ available: boolean; rows: AccountDeletionRow[] }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("account_deletion_requests")
      .select("id, user_id, workspace_id, request_type, status, requested_at, scheduled_for, completed_at")
      .order("requested_at", { ascending: false })
      .limit(limit)
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, rows: [] }
      return { available: true, rows: [] }
    }
    const names = await workspaceNamesFor((data ?? []).map((r) => r.workspace_id as string))
    return {
      available: true,
      rows: (data ?? []).map((r) => ({
        id: r.id as string,
        userId: r.user_id as string,
        workspaceId: (r.workspace_id as string) ?? null,
        workspaceName: r.workspace_id ? names[r.workspace_id as string] ?? null : null,
        requestType: (r.request_type as string) ?? "user_account",
        status: (r.status as string) ?? "pending",
        requestedAt: (r.requested_at as string) ?? null,
        scheduledFor: (r.scheduled_for as string) ?? null,
        completedAt: (r.completed_at as string) ?? null,
      })),
    }
  } catch {
    return { available: false, rows: [] }
  }
}

// ── GDPR: data export (SAR) requests ────────────────────────────────────────

export interface DataExportRow {
  id: string
  userId: string
  workspaceId: string | null
  workspaceName: string | null
  status: string
  requestedAt: string | null
  readyAt: string | null
  expiresAt: string | null
}

export async function listDataExportRequests(
  limit = 200,
): Promise<{ available: boolean; rows: DataExportRow[] }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("data_export_requests")
      .select("id, user_id, workspace_id, status, requested_at, ready_at, expires_at")
      .order("requested_at", { ascending: false })
      .limit(limit)
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, rows: [] }
      return { available: true, rows: [] }
    }
    const names = await workspaceNamesFor((data ?? []).map((r) => r.workspace_id as string))
    return {
      available: true,
      rows: (data ?? []).map((r) => ({
        id: r.id as string,
        userId: r.user_id as string,
        workspaceId: (r.workspace_id as string) ?? null,
        workspaceName: r.workspace_id ? names[r.workspace_id as string] ?? null : null,
        status: (r.status as string) ?? "pending",
        requestedAt: (r.requested_at as string) ?? null,
        readyAt: (r.ready_at as string) ?? null,
        expiresAt: (r.expires_at as string) ?? null,
      })),
    }
  } catch {
    return { available: false, rows: [] }
  }
}

// ── Stripe webhook events ────────────────────────────────────────────────────

export interface StripeEventRow {
  id: string
  stripeEventId: string | null
  type: string
  processedAt: string | null
}

export interface StripeEventsResult {
  available: boolean
  rows: StripeEventRow[]
  total: number
  topTypes: Array<{ type: string; count: number }>
}

export async function listStripeEvents(limit = 200): Promise<StripeEventsResult> {
  try {
    const admin = createAdminClient()
    // NEVER select `payload` — it can contain sensitive Stripe object data.
    const { data, error, count } = await admin
      .from("stripe_webhook_events")
      .select("id, stripe_event_id, type, processed_at", { count: "exact" })
      .order("processed_at", { ascending: false })
      .limit(limit)
    if (error) {
      if (isSchemaGap(error.code)) return { available: false, rows: [], total: 0, topTypes: [] }
      return { available: true, rows: [], total: 0, topTypes: [] }
    }

    const rows: StripeEventRow[] = (data ?? []).map((r) => ({
      id: r.id as string,
      stripeEventId: (r.stripe_event_id as string) ?? null,
      type: (r.type as string) ?? "—",
      processedAt: (r.processed_at as string) ?? null,
    }))

    // by-type counts over the fetched window (top 5).
    const byType: Record<string, number> = {}
    for (const r of rows) byType[r.type] = (byType[r.type] ?? 0) + 1
    const topTypes = Object.entries(byType)
      .map(([type, c]) => ({ type, count: c }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return { available: true, rows, total: count ?? rows.length, topTypes }
  } catch {
    return { available: false, rows: [], total: 0, topTypes: [] }
  }
}

// ── AI usage ──────────────────────────────────────────────────────────────────

export interface AiUsageDayRow {
  workspaceId: string
  workspaceName: string
  day: string
  tokensIn: number
  tokensOut: number
  costPence: number
}

export interface AiUsageResult {
  available: boolean
  /** "rollup" = ai_token_usage daily table; "metering" = aggregated from raw rows. */
  source: "rollup" | "metering" | null
  rows: AiUsageDayRow[]
  totals: { tokensIn: number; tokensOut: number; costPence: number }
}

/**
 * AI usage per workspace/day. Prefers the `ai_token_usage` daily rollup
 * (tokens_in / tokens_out / cost_pence). If that table is absent, falls back to
 * aggregating `ai_usage_metering` raw rows (cost_usd -> pence) by workspace+day.
 */
export async function listAiUsage(limit = 200): Promise<AiUsageResult> {
  const admin = createAdminClient()

  // Primary: ai_token_usage daily rollup.
  try {
    const { data, error } = await admin
      .from("ai_token_usage")
      .select("workspace_id, day, tokens_in, tokens_out, cost_pence")
      .order("day", { ascending: false })
      .limit(limit)
    if (!error) {
      const names = await workspaceNamesFor((data ?? []).map((r) => r.workspace_id as string))
      const rows: AiUsageDayRow[] = (data ?? []).map((r) => ({
        workspaceId: r.workspace_id as string,
        workspaceName: names[r.workspace_id as string] ?? shortId(r.workspace_id as string),
        day: (r.day as string) ?? "",
        tokensIn: Number(r.tokens_in ?? 0),
        tokensOut: Number(r.tokens_out ?? 0),
        costPence: Number(r.cost_pence ?? 0),
      }))
      const totals = rows.reduce(
        (acc, r) => ({
          tokensIn: acc.tokensIn + r.tokensIn,
          tokensOut: acc.tokensOut + r.tokensOut,
          costPence: acc.costPence + r.costPence,
        }),
        { tokensIn: 0, tokensOut: 0, costPence: 0 },
      )
      return { available: true, source: "rollup", rows, totals }
    }
    if (!isSchemaGap(error.code)) {
      return { available: true, source: "rollup", rows: [], totals: { tokensIn: 0, tokensOut: 0, costPence: 0 } }
    }
    // else: rollup table missing — fall through to metering.
  } catch {
    /* fall through */
  }

  // Fallback: aggregate ai_usage_metering raw rows by workspace + day.
  try {
    const { data, error } = await admin
      .from("ai_usage_metering")
      .select("workspace_id, input_tokens, output_tokens, cost_usd, created_at")
      .order("created_at", { ascending: false })
      .limit(5000)
    if (error) {
      if (isSchemaGap(error.code)) {
        return { available: false, source: null, rows: [], totals: { tokensIn: 0, tokensOut: 0, costPence: 0 } }
      }
      return { available: true, source: "metering", rows: [], totals: { tokensIn: 0, tokensOut: 0, costPence: 0 } }
    }

    const agg: Record<string, AiUsageDayRow> = {}
    for (const r of data ?? []) {
      const wid = r.workspace_id as string
      const day = ((r.created_at as string) ?? "").slice(0, 10)
      const key = `${wid}__${day}`
      if (!agg[key]) {
        agg[key] = { workspaceId: wid, workspaceName: "", day, tokensIn: 0, tokensOut: 0, costPence: 0 }
      }
      agg[key].tokensIn += Number(r.input_tokens ?? 0)
      agg[key].tokensOut += Number(r.output_tokens ?? 0)
      // cost_usd numeric -> pence (USD treated as the cost currency; *100 for pence-equivalent minor units).
      agg[key].costPence += Math.round(Number(r.cost_usd ?? 0) * 100)
    }

    let rows = Object.values(agg).sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0))
    rows = rows.slice(0, limit)
    const names = await workspaceNamesFor(rows.map((r) => r.workspaceId))
    for (const r of rows) r.workspaceName = names[r.workspaceId] ?? shortId(r.workspaceId)

    const totals = rows.reduce(
      (acc, r) => ({
        tokensIn: acc.tokensIn + r.tokensIn,
        tokensOut: acc.tokensOut + r.tokensOut,
        costPence: acc.costPence + r.costPence,
      }),
      { tokensIn: 0, tokensOut: 0, costPence: 0 },
    )
    return { available: true, source: "metering", rows, totals }
  } catch {
    return { available: false, source: null, rows: [], totals: { tokensIn: 0, tokensOut: 0, costPence: 0 } }
  }
}
