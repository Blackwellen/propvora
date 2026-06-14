import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { previewErasure, executeErasure } from "@/lib/account/erasure"
import { generateExport } from "@/lib/account/export"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/admin/account-process — platform-admin gated GDPR worker driver.
 *
 * Body: { action, requestId, confirm? }
 *   action: 'preview-deletion' | 'execute-deletion' | 'generate-export'
 *
 * SAFETY:
 *   • 'preview-deletion' is always a dry run (no writes).
 *   • 'execute-deletion' performs destructive writes ONLY when
 *     ACCOUNT_ERASURE_ENABLED === 'true' AND confirm === true; otherwise it
 *     returns the dry-run report with executed:false.
 *   • All gating lives in the lib functions; this route just authorises the
 *     caller and routes to the right worker.
 */
export async function POST(req: Request) {
  // ── Auth (mirror /api/ready exactly): session user → platform admin. ──
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .maybeSingle()
  if (!profile || profile.platform_role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // ── Parse body. ──
  let body: { action?: string; requestId?: string; confirm?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const { action, requestId } = body
  const confirm = body.confirm === true

  if (!action || !requestId) {
    return NextResponse.json({ error: "Missing action or requestId" }, { status: 400 })
  }

  // ── Load the request row to resolve the subject user. ──
  const isDeletion = action === "preview-deletion" || action === "execute-deletion"
  const table = isDeletion ? "account_deletion_requests" : "data_export_requests"

  const { data: requestRow, error: loadError } = await admin
    .from(table)
    .select("id, user_id, status")
    .eq("id", requestId)
    .maybeSingle()

  if (loadError) {
    return NextResponse.json({ error: "Could not load request" }, { status: 500 })
  }
  if (!requestRow) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 })
  }

  const userId = requestRow.user_id as string

  // ── Route to the worker. ──
  try {
    if (action === "preview-deletion") {
      const report = await previewErasure(admin, userId)
      return NextResponse.json({ ok: true, action, report }, { headers: { "Cache-Control": "no-store" } })
    }

    if (action === "execute-deletion") {
      const report = await executeErasure(admin, userId, { confirm })
      return NextResponse.json({ ok: true, action, report }, { headers: { "Cache-Control": "no-store" } })
    }

    if (action === "generate-export") {
      const report = await generateExport(admin, userId)
      return NextResponse.json({ ok: true, action, report }, { headers: { "Cache-Control": "no-store" } })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Worker failed" },
      { status: 500 },
    )
  }
}
