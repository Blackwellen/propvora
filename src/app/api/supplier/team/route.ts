import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { isSupplierWorkspaceMember } from "@/lib/supplier/api-gate"
import {
  listTeam,
  updateTeamRole,
  removeTeamMember,
  type SupplierTeamRole,
} from "@/lib/supplier/team"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ROLES: SupplierTeamRole[] = ["owner", "admin", "member"]

/** GET /api/supplier/team?workspaceId=... */
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

    const items = await listTeam(supabase, workspaceId)
    return NextResponse.json({ items })
  } catch (err) {
    captureException(err, { source: "api/supplier/team GET", requestId })
    return NextResponse.json({ error: "Failed to load team", requestId }, { status: 500 })
  }
}

/** PATCH /api/supplier/team  Body: { workspaceId, memberId, role } */
export async function PATCH(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : ""
    const memberId = typeof body.memberId === "string" ? body.memberId.trim() : ""
    const role = typeof body.role === "string" ? (body.role.trim() as SupplierTeamRole) : ""
    if (!workspaceId || !memberId) return NextResponse.json({ error: "workspaceId and memberId are required" }, { status: 400 })
    if (!role || !ROLES.includes(role as SupplierTeamRole)) {
      return NextResponse.json({ error: "role must be 'owner', 'admin' or 'member'" }, { status: 400 })
    }
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const ok = await updateTeamRole(supabase, workspaceId, memberId, role as SupplierTeamRole)
    if (!ok) return NextResponse.json({ error: "Could not update role." }, { status: 409 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    captureException(err, { source: "api/supplier/team PATCH", requestId })
    return NextResponse.json({ error: "Failed to update team member", requestId }, { status: 500 })
  }
}

/** DELETE /api/supplier/team?workspaceId=...&memberId=... */
export async function DELETE(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const url = new URL(request.url)
    const workspaceId = (url.searchParams.get("workspaceId") ?? "").trim()
    const memberId = (url.searchParams.get("memberId") ?? "").trim()
    if (!workspaceId || !memberId) return NextResponse.json({ error: "workspaceId and memberId are required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const ok = await removeTeamMember(supabase, workspaceId, memberId)
    if (!ok) return NextResponse.json({ error: "Could not remove member." }, { status: 409 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    captureException(err, { source: "api/supplier/team DELETE", requestId })
    return NextResponse.json({ error: "Failed to remove team member", requestId }, { status: 500 })
  }
}
