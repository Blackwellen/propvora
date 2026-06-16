import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { isSupplierWorkspaceMember } from "@/lib/supplier/api-gate"
import { searchSupplierWorkspace } from "@/lib/supplier/search"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/supplier/search?workspaceId=...&q=... → grouped results across the workspace. */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const url = new URL(request.url)
    const workspaceId = (url.searchParams.get("workspaceId") ?? "").trim()
    const q = (url.searchParams.get("q") ?? "").trim()
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }
    if (q.length < 2) return NextResponse.json({ results: [] })

    const results = await searchSupplierWorkspace(supabase, workspaceId, q)
    return NextResponse.json({ results })
  } catch (err) {
    captureException(err, { source: "api/supplier/search GET", requestId })
    return NextResponse.json({ error: "Search failed", requestId }, { status: 500 })
  }
}
