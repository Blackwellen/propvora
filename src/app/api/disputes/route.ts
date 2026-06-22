// ============================================================================
// GET /api/disputes — REAL disputes for the caller.
//   • Platform admin  → every dispute (scope=all).
//   • Operator / supplier / customer → disputes touching their workspace(s).
// Live data only — mapped from marketplace_disputes + dispute_actions.
// ============================================================================
import { NextResponse } from "next/server"
import { loadDisputesForUser } from "@/lib/disputes/load"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const wantAll = new URL(req.url).searchParams.get("scope") === "all"
  const { items, ok } = await loadDisputesForUser({ scopeAll: wantAll })
  if (!ok) return NextResponse.json({ items: [], source: "live", error: "unauthenticated" }, { status: 401 })
  return NextResponse.json({ items, source: "live" })
}
