import { NextResponse } from "next/server"
import { getAdminIdentity } from "@/lib/admin/guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/admin/workspaces — platform-admin workspace directory + marketplace
 * footprint reads (oversight). Cross-tenant BY DESIGN; gated fail-closed by
 * getAdminIdentity. Read-only (no destructive actions this wave).
 *
 * Query:
 *   (none)            → workspace directory with marketplace transaction counts
 *   ?id=<uuid>        → that workspace's marketplace footprint
 */
export async function GET(req: Request) {
  const identity = await getAdminIdentity()
  if (!identity) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const url = new URL(req.url)
  const id = url.searchParams.get("id")?.trim()

  const data = await import("@/components/admin-marketplace/data")

  try {
    if (id) {
      const workspace = await data.getWorkspaceLite(id)
      if (!workspace) return NextResponse.json({ error: "not_found" }, { status: 404 })
      const footprint = await data.getWorkspaceMarketplaceFootprint(id)
      return NextResponse.json(
        { workspace, footprint },
        { headers: { "Cache-Control": "no-store" } },
      )
    }

    const result = await data.listWorkspaceDirectory(300)
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "read_failed" },
      { status: 500 },
    )
  }
}
