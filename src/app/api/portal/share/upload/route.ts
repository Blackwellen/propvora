import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isExternalPortalEnabled } from "@/lib/portal/flags"
import { resolveShareToken, can } from "@/lib/portal/share"
import { recordShareAudit, SHARE_AUDIT_ACTIONS } from "@/lib/portal/share-audit"
import { createAdminClient } from "@/lib/supabase/admin"
import { buildKey, uploadToR2, r2Configured } from "@/lib/r2"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/portal/share/upload  (multipart: token, file)
//
// Recipient secure upload. Goes through the SAME validated R2 path as the app:
// extension + MIME + size validated, key namespaced under the grant's
// workspace id ("{workspaceId}/portal-uploads/{uuid}.{ext}"). Authorised only
// if the token resolves to a live grant carrying the 'upload' capability.
// Every upload is recorded in portal_share_uploads + audit_logs.

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "image/heic", "image/heif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv", "text/plain",
])
const MAX_BYTES = 10_485_760 // 10 MB

export async function POST(req: NextRequest) {
  if (!isExternalPortalEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (!r2Configured()) {
    return NextResponse.json({ error: "File storage is not configured." }, { status: 503 })
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 })

  const token = String(form.get("token") ?? "")
  const file = form.get("file")
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 })
  if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 })

  const outcome = await resolveShareToken(token)
  if (!outcome.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const grant = outcome.grant

  if (!can(grant, "upload")) {
    await recordShareAudit({
      workspaceId: grant.workspaceId,
      action: SHARE_AUDIT_ACTIONS.DENIED,
      shareLinkId: grant.id,
      metadata: { reason: "no_upload_capability" },
      ip,
    })
    return NextResponse.json({ error: "This link does not allow uploads." }, { status: 403 })
  }

  // Validate size + MIME.
  if (file.size <= 0) return NextResponse.json({ error: "Empty file" }, { status: 400 })
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 10 MB." }, { status: 413 })
  }
  const mimeBase = (file.type || "application/octet-stream").split(";")[0].trim()
  const isAllowed =
    ALLOWED_CONTENT_TYPES.has(mimeBase) ||
    mimeBase.startsWith("application/vnd.openxmlformats-officedocument.")
  if (!isAllowed) {
    return NextResponse.json({ error: `File type "${mimeBase}" is not allowed.` }, { status: 415 })
  }

  // Key namespaced under the grant's workspace (binds the object to the tenant).
  let key: string
  try {
    key = buildKey(grant.workspaceId, "portal-uploads", file.name)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid filename" },
      { status: 400 }
    )
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    await uploadToR2(key, bytes, mimeBase)
  } catch (err) {
    console.error("[portal/share/upload]", err)
    return NextResponse.json({ error: "Upload failed." }, { status: 500 })
  }

  // Record the upload row (service-role; the grant is the authorisation).
  interface UploadRow { id: string; file_name: string | null; size_bytes: number | null; uploaded_at: string }
  const admin = createAdminClient()
  let uploadRow: UploadRow | null = null
  try {
    const { data } = await admin
      .from("portal_share_uploads")
      .insert({
        share_link_id: grant.id,
        workspace_id: grant.workspaceId,
        storage_key: key,
        file_name: file.name,
        content_type: mimeBase,
        size_bytes: file.size,
      })
      .select("id, file_name, size_bytes, uploaded_at")
      .single()
    uploadRow = (data as unknown as UploadRow) ?? null
    // Bump the share link's upload counter (best-effort).
    const { data: linkRow } = await admin
      .from("portal_share_links")
      .select("upload_count")
      .eq("id", grant.id)
      .maybeSingle()
    await admin
      .from("portal_share_links")
      .update({ upload_count: Number((linkRow as { upload_count?: number } | null)?.upload_count ?? 0) + 1 })
      .eq("id", grant.id)
  } catch {
    /* tolerate — file is already stored */
  }

  await recordShareAudit({
    workspaceId: grant.workspaceId,
    action: SHARE_AUDIT_ACTIONS.UPLOADED,
    shareLinkId: grant.id,
    resourceType: "portal_share_upload",
    resourceId: uploadRow?.id ?? null,
    metadata: { name: file.name, size: file.size, type: mimeBase, key },
    ip,
  })

  return NextResponse.json({
    ok: true,
    upload: {
      id: uploadRow?.id ?? key,
      fileName: file.name,
      sizeBytes: file.size,
      uploadedAt: uploadRow?.uploaded_at ?? new Date().toISOString(),
    },
  })
}
