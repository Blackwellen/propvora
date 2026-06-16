import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { isSupplierWorkspaceMember } from "@/lib/supplier/api-gate"
import { listNotifications, countUnread, markRead, markAllRead } from "@/lib/supplier/notifications"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/supplier/notifications?workspaceId=...&unreadOnly=1 */
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

    const unreadOnly = url.searchParams.get("unreadOnly") === "1"
    const [items, unreadCount] = await Promise.all([
      listNotifications(supabase, workspaceId, { unreadOnly }),
      countUnread(supabase, workspaceId),
    ])
    return NextResponse.json({ items, unreadCount })
  } catch (err) {
    captureException(err, { source: "api/supplier/notifications GET", requestId })
    return NextResponse.json({ error: "Failed to load notifications", requestId }, { status: 500 })
  }
}

/** PATCH /api/supplier/notifications  body: { workspaceId, id?, action: 'read'|'read_all' } */
export async function PATCH(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : ""
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const action = typeof body.action === "string" ? body.action : "read"
    if (action === "read_all") {
      await markAllRead(supabase, workspaceId)
      return NextResponse.json({ ok: true })
    }
    const id = typeof body.id === "string" ? body.id : ""
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
    await markRead(supabase, workspaceId, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    captureException(err, { source: "api/supplier/notifications PATCH", requestId })
    return NextResponse.json({ error: "Failed to update notification", requestId }, { status: 500 })
  }
}
