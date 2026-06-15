import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  buildKey,
  uploadToR2,
  fileViewUrl,
  r2Configured,
  sniffContent,
  isExecutable,
  sanitizeSvg,
} from "@/lib/r2"
import { gateStorage } from "@/lib/billing/gates"
import { recordAudit, AUDIT_ACTIONS } from "@/lib/audit/log"
import { captureException, requestIdFrom } from "@/lib/observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ─── MIME allowlist ───────────────────────────────────────────────────────────

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "image/heic", "image/heif", // iPhone photos
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv", "text/plain",
])

const MAX_BYTES = 10_485_760 // 10 MB

/**
 * POST /api/upload — multipart/form-data: { file, workspaceId, folder }
 * Server-proxied upload to R2 (no browser→R2 CORS needed). Returns { key, url }
 * where url is an app-internal authed streaming URL.
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    if (!r2Configured()) {
      return NextResponse.json(
        { error: "File storage is not configured (set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET)." },
        { status: 503 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const form = await request.formData().catch(() => null)
    if (!form) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 })
    }

    const file = form.get("file")
    const workspaceId = String(form.get("workspaceId") ?? "")
    const folder = String(form.get("folder") ?? "files")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 })
    }
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    }

    // Authorise: the caller must be a member of the target workspace.
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!membership) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    // Size + MIME validation.
    if (file.size <= 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `File exceeds ${MAX_BYTES / 1024 / 1024} MB` }, { status: 413 })
    }

    // Plan storage allowance — block uploads that would exceed the workspace quota.
    const storageGate = await gateStorage(supabase, workspaceId, file.size)
    if (!storageGate.allowed) {
      return NextResponse.json(
        { error: storageGate.reason, upgrade: true, tier: storageGate.tier },
        { status: storageGate.status ?? 402 }
      )
    }
    const mimeBase = (file.type || "application/octet-stream").split(";")[0].trim()
    const isAllowed =
      ALLOWED_CONTENT_TYPES.has(mimeBase) ||
      mimeBase.startsWith("application/vnd.openxmlformats-officedocument.")
    if (!isAllowed) {
      return NextResponse.json({ error: `Content type "${mimeBase}" is not allowed` }, { status: 415 })
    }

    let key: string
    try {
      key = buildKey(workspaceId, folder, file.name)
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid filename" },
        { status: 400 }
      )
    }

    let bytes: Uint8Array = new Uint8Array(await file.arrayBuffer())

    // ── Content validation: sniff magic bytes (do NOT trust the client MIME) ──
    // Reject anything that *is* an executable regardless of declared type, then
    // confirm the real bytes match one of our allowed signatures so a file can't
    // claim image/png while carrying disguised content.
    if (isExecutable(bytes)) {
      return NextResponse.json(
        { error: "Executable files are not allowed" },
        { status: 415 }
      )
    }
    const sniff = sniffContent(bytes, mimeBase)
    if (!sniff.ok) {
      return NextResponse.json(
        { error: "File content does not match an allowed type (possible mismatch or disguised file)" },
        { status: 415 }
      )
    }

    // ── Active-SVG neutralisation ─────────────────────────────────────────────
    // SVG is XML and can carry <script>/on*/javascript: — sanitise before store.
    let storeType = mimeBase
    if (sniff.detected === "image/svg+xml") {
      bytes = sanitizeSvg(bytes)
      storeType = "image/svg+xml"
    }

    await uploadToR2(key, Buffer.from(bytes), storeType)

    // Quarantine-ready: every freshly uploaded object starts as scan_status
    // 'pending'. A downstream AV/scan worker can flip this to 'clean'/'infected'
    // and gate downloads. Persisted into the audit trail and returned so the
    // caller can store it on the document metadata row it creates.
    const scanStatus = "pending"

    await recordAudit(supabase, {
      workspaceId,
      userId: user.id,
      action: AUDIT_ACTIONS.FILE_UPLOADED,
      resourceType: "file",
      resourceId: key,
      metadata: {
        key,
        size: file.size,
        type: storeType,
        detected: sniff.detected,
        scan_status: scanStatus,
      },
    })

    return NextResponse.json({
      key,
      url: fileViewUrl(key),
      name: file.name,
      type: storeType,
      size: bytes.byteLength,
      scanStatus,
    })
  } catch (err) {
    captureException(err, { source: "api/upload", requestId })
    return NextResponse.json({ error: "Upload failed", requestId }, { status: 500 })
  }
}
