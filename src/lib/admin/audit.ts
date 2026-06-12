import "server-only"
import { headers } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"

interface AuditInput {
  /** Acting admin's user id. */
  actorId: string
  /** Dot-namespaced action, e.g. "workspace.suspended". */
  action: string
  /** Target resource type, e.g. "workspace" | "user". */
  resourceType?: string
  /** Target resource id (uuid). */
  resourceId?: string
  /** Workspace the action relates to (if any). */
  workspaceId?: string | null
  /** Prior state snapshot. */
  before?: Record<string, unknown> | null
  /** New state snapshot. */
  after?: Record<string, unknown> | null
}

/**
 * Write a platform-admin action to `audit_logs`.
 *
 * Writes via the service-role client (append-only, RLS-bypassing). Matches the
 * canonical `audit_logs` shape (old_data/new_data/ip_address). Never throws —
 * an audit-write failure must not block or roll back the underlying action's
 * UX, but is logged server-side. 42P01-safe.
 */
export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    let ip: string | null = null
    try {
      const h = await headers()
      ip =
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        h.get("x-real-ip") ??
        null
    } catch {
      ip = null
    }

    const admin = createAdminClient()
    const { error } = await admin.from("audit_logs").insert({
      workspace_id: input.workspaceId ?? null,
      user_id: input.actorId,
      action: input.action,
      resource_type: input.resourceType ?? null,
      resource_id: input.resourceId ?? null,
      old_data: input.before ?? null,
      new_data: input.after ?? null,
      ip_address: ip,
    })
    if (error) {
      console.error("[audit] insert failed:", error.message)
    }
  } catch (err) {
    console.error("[audit] unexpected error:", err)
  }
}
