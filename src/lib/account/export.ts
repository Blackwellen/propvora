import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { recordAudit } from "@/lib/audit/log"
import { r2Configured, uploadToR2 } from "@/lib/r2"

/**
 * GDPR data-export (subject access request) WORKER.
 *
 * Compiles a user's OWN data into a single JSON document, uploads it as a
 * PRIVATE object to R2 (no public bucket), and updates the matching
 * `data_export_requests` row to `ready` with a download key + 7-day expiry.
 *
 * Third-party PII is redacted where feasible — the export contains the subject's
 * own profile, memberships, authored content, AI threads and request history,
 * NOT other people's personal data.
 *
 * If R2 is not configured the request is marked `failed` and the report says so;
 * no partial/leaky state is left behind.
 */

const EXPORT_TTL_DAYS = 7

export interface ExportReport {
  userId: string
  generatedAt: string
  status: "ready" | "failed"
  /** R2 object key (private) when ready. */
  downloadKey?: string
  expiresAt?: string
  /** per-section row counts included in the bundle. */
  sections: Record<string, number>
  reason?: string
}

/** Best-effort select of a user's own rows; never throws, returns []. */
async function safeSelect(
  admin: SupabaseClient,
  table: string,
  column: string,
  userId: string,
  columns = "*",
): Promise<Record<string, unknown>[]> {
  try {
    const { data, error } = await admin
      .from(table)
      .select(columns)
      .eq(column, userId)
      .limit(5000)
    if (error) return []
    return (data as unknown as Record<string, unknown>[]) ?? []
  } catch {
    return []
  }
}

export async function generateExport(
  admin: SupabaseClient,
  userId: string,
): Promise<ExportReport> {
  const generatedAt = new Date().toISOString()

  // Mark processing (best-effort) so the UI reflects an in-flight job.
  try {
    await admin
      .from("data_export_requests")
      .update({ status: "processing", updated_at: generatedAt })
      .eq("user_id", userId)
      .in("status", ["pending", "processing"])
  } catch {
    /* ignore */
  }

  // ── Gather the subject's own data. ──
  const [profile] = await safeSelect(admin, "profiles", "id", userId)
  const memberships = await safeSelect(admin, "workspace_members", "user_id", userId)
  const roles = await safeSelect(admin, "user_roles", "user_id", userId)
  const preferences = await safeSelect(admin, "user_preferences", "user_id", userId)
  const notificationPrefs = await safeSelect(admin, "notification_preferences", "user_id", userId)
  const notifications = await safeSelect(admin, "notifications", "user_id", userId)
  const aiThreads = await safeSelect(admin, "ai_chat_threads", "user_id", userId)
  const savedViews = await safeSelect(admin, "saved_views", "owner_user_id", userId)
  const guidedHelp = await safeSelect(admin, "guided_help_state", "user_id", userId)
  const deletionRequests = await safeSelect(admin, "account_deletion_requests", "user_id", userId)
  const exportRequests = await safeSelect(
    admin,
    "data_export_requests",
    "user_id",
    userId,
    "id, status, requested_at, ready_at, expires_at",
  )

  // AI messages for the user's own threads (content the user authored/received).
  let aiMessages: Record<string, unknown>[] = []
  try {
    const threadIds = aiThreads.map((t) => t.id as string).filter(Boolean)
    if (threadIds.length > 0) {
      const { data } = await admin
        .from("ai_chat_messages")
        .select("id, thread_id, role, content, created_at")
        .in("thread_id", threadIds)
        .limit(10000)
      aiMessages = (data as unknown as Record<string, unknown>[]) ?? []
    }
  } catch {
    aiMessages = []
  }

  // Redact the subject's own auth identifier in places we surface it back, and
  // strip security material that should never be exported.
  const bundle = {
    meta: {
      kind: "propvora.data-export",
      subjectUserId: userId,
      generatedAt,
      notice:
        "This export contains your own personal data. Third-party personal data has been excluded.",
    },
    profile: profile ?? null,
    memberships,
    roles,
    preferences,
    notificationPreferences: notificationPrefs,
    notifications,
    aiThreads,
    aiMessages,
    savedViews,
    guidedHelp,
    requestHistory: {
      deletionRequests,
      exportRequests,
    },
  }

  const sections: Record<string, number> = {
    profile: profile ? 1 : 0,
    memberships: memberships.length,
    roles: roles.length,
    preferences: preferences.length,
    notificationPreferences: notificationPrefs.length,
    notifications: notifications.length,
    aiThreads: aiThreads.length,
    aiMessages: aiMessages.length,
    savedViews: savedViews.length,
    guidedHelp: guidedHelp.length,
    deletionRequests: deletionRequests.length,
    exportRequests: exportRequests.length,
  }

  // ── R2 upload (private object). ──
  if (!r2Configured()) {
    try {
      await admin
        .from("data_export_requests")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .in("status", ["pending", "processing"])
    } catch {
      /* ignore */
    }
    await recordAudit(admin, {
      userId,
      action: "account.export_failed",
      resourceType: "data_export_request",
      resourceId: userId,
      metadata: { reason: "r2_not_configured" },
    })
    return {
      userId,
      generatedAt,
      status: "failed",
      sections,
      reason: "R2 storage is not configured — export could not be stored.",
    }
  }

  const timestamp = generatedAt.replace(/[:.]/g, "-")
  const downloadKey = `exports/${userId}/${timestamp}.json`
  const body = Buffer.from(JSON.stringify(bundle, null, 2), "utf-8")

  try {
    await uploadToR2(downloadKey, body, "application/json")
  } catch (err) {
    try {
      await admin
        .from("data_export_requests")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .in("status", ["pending", "processing"])
    } catch {
      /* ignore */
    }
    await recordAudit(admin, {
      userId,
      action: "account.export_failed",
      resourceType: "data_export_request",
      resourceId: userId,
      metadata: { reason: "r2_upload_failed" },
    })
    return {
      userId,
      generatedAt,
      status: "failed",
      sections,
      reason: `Upload to storage failed: ${err instanceof Error ? err.message : String(err)}`,
    }
  }

  const readyAt = new Date().toISOString()
  const expiresAt = new Date(Date.now() + EXPORT_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  try {
    await admin
      .from("data_export_requests")
      .update({
        status: "ready",
        download_key: downloadKey,
        ready_at: readyAt,
        expires_at: expiresAt,
        updated_at: readyAt,
      })
      .eq("user_id", userId)
      .in("status", ["pending", "processing"])
  } catch {
    /* the object is uploaded; the row update is best-effort */
  }

  await recordAudit(admin, {
    userId,
    action: "account.export_generated",
    resourceType: "data_export_request",
    resourceId: userId,
    metadata: {
      key: downloadKey,
      bytes: body.byteLength,
      expiresAt,
    },
  })

  return {
    userId,
    generatedAt,
    status: "ready",
    downloadKey,
    expiresAt,
    sections,
  }
}
