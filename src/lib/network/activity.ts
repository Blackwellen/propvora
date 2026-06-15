import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  ActivityItem,
  ActivityModule,
  ActivityResult,
  ActivitySeverity,
} from "./types"

/* ──────────────────────────────────────────────────────────────────────────
   UNIFIED CROSS-MODULE ACTIVITY.

   A single, typed, time-ordered feed that merges REAL recorded events the
   workspace is a PARTY to, drawn from the existing v2 module tables:

     marketplace  -> marketplace_transactions (buyer or seller is the workspace)
     booking      -> bookings (host workspace OR customer workspace)
     supplier     -> supplier_quotes + supplier_jobs (workspace-owned)
     payout       -> payouts (workspace-owned)
     dispute      -> marketplace_disputes (raised_by OR against the workspace)
     kyc          -> identity_verifications (workspace-owned)
     risk         -> risk_events (workspace-owned; visible to its own workspace)
     audit        -> audit_log (workspace-owned)

   HONESTY: every item is a row that actually exists. Nothing is synthesised.

   Strict scoping: each source query filters so the workspace is a party. RLS on
   the underlying tables is the backstop, but we filter explicitly here too so a
   service-role caller can't accidentally widen scope.

   Tolerant: each module is queried independently inside its own try/catch; a
   missing relation (42P01) simply contributes nothing. The feed degrades, it
   never crashes.
─────────────────────────────────────────────────────────────────────────── */

const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204", "PGRST202", "42703"])

function isMissing(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  if (!e) return false
  if (e.code && NOT_PROVISIONED.has(e.code)) return true
  return /does not exist|not provisioned|relation .* does not exist|could not find/i.test(
    e.message ?? ""
  )
}

interface ActivityOptions {
  modules?: ActivityModule[]
  limit?: number
}

const ALL_MODULES: ActivityModule[] = [
  "marketplace",
  "booking",
  "supplier",
  "payout",
  "dispute",
  "kyc",
  "risk",
  "audit",
]

/** Per-module fetch cap before the global merge/sort/limit. */
const PER_MODULE_CAP = 200

export async function getWorkspaceActivity(
  supabase: SupabaseClient,
  workspaceId: string,
  options?: ActivityOptions
): Promise<ActivityResult> {
  const limit = Math.min(Math.max(options?.limit ?? 60, 1), 500)
  const wanted = options?.modules?.length
    ? ALL_MODULES.filter((m) => options.modules!.includes(m))
    : ALL_MODULES

  if (!workspaceId) {
    return { ready: true, items: [], availableModules: [] }
  }

  const available: ActivityModule[] = []
  const all: ActivityItem[] = []

  const collect = async (
    module: ActivityModule,
    fn: () => Promise<ActivityItem[] | null>
  ) => {
    if (!wanted.includes(module)) return
    try {
      const items = await fn()
      if (items !== null) {
        available.push(module)
        all.push(...items)
      }
    } catch {
      /* tolerate */
    }
  }

  await Promise.all([
    collect("marketplace", () => fetchMarketplace(supabase, workspaceId)),
    collect("booking", () => fetchBookings(supabase, workspaceId)),
    collect("supplier", () => fetchSupplier(supabase, workspaceId)),
    collect("payout", () => fetchPayouts(supabase, workspaceId)),
    collect("dispute", () => fetchDisputes(supabase, workspaceId)),
    collect("kyc", () => fetchKyc(supabase, workspaceId)),
    collect("risk", () => fetchRisk(supabase, workspaceId)),
    collect("audit", () => fetchAudit(supabase, workspaceId)),
  ])

  all.sort((a, b) => (a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0))

  return {
    ready: available.length > 0,
    items: all.slice(0, limit),
    availableModules: available,
  }
}

// ── per-module fetchers — each returns null when the table is absent ──────────

