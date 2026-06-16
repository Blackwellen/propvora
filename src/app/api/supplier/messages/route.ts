import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { isSupplierWorkspaceMember } from "@/lib/supplier/api-gate"
import { listThreads, createThread, postMessage, countThreadUnread } from "@/lib/supplier/messaging"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/supplier/messages?workspaceId=...&assignmentId=... → thread list. */
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

    const assignmentId = url.searchParams.get("assignmentId") ?? undefined
    const [items, unreadCount] = await Promise.all([
      listThreads(supabase, workspaceId, assignmentId ? { assignmentId } : undefined),
      countThreadUnread(supabase, workspaceId),
    ])
    return NextResponse.json({ items, unreadCount })
  } catch (err) {
    captureException(err, { source: "api/supplier/messages GET", requestId })
    return NextResponse.json({ error: "Failed to load threads", requestId }, { status: 500 })
  }
}

/**
 * POST /api/supplier/messages
 * Create a thread (and optionally seed its first message).
 * body: { workspaceId, subject, counterparty_kind?, counterparty_name?, assignment_id?, lead_id?, body? }
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const b = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!b) return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    const workspaceId = typeof b.workspaceId === "string" ? b.workspaceId.trim() : ""
    const subject = typeof b.subject === "string" ? b.subject.trim() : ""
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!subject) return NextResponse.json({ error: "subject is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const thread = await createThread(supabase, workspaceId, {
      subject,
      counterparty_kind: (b.counterparty_kind as "operator" | "customer" | "platform") ?? "operator",
      counterparty_name: typeof b.counterparty_name === "string" ? b.counterparty_name : null,
      assignment_id: typeof b.assignment_id === "string" ? b.assignment_id : null,
      lead_id: typeof b.lead_id === "string" ? b.lead_id : null,
    })
    if (!thread) return NextResponse.json({ error: "Messaging is not ready yet." }, { status: 503 })

    const firstBody = typeof b.body === "string" ? b.body.trim() : ""
    if (firstBody) {
      await postMessage(supabase, workspaceId, thread.id, {
        body: firstBody,
        author_side: "supplier",
        author_user_id: user.id,
      })
    }
    return NextResponse.json({ thread })
  } catch (err) {
    captureException(err, { source: "api/supplier/messages POST", requestId })
    return NextResponse.json({ error: "Failed to create thread", requestId }, { status: 500 })
  }
}
