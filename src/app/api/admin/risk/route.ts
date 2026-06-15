import { NextResponse } from "next/server"
import { getAdminIdentity } from "@/lib/admin/guard"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  listWorkspaceRiskRows,
  getWorkspaceRiskScore,
  getWorkspaceRiskEvents,
} from "@/lib/risk/signals"
import { flagWorkspace, clearWorkspaceFlag } from "@/lib/risk/engine"
import type { RiskBand } from "@/lib/risk/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BANDS: RiskBand[] = ["low", "medium", "high", "critical"]

function clientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]!.trim()
  return req.headers.get("x-real-ip")
}

/**
 * GET /api/admin/risk — platform-admin risk reads.
 *
 *   ?workspaceId=…            → { score, events } for one workspace
 *   ?band=low|medium|high|critical, ?flagged=1, ?limit=…  → ranked rows
 *
 * Cross-tenant BY DESIGN. Fail-closed: a non-admin gets 403 before any read.
 * HONESTY: returns computed signals to assist review, never determinations.
 */
export async function GET(req: Request) {
  const identity = await getAdminIdentity()
  if (!identity) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const supabase = createAdminClient()
  const url = new URL(req.url)
  const workspaceId = url.searchParams.get("workspaceId")

  if (workspaceId) {
    const [score, events] = await Promise.all([
      getWorkspaceRiskScore(supabase, workspaceId),
      getWorkspaceRiskEvents(supabase, workspaceId, 200),
    ])
    return NextResponse.json(
      { ok: true, score: score.data, events: events.data, available: score.available },
      { headers: { "Cache-Control": "no-store" } }
    )
  }

  const bandParam = url.searchParams.get("band")
  const band = bandParam && BANDS.includes(bandParam as RiskBand) ? (bandParam as RiskBand) : null
  const flaggedOnly = url.searchParams.get("flagged") === "1"
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 200) || 200, 500)

  const rows = await listWorkspaceRiskRows(supabase, { band, flaggedOnly, limit })
  return NextResponse.json(
    { ok: true, rows: rows.data, available: rows.available },
    { headers: { "Cache-Control": "no-store" } }
  )
}

/**
 * POST /api/admin/risk — manual flag / clear.
 *
 * Body: { action: 'flag' | 'clear', workspaceId, reason }
 *
 * Each action records a manual_flag / manual_clear risk_event, recomputes the
 * workspace score, and writes an audit entry. This is an explicit HUMAN
 * decision — never automated enforcement.
 */
export async function POST(req: Request) {
  const identity = await getAdminIdentity()
  if (!identity) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { action?: string; workspaceId?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { action, workspaceId } = body
  const reason = (body.reason ?? "").toString()

  if (!workspaceId) {
    return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })
  }
  if (action !== "flag" && action !== "clear") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const ip = clientIp(req)

  const result =
    action === "flag"
      ? await flagWorkspace(supabase, {
          workspaceId,
          adminUserId: identity.userId,
          reason,
          ip,
        })
      : await clearWorkspaceFlag(supabase, {
          workspaceId,
          adminUserId: identity.userId,
          reason,
          ip,
        })

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Action failed" }, { status: 400 })
  }

  return NextResponse.json(
    { ok: true, score: result.score },
    { headers: { "Cache-Control": "no-store" } }
  )
}
