import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { listSupplierJobs, type JobStatus } from "@/lib/supplier/jobs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function isWorkspaceMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle()
  return Boolean(data)
}

/**
 * GET /api/supplier/jobs?workspaceId=...&side=operator|supplier&status=...
 * Lists job assignments where `workspaceId` is the given side. Caller must be a
 * member of `workspaceId`. A supplier sees only jobs assigned to it; an operator
 * only its own.
 */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const url = new URL(request.url)
    const workspaceId = (url.searchParams.get("workspaceId") ?? "").trim()
    const side = (url.searchParams.get("side") ?? "operator").trim()
    const status = (url.searchParams.get("status") ?? "").trim()
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    }
    if (side !== "operator" && side !== "supplier") {
      return NextResponse.json({ error: "side must be 'operator' or 'supplier'" }, { status: 400 })
    }
    if (!(await isWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const items = await listSupplierJobs(
      supabase,
      workspaceId,
      side,
      status ? { status: status as JobStatus } : undefined
    )
    return NextResponse.json({ items })
  } catch (err) {
    captureException(err, { source: "api/supplier/jobs GET", requestId })
    return NextResponse.json({ error: "Failed to load jobs", requestId }, { status: 500 })
  }
}
