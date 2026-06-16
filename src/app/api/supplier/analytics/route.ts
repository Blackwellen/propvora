import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { isSupplierWorkspaceMember } from "@/lib/supplier/api-gate"
import { getSupplierAnalytics } from "@/lib/supplier/analytics"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/supplier/analytics?workspaceId=...&weeks=8 → chart-ready series from real records. */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const url = new URL(request.url)
    const workspaceId = (url.searchParams.get("workspaceId") ?? "").trim()
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const weeksParam = Number(url.searchParams.get("weeks") ?? "8")
    const weeks = Number.isFinite(weeksParam) ? Math.min(26, Math.max(4, weeksParam)) : 8
    const analytics = await getSupplierAnalytics(supabase, workspaceId, { weeks })
    return NextResponse.json(analytics)
  } catch (err) {
    captureException(err, { source: "api/supplier/analytics GET", requestId })
    return NextResponse.json({ error: "Failed to load analytics", requestId }, { status: 500 })
  }
}
