import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { recordAudit } from "@/lib/audit/log"

/**
 * GDPR right-to-erasure WORKER (DESTRUCTIVE — handled with extreme care).
 *
 * SAFETY MODEL
 * ─────────────
 * 1. `previewErasure` is ALWAYS a dry run: it only COUNTS what would be
 *    deleted/anonymised vs what is RETAINED. It performs NO writes.
 * 2. `executeErasure` performs writes ONLY when BOTH of these hold:
 *      • process.env.ACCOUNT_ERASURE_ENABLED === 'true'  (env kill-switch), AND
 *      • opts.confirm === true                            (explicit per-call confirm)
 *    Otherwise it returns the preview with `executed: false` and a reason.
 * 3. Every step (preview and execute) is audited.
 * 4. Each destructive step is wrapped so one failure can't cascade; results are
 *    collected into a log. When unsure about a table we RETAIN + report rather
 *    than delete.
 * 5. The auth identity (admin.auth.admin.deleteUser) is removed LAST and only
 *    when truly executing.
 *
 * RETENTION SCHEDULE (NEVER erased by this worker — legally required):
 *   • Financial records: invoices, invoice_lines, bills, bill_lines, payments,
 *     money_transactions, transactions, expense_records, stripe_*, escrow_*,
 *     workspace_billing/subscriptions — kept for tax/accounting obligations.
 *   • Audit / security logs: audit_logs, audit_log, *_audit_log, security and
 *     access logs — kept as the tamper-evident record (incl. of this erasure).
 *   • The account_deletion_requests row itself is RETAINED (marked completed) as
 *     proof the request was honoured.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface ErasureLineItem {
  table: string
  /** rows that match this user (best-effort count). */
  count: number
  /** "delete" = hard delete; "anonymise" = strip PII in place. */
  action: "delete" | "anonymise"
  /** human note for the operator. */
  note?: string
}

export interface RetainedLineItem {
  table: string
  reason: string
}

export interface StepResult {
  table: string
  action: "delete" | "anonymise" | "auth.deleteUser"
  ok: boolean
  affected?: number
  error?: string
}

export interface ErasureReport {
  userId: string
  generatedAt: string
  /** true once destructive writes actually ran. */
  executed: boolean
  /** when not executed, why (gate off / not confirmed / preview only). */
  reason?: string
  /** whether the env kill-switch is on. */
  enabledByEnv: boolean
  /** what WOULD be / WAS erased. */
  toErase: ErasureLineItem[]
  /** what is deliberately kept and why. */
  retained: RetainedLineItem[]
  /** per-step outcomes (only populated on execute). */
  steps: StepResult[]
}

// ── Erasure plan (single source of truth) ────────────────────────────────────
//
// `column` is the user-id column on that table. Tables here are PERSONAL data
// that is safe to remove or anonymise. Anything financial/audit is in
// RETAINED_TABLES below and is NEVER touched.

interface ErasePlanEntry {
  table: string
  column: string
  action: "delete" | "anonymise"
  /** for anonymise: the column→value patch applied in place. */
  anonPatch?: Record<string, unknown>
  note?: string
}

const ERASE_PLAN: ErasePlanEntry[] = [
  // Direct user-owned, non-financial content — hard delete.
  { table: "ai_chat_threads", column: "user_id", action: "delete", note: "AI assistant threads" },
  { table: "notifications", column: "user_id", action: "delete", note: "in-app notifications" },
  { table: "notification_preferences", column: "user_id", action: "delete" },
  { table: "user_preferences", column: "user_id", action: "delete" },
  { table: "user_roles", column: "user_id", action: "delete" },
  { table: "saved_views", column: "owner_user_id", action: "delete", note: "personal saved views" },
  { table: "guided_help_state", column: "user_id", action: "delete" },
  { table: "mfa_recovery_codes", column: "user_id", action: "delete", note: "security factors" },
  // Membership — remove the person from workspaces.
  { table: "workspace_members", column: "user_id", action: "delete", note: "workspace memberships" },
  // Profile — anonymise rather than delete so FK references (created_by, etc.)
  // remain valid while the personal data is scrubbed.
  {
    table: "profiles",
    column: "id",
    action: "anonymise",
    anonPatch: {
      display_name: "Deleted user",
      first_name: null,
      last_name: null,
      phone: null,
      bio: null,
      website: null,
      avatar_url: null,
      avatar_path: null,
      marketing_opt_in: false,
      affiliate_ref: null,
    },
    note: "personal profile fields scrubbed; row kept for FK integrity",
  },
]

/**
 * Tables we DELIBERATELY retain. Surfaced in every report so the decision is
 * explicit and auditable.
 */