function gbp(pence: unknown): string {
  const n = Number(pence ?? 0)
  return `£${(n / 100).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

async function fetchMarketplace(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<ActivityItem[] | null> {
  const { data, error } = await supabase
    .from("marketplace_transactions")
    .select(
      "id, buyer_workspace_id, seller_workspace_id, transaction_type, gross_pence, status, currency, created_at"
    )
    .or(`buyer_workspace_id.eq.${workspaceId},seller_workspace_id.eq.${workspaceId}`)
    .order("created_at", { ascending: false })
    .limit(PER_MODULE_CAP)
  if (error) return isMissing(error) ? null : []
  return ((data as Record<string, unknown>[]) ?? []).map((r) => {
    const isBuyer = r.buyer_workspace_id === workspaceId
    const sev: ActivitySeverity =
      r.status === "completed" || r.status === "paid"
        ? "success"
        : r.status === "failed" || r.status === "cancelled"
          ? "warning"
          : "info"
    return {
      id: `marketplace:${r.id}`,
      module: "marketplace" as const,
      type: `transaction.${(r.status as string) ?? "created"}`,
      title: `${isBuyer ? "Purchase" : "Sale"} ${gbp(r.gross_pence)} — ${(r.status as string) ?? "created"}`,
      detail: (r.transaction_type as string) ?? null,
      timestamp: r.created_at as string,
      refType: "marketplace_transaction",
      refId: r.id as string,
      severity: sev,
    }
  })
}

async function fetchBookings(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<ActivityItem[] | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, workspace_id, customer_workspace_id, guest_name, total_pence, status, check_in, created_at, updated_at"
    )
    .or(`workspace_id.eq.${workspaceId},customer_workspace_id.eq.${workspaceId}`)
    .order("created_at", { ascending: false })
    .limit(PER_MODULE_CAP)
  if (error) return isMissing(error) ? null : []
  return ((data as Record<string, unknown>[]) ?? []).map((r) => {
    const sev: ActivitySeverity =
      r.status === "confirmed" || r.status === "completed" || r.status === "checked_out"
        ? "success"
        : r.status === "cancelled"
          ? "warning"
          : "info"
    return {
      id: `booking:${r.id}`,
      module: "booking" as const,
      type: `booking.${(r.status as string) ?? "created"}`,
      title: `Booking ${(r.status as string) ?? "created"} — ${gbp(r.total_pence)}`,
      detail: (r.guest_name as string) ?? null,
      timestamp: (r.created_at as string) ?? (r.updated_at as string),
      refType: "booking",
      refId: r.id as string,
      severity: sev,
    }
  })
}

async function fetchSupplier(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<ActivityItem[] | null> {
  const items: ActivityItem[] = []
  let anyTable = false

  const quotes = await supabase
    .from("supplier_quotes")
    .select("id, amount, status, submitted_at, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(PER_MODULE_CAP)
  if (!quotes.error) {
    anyTable = true
    for (const r of (quotes.data as Record<string, unknown>[]) ?? []) {
      items.push({
        id: `supplier-quote:${r.id}`,
        module: "supplier",
        type: `quote.${(r.status as string) ?? "draft"}`,
        title: `Supplier quote ${(r.status as string) ?? "draft"}`,
        detail: r.amount != null ? `£${Number(r.amount).toLocaleString("en-GB")}` : null,
        timestamp: ((r.submitted_at as string) ?? (r.created_at as string)) as string,
        refType: "supplier_quote",
        refId: r.id as string,
        severity: r.status === "accepted" ? "success" : r.status === "rejected" ? "warning" : "info",
      })
    }
  } else if (!isMissing(quotes.error)) {
    anyTable = true
  }

  const jobs = await supabase
    .from("supplier_jobs")
    .select("id, title, status, completed_at, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(PER_MODULE_CAP)
  if (!jobs.error) {
    anyTable = true
    for (const r of (jobs.data as Record<string, unknown>[]) ?? []) {
      items.push({
        id: `supplier-job:${r.id}`,
        module: "supplier",
        type: `job.${(r.status as string) ?? "open"}`,
        title: `Supplier job — ${(r.title as string) ?? "untitled"} (${(r.status as string) ?? "open"})`,
        detail: null,
        timestamp: ((r.completed_at as string) ??
          (r.created_at as string) ??
          (r.updated_at as string)) as string,
        refType: "supplier_job",
        refId: r.id as string,
        severity: r.status === "completed" ? "success" : "info",
      })
    }
  } else if (!isMissing(jobs.error)) {
    anyTable = true
  }

  return anyTable ? items : null
}

async function fetchPayouts(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<ActivityItem[] | null> {
  const { data, error } = await supabase
    .from("payouts")
    .select("id, amount_pence, currency, status, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(PER_MODULE_CAP)
  if (error) return isMissing(error) ? null : []
  return ((data as Record<string, unknown>[]) ?? []).map((r) => ({
    id: `payout:${r.id}`,
    module: "payout" as const,
    type: `payout.${(r.status as string) ?? "pending"}`,
    title: `Payout ${gbp(r.amount_pence)} — ${(r.status as string) ?? "pending"}`,
    detail: null,
    timestamp: ((r.created_at as string) ?? (r.updated_at as string)) as string,
    refType: "payout",
    refId: r.id as string,
    severity:
      r.status === "paid" || r.status === "succeeded"
        ? "success"
        : r.status === "failed"
          ? "critical"
          : "info",
  }))
}

async function fetchDisputes(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<ActivityItem[] | null> {
  const { data, error } = await supabase
    .from("marketplace_disputes")
    .select(
      "id, raised_by_workspace_id, against_workspace_id, reason, status, created_at, updated_at, resolved_at"
    )
    .or(`raised_by_workspace_id.eq.${workspaceId},against_workspace_id.eq.${workspaceId}`)
    .order("created_at", { ascending: false })
    .limit(PER_MODULE_CAP)
  if (error) return isMissing(error) ? null : []
  return ((data as Record<string, unknown>[]) ?? []).map((r) => {
    const against = r.against_workspace_id === workspaceId
    const sev: ActivitySeverity =
      r.status === "resolved"
        ? "success"
        : against
          ? "critical"
          : "warning"
    return {
      id: `dispute:${r.id}`,
      module: "dispute" as const,
      type: `dispute.${(r.status as string) ?? "open"}`,
      title: `Dispute ${against ? "raised against you" : "you raised"} — ${(r.status as string) ?? "open"}`,
      detail: (r.reason as string) ?? null,
      timestamp: ((r.created_at as string) ?? (r.updated_at as string)) as string,
      refType: "marketplace_dispute",
      refId: r.id as string,
      severity: sev,
    }
  })
}

async function fetchKyc(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<ActivityItem[] | null> {
  const { data, error } = await supabase
    .from("identity_verifications")
    .select("id, kind, status, risk_level, verified_at, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(PER_MODULE_CAP)
  if (error) return isMissing(error) ? null : []
  return ((data as Record<string, unknown>[]) ?? []).map((r) => {
    const sev: ActivitySeverity =
      r.status === "verified" || r.status === "passed" || r.status === "approved"
        ? "success"
        : r.status === "failed" || r.status === "rejected"
          ? "critical"
          : "info"
    return {
      id: `kyc:${r.id}`,
      module: "kyc" as const,
      type: `identity.${(r.status as string) ?? "pending"}`,
      title: `Identity check ${(r.status as string) ?? "pending"}${r.kind ? ` (${r.kind as string})` : ""}`,
      detail: r.risk_level ? `Risk: ${r.risk_level as string}` : null,
      timestamp: ((r.verified_at as string) ??
        (r.created_at as string) ??
        (r.updated_at as string)) as string,
      refType: "identity_verification",
      refId: r.id as string,
      severity: sev,
    }
  })
}

async function fetchRisk(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<ActivityItem[] | null> {
  const { data, error } = await supabase
    .from("risk_events")
    .select("id, event_type, severity, source, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(PER_MODULE_CAP)
  if (error) return isMissing(error) ? null : []
  return ((data as Record<string, unknown>[]) ?? []).map((r) => {
    const s = r.severity as string
    const sev: ActivitySeverity =
      s === "critical" ? "critical" : s === "high" ? "critical" : s === "medium" ? "warning" : "info"
    return {
      id: `risk:${r.id}`,
      module: "risk" as const,
      type: `risk.${(r.event_type as string) ?? "signal"}`,
      title: `Risk signal — ${(r.event_type as string) ?? "signal"} (${s ?? "low"})`,
      detail: (r.source as string) ?? null,
      timestamp: r.created_at as string,
      refType: "risk_event",
      refId: r.id as string,
      severity: sev,
    }
  })
}

async function fetchAudit(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<ActivityItem[] | null> {
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, action, target_kind, target_id, summary, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(PER_MODULE_CAP)
  if (error) return isMissing(error) ? null : []
  return ((data as Record<string, unknown>[]) ?? []).map((r) => ({
    id: `audit:${r.id}`,
    module: "audit" as const,
    type: `audit.${(r.action as string) ?? "event"}`,
    title: (r.summary as string) ?? (r.action as string) ?? "Audit event",
    detail: (r.target_kind as string) ?? null,
    timestamp: r.created_at as string,
    refType: (r.target_kind as string) ?? "audit_log",
    refId: ((r.target_id as string) ?? (r.id as string)) as string,
    severity: "info" as const,
  }))
}
