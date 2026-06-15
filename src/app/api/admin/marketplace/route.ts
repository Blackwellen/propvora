import { NextResponse } from "next/server"
import { getAdminIdentity } from "@/lib/admin/guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/admin/marketplace — platform-admin marketplace OVERSIGHT reads.
 *
 * Cross-tenant BY DESIGN; gated fail-closed by getAdminIdentity. Read-only.
 *
 * Query:
 *   ?view=overview                          → oversight KPIs (default)
 *   ?view=transactions[&status=&type=]      → cross-workspace transaction monitor
 *   ?view=payouts[&status=]                 → platform-wide payout monitor
 *
 * All amounts are integer pence, summed directly from live rows. No mock data.
 */
export async function GET(req: Request) {
  const identity = await getAdminIdentity()
  if (!identity) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const url = new URL(req.url)
  const view = url.searchParams.get("view") ?? "overview"
  const status = url.searchParams.get("status") ?? undefined
  const type = url.searchParams.get("type") ?? undefined

  const data = await import("@/components/admin-marketplace/data")

  try {
    if (view === "transactions") {
      const result = await data.listTransactions({ status, type })
      return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
    }
    if (view === "payouts") {
      const result = await data.listPayouts({ status })
      return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
    }
    // Default: overview KPIs.
    const overview = await data.getMarketplaceOverview()
    return NextResponse.json(overview, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "read_failed" },
      { status: 500 },
    )
  }
}
