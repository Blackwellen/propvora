import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isExternalPortalEnabled } from "@/lib/portal/flags"
import { getValidatedPortalSession } from "@/lib/portal/session"
import { generateDownloadUrl } from "@/lib/r2"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/portal/file?key=<storage-key>
//
// Server-side signed-URL gateway for external portal file access. There is NO
// public R2 bucket; every download flows through here so the session scope is
// enforced first:
//   1. valid portal session required (fail-closed 401 otherwise)
//   2. the requested key MUST be prefixed with the session's workspace id —
//      keys are stored as "{workspaceId}/{folder}/{uuid}.{ext}" (see r2.buildKey)
//      so this binds the download to the caller's workspace. A key for another
//      workspace is rejected (403) BEFORE any signed URL is minted.
// On success we 302 to a short-lived presigned GET URL.
export async function GET(req: NextRequest) {
  if (!isExternalPortalEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const session = await getValidatedPortalSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const key = new URL(req.url).searchParams.get("key")
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 })
  }

  // Reject traversal and absolute keys outright.
  if (key.includes("..") || key.startsWith("/")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Scope gate: the key's leading path segment must equal the session's
  // workspace id. This is the authorization boundary for file access.
  const firstSegment = key.split("/")[0]
  if (firstSegment !== session.workspaceId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let url = ""
  try {
    url = await generateDownloadUrl(key)
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 })
  }
  if (!url) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 })
  }

  return NextResponse.redirect(url, { status: 302 })
}
