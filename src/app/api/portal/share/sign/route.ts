import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isExternalPortalEnabled } from "@/lib/portal/flags"
import { resolveShareToken, can } from "@/lib/portal/share"
import { recordShareAudit, SHARE_AUDIT_ACTIONS } from "@/lib/portal/share-audit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/portal/share/sign  { token }
//
// Records a recipient acknowledgement / e-sign event for a share grant that
// carries the 'sign' capability. The acknowledgement is captured as a
// timestamped, IP-stamped audit entry (the legal record). Fails closed if the
// token is invalid or lacks the capability.
export async function POST(req: NextRequest) {
  if (!isExternalPortalEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null

  let token = ""
  try {
    const body = (await req.json()) as { token?: string }
    token = typeof body.token === "string" ? body.token : ""
  } catch {
    token = ""
  }
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 })

  const outcome = await resolveShareToken(token)
  if (!outcome.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const grant = outcome.grant

  if (!can(grant, "sign")) {
    await recordShareAudit({
      workspaceId: grant.workspaceId,
      action: SHARE_AUDIT_ACTIONS.DENIED,
      shareLinkId: grant.id,
      metadata: { reason: "no_sign_capability" },
      ip,
    })
    return NextResponse.json({ error: "This link does not allow signing." }, { status: 403 })
  }

  await recordShareAudit({
    workspaceId: grant.workspaceId,
    action: SHARE_AUDIT_ACTIONS.ACKNOWLEDGED,
    shareLinkId: grant.id,
    resourceType: grant.resourceType,
    resourceId: grant.resourceIds[0] ?? grant.id,
    metadata: {
      recipient_label: grant.recipientLabel,
      acknowledged_at: new Date().toISOString(),
    },
    ip,
  })

  return NextResponse.json({ ok: true })
}
