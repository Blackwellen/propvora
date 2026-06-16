import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { isSupplierWorkspaceMember } from "@/lib/supplier/api-gate"
import { listLeads, countOpenLeads } from "@/lib/supplier/leads"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/supplier/leads?workspaceId=... — inbound quote-requests + enquiries. */
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

    const items = await listLeads(supabase, workspaceId)
    return NextResponse.json({ items, openCount: countOpenLeads(items) })
  } catch (err) {
    captureException(err, { source: "api/supplier/leads GET", requestId })
    return NextResponse.json({ error: "Failed to load leads", requestId }, { status: 500 })
  }
}
