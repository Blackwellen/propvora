import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildKey, uploadToR2, fileViewUrl, r2Configured } from "@/lib/r2"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ─── MIME allowlist ───────────────────────────────────────────────────────────

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
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

    const bytes = new Uint8Array(await file.arrayBuffer())
    await uploadToR2(key, bytes, mimeBase)

    return NextResponse.json({
      key,
      url: fileViewUrl(key),
      name: file.name,
      type: mimeBase,
      size: file.size,
    })
  } catch (err) {
    console.error("[api/upload]", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
