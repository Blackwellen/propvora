/**
 * Tamper-aware audit logging — single best-effort helper.
 *
 * Writes a row to the live `audit_logs` table via a caller-provided Supabase
 * client (works with either the service-role admin client or a cookie-scoped
 * user client). Audit writes are ALWAYS best-effort: they are wrapped in
 * try/catch and NEVER throw, so an audit failure can never block or roll back
 * the underlying user action.
 *
 * PII/secret hygiene: keep `metadata` minimal. NEVER pass passwords, tokens,
 * magic links, secrets, or full request/response payloads — only small,
 * non-sensitive identifiers and counts (e.g. file key, size, type).
 *
 * Schema (live `audit_logs`): id, workspace_id, user_id, action,
 * resource_type, resource_id, metadata (jsonb), ip, created_at, old_data,
 * new_data, ip_address.
 */

/**
 * Minimal structural client so this works with admin or server clients.
 * `insert` returns a Supabase PostgrestBuilder, which is a thenable (awaitable)
 * but not a native Promise — so it is typed as a then-able PromiseLike.
 */
interface AuditCapableClient {
  from(table: string): {
    insert(
      values: Record<string, unknown>
    ): PromiseLike<{ error: { message?: string } | null }>
  }
}

export interface AuditEntry {
  /** Workspace the action relates to (if resolvable). */
  workspaceId?: string | null
  /** Acting user id (if known). */
  userId?: string | null
  /** Dot-namespaced action, e.g. "file.uploaded". Use AUDIT_ACTIONS. */
  action: string
  /** Target resource type, e.g. "file" | "workspace_invitation". */
  resourceType?: string | null
  /** Target resource id (uuid or external id). */
  resourceId?: string | null
  /** Small, non-sensitive metadata only. */
  metadata?: Record<string, unknown> | null
  /** Originating IP, if available. */
  ip?: string | null
}

/**
 * Canonical action names. Dot-namespaced: "<domain>.<event>".
 * Adding here keeps call sites consistent and greppable.
 */
export const AUDIT_ACTIONS = {
  ACCOUNT_DELETION_REQUESTED: "account.deletion_requested",
  ACCOUNT_EXPORT_REQUESTED: "account.export_requested",
  PORTAL_GRANT_CREATED: "portal.grant_created",
  FILE_UPLOADED: "file.uploaded",
  INVITE_CREATED: "invite.created",
  INVITE_ACCEPTED: "invite.accepted",
  BILLING_SUBSCRIPTION_UPDATED: "billing.subscription_updated",
  BILLING_PAYMENT_FAILED: "billing.payment_failed",
  BILLING_DISPUTE_CREATED: "billing.dispute_created",
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

/**
 * Record an audit entry. Best-effort — never throws. Returns nothing; callers
 * should NOT await this in a way that affects control flow (failures are
 * logged server-side only).
 */
export async function recordAudit(
  supabase: AuditCapableClient,
  entry: AuditEntry
): Promise<void> {
  try {
    const { error } = await supabase.from("audit_logs").insert({
      workspace_id: entry.workspaceId ?? null,
      user_id: entry.userId ?? null,
      action: entry.action,
      resource_type: entry.resourceType ?? null,
      resource_id: entry.resourceId ?? null,
      metadata: entry.metadata ?? null,
      ip: entry.ip ?? null,
      ip_address: entry.ip ?? null,
    })
    if (error) {
      console.error("[audit] insert failed:", error.message ?? error)
    }
  } catch (err) {
    // Swallow everything: audit must never break the action it records.
    console.error("[audit] unexpected error:", err)
  }
}
