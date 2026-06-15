import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

// ============================================================================
// Audit for the /p/[token] recipient surface. Every recipient access (token
// used, resource viewed, file downloaded, file uploaded) lands in audit_logs.
// NEVER log the raw token or any secret — only the share-link id + resource id.
// Best-effort: never throws, never blocks the recipient action.
// ============================================================================

export const SHARE_AUDIT_ACTIONS = {
  MINTED: "portal_share.minted",
  REVOKED: "portal_share.revoked",
  ACCESSED: "portal_share.accessed",
  VIEWED: "portal_share.resource_viewed",
  DOWNLOADED: "portal_share.file_downloaded",
  UPLOADED: "portal_share.file_uploaded",
  ACKNOWLEDGED: "portal_share.acknowledged",
  DENIED: "portal_share.access_denied",
} as const

export type ShareAuditAction =
  (typeof SHARE_AUDIT_ACTIONS)[keyof typeof SHARE_AUDIT_ACTIONS]

export async function recordShareAudit(entry: {
  workspaceId: string | null
  action: ShareAuditAction
  shareLinkId: string | null
  resourceType?: string | null
  resourceId?: string | null
  metadata?: Record<string, unknown> | null
  ip?: string | null
}): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from("audit_logs").insert({
      workspace_id: entry.workspaceId,
      user_id: null, // recipients have no Supabase user
      action: entry.action,
      resource_type: entry.resourceType ?? "portal_share_link",
      resource_id: entry.resourceId ?? entry.shareLinkId,
      metadata: {
        share_link_id: entry.shareLinkId,
        ...(entry.metadata ?? {}),
      },
      ip: entry.ip ?? null,
      ip_address: entry.ip ?? null,
    })
  } catch (err) {
    console.error("[share-audit] insert failed:", err)
  }
}
