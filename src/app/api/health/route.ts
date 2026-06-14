import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/health — public liveness/health probe.
 *
 * Returns a coarse status only. It NEVER exposes secrets, env values, stack
 * traces, versions or internal config — just whether the app can reach its
 * database. Detailed readiness (env presence, provider config) lives in the
 * admin-only /api/ready endpoint.
 */
export async function GET() {
  let db: "ok" | "down" = "down"
  try {
    const admin = createAdminClient()
    // Cheapest possible round-trip: count head on a tiny always-present table.
    const { error } = await admin.from("workspaces").select("id", { head: true, count: "exact" }).limit(1)
    db = error ? "down" : "ok"
  } catch {
    db = "down"
  }

  const healthy = db === "ok"
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", db, time: new Date().toISOString() },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  )
}