const RETAINED_TABLES: RetainedLineItem[] = [
  { table: "invoices / invoice_lines", reason: "Financial record — tax/accounting retention" },
  { table: "bills / bill_lines", reason: "Financial record — tax/accounting retention" },
  { table: "payments / money_transactions / transactions", reason: "Financial record — tax/accounting retention" },
  { table: "expense_records", reason: "Financial record — tax/accounting retention" },
  { table: "stripe_* / workspace_billing / workspace_subscriptions", reason: "Billing record — tax/accounting retention" },
  { table: "escrow_* / deposits / arrears_records", reason: "Financial/legal record — retention" },
  { table: "audit_logs / audit_log / *_audit_log", reason: "Tamper-evident security record (incl. this erasure)" },
  { table: "account_deletion_requests", reason: "Proof the erasure request was honoured (marked completed)" },
  { table: "agreements / agreement_signatures / tenancies", reason: "Legal contract record — retention" },
]

// ── Counting (read-only) ─────────────────────────────────────────────────────

async function countFor(
  admin: SupabaseClient,
  table: string,
  column: string,
  userId: string,
): Promise<number> {
  try {
    const { count, error } = await admin
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(column, userId)
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

async function buildToErase(admin: SupabaseClient, userId: string): Promise<ErasureLineItem[]> {
  const items = await Promise.all(
    ERASE_PLAN.map(async (e) => ({
      table: e.table,
      count: await countFor(admin, e.table, e.column, userId),
      action: e.action,
      note: e.note,
    })),
  )
  return items
}

// ── Preview (NO writes) ──────────────────────────────────────────────────────

export async function previewErasure(
  admin: SupabaseClient,
  userId: string,
): Promise<ErasureReport> {
  const toErase = await buildToErase(admin, userId)

  await recordAudit(admin, {
    userId,
    action: "account.erasure_previewed",
    resourceType: "account_deletion_request",
    resourceId: userId,
    metadata: {
      tables: toErase.length,
      totalRows: toErase.reduce((n, i) => n + i.count, 0),
    },
  })

  return {
    userId,
    generatedAt: new Date().toISOString(),
    executed: false,
    reason: "Preview only — no data was modified.",
    enabledByEnv: process.env.ACCOUNT_ERASURE_ENABLED === "true",
    toErase,
    retained: RETAINED_TABLES,
    steps: [],
  }
}

// ── Execute (GATED, DESTRUCTIVE) ─────────────────────────────────────────────

export async function executeErasure(
  admin: SupabaseClient,
  userId: string,
  opts: { confirm: boolean },
): Promise<ErasureReport> {
  const enabledByEnv = process.env.ACCOUNT_ERASURE_ENABLED === "true"

  // Build the dry-run picture first (and audit the preview).
  const base = await previewErasure(admin, userId)

  // GATE: refuse to write unless BOTH the env kill-switch and confirm are set.
  if (!enabledByEnv || !opts.confirm) {
    const reason = !enabledByEnv
      ? "Execution disabled: ACCOUNT_ERASURE_ENABLED is not 'true'. Dry-run only."
      : "Execution not confirmed: confirm flag was not set. Dry-run only."
    await recordAudit(admin, {
      userId,
      action: "account.erasure_execute_blocked",
      resourceType: "account_deletion_request",
      resourceId: userId,
      metadata: { enabledByEnv, confirm: opts.confirm },
    })
    return { ...base, executed: false, reason }
  }

  // ── Truly executing from here. ──
  const steps: StepResult[] = []

  for (const entry of ERASE_PLAN) {
    // Re-count immediately before acting so the audited number is accurate.
    const affected = await countFor(admin, entry.table, entry.column, userId)
    try {
      if (entry.action === "anonymise" && entry.anonPatch) {
        const { error } = await admin
          .from(entry.table)
          .update(entry.anonPatch)
          .eq(entry.column, userId)
        steps.push({
          table: entry.table,
          action: "anonymise",
          ok: !error,
          affected,
          error: error?.message,
        })
      } else {
        const { error } = await admin
          .from(entry.table)
          .delete()
          .eq(entry.column, userId)
        steps.push({
          table: entry.table,
          action: "delete",
          ok: !error,
          affected,
          error: error?.message,
        })
      }
    } catch (err) {
      // One failure must not cascade — record and continue.
      steps.push({
        table: entry.table,
        action: entry.action,
        ok: false,
        affected,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    await recordAudit(admin, {
      userId,
      action: "account.erasure_step",
      resourceType: entry.table,
      resourceId: userId,
      metadata: { action: entry.action, affected },
    })
  }

  // Auth identity removal — LAST, and only when executing.
  try {
    const { error } = await admin.auth.admin.deleteUser(userId)
    steps.push({
      table: "auth.users",
      action: "auth.deleteUser",
      ok: !error,
      error: error?.message,
    })
  } catch (err) {
    steps.push({
      table: "auth.users",
      action: "auth.deleteUser",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
  }

  // Mark the deletion request completed (RETAINED as proof of honouring it).
  try {
    await admin
      .from("account_deletion_requests")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .in("status", ["pending", "scheduled"])
  } catch {
    /* best-effort — the audit trail still records the erasure */
  }

  await recordAudit(admin, {
    userId,
    action: "account.erasure_executed",
    resourceType: "account_deletion_request",
    resourceId: userId,
    metadata: {
      steps: steps.length,
      failures: steps.filter((s) => !s.ok).length,
    },
  })

  return {
    ...base,
    executed: true,
    reason: undefined,
    steps,
  }
}
