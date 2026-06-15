import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isExternalPortalEnabled } from "@/lib/portal/flags"
import { resolveShareToken, can } from "@/lib/portal/share"
import { loadShareDocuments } from "@/lib/portal/share-data"
import { recordShareAudit, SHARE_AUDIT_ACTIONS } from "@/lib/portal/share-audit"
import { generateDownloadUrl } from "@/lib/r2"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/portal/share/file?token=<raw>&id=<documentId>
//
// Token-scoped signed-URL gateway. The download is authorised ONLY if:
//   1. the token resolves to a live, unexpired, unrevoked grant
//   2. the grant carries the 'download' capability
//   3. the requested document id is INSIDE the grant's scope (resolved via the
//      scoped data loader, which filters by workspace + id allow-list)
//   4. the document's r2_key is prefixed with the grant's workspace id
// Any failure fails closed. We mint a short-lived presigned GET URL and return
// it as JSON (the client redirects), so we never expose the bucket.
export async function GET(req: NextRequest) {
  if (!isExternalPortalEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const url = new URL(req.url)
  const token = url.searchParams.get("token") ?? ""
  const docId = url.searchParams.get("id") ?? ""
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null

  if (!token || !docId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
  }

  const outcome = await resolveShareToken(token)
  if (!outcome.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const grant = outcome.grant

  if (!can(grant, "download")) {
    await recordShareAudit({
      workspaceId: grant.workspaceId,
      action: SHARE_AUDIT_ACTIONS.DENIED,
      shareLinkId: grant.id,
      resourceId: docId,
      metadata: { reason: "no_download_capability" },
      ip,
    })
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Scope check: the document must be within the grant's resource allow-list.
  const docs = await loadShareDocuments(grant)
  const doc = docs.find((d) => d.id === docId)
  if (!doc || !doc.r2Key) {
    await recordShareAudit({
      workspaceId: grant.workspaceId,
      action: SHARE_AUDIT_ACTIONS.DENIED,
      shareLinkId: grant.id,
      resourceId: docId,
      metadata: { reason: "out_of_scope" },
      ip,
    })
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Defence in depth: the key must be prefixed with the grant's workspace id.
  const key = doc.r2Key
  if (key.includes("..") || key.startsWith("/") || key.split("/")[0] !== grant.workspaceId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let signed = ""
  try {
    signed = await generateDownloadUrl(key, 5 * 60)
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 })
  }
  if (!signed) return NextResponse.json({ error: "Storage not configured" }, { status: 503 })

  await recordShareAudit({
    workspaceId: grant.workspaceId,
    action: SHARE_AUDIT_ACTIONS.DOWNLOADED,
    shareLinkId: grant.id,
    resourceType: "document",
    resourceId: docId,
    metadata: { name: doc.name },
    ip,
  })

  return NextResponse.json({ url: signed })
}
