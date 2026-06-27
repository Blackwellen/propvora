import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { isSupplierWorkspaceMember } from "@/lib/supplier/api-gate"
import { getThread, listMessages, postMessage, markThreadRead } from "@/lib/supplier/messaging"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/supplier/messages/[threadId]?workspaceId=... → thread + messages (marks read). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const requestId = requestIdFrom(request.headers)
  try {
    const { threadId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const url = new URL(request.url)
    const workspaceId = (url.searchParams.get("workspaceId") ?? "").trim()
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const thread = await getThread(supabase, workspaceId, threadId)
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    const messages = await listMessages(supabase, workspaceId, threadId)
    await markThreadRead(supabase, workspaceId, threadId)
    return NextResponse.json({ thread: { ...thread, supplier_unread_count: 0 }, messages })
  } catch (err) {
    captureException(err, { source: "api/supplier/messages/[threadId] GET", requestId })
    return NextResponse.json({ error: "Failed to load thread", requestId }, { status: 500 })
  }
}

/** POST /api/supplier/messages/[threadId]  body: { workspaceId, body } → append a supplier message. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const requestId = requestIdFrom(request.headers)
  try {
    const { threadId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const b = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!b) return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
    const workspaceId = typeof b.workspaceId === "string" ? b.workspaceId.trim() : ""
    const messageBody = typeof b.body === "string" ? b.body.trim() : ""
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!messageBody) return NextResponse.json({ error: "body is required" }, { status: 400 })
    if (messageBody.length > 10_000) return NextResponse.json({ error: "Message is too long (max 10,000 characters)." }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const thread = await getThread(supabase, workspaceId, threadId)
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 })

    const message = await postMessage(supabase, workspaceId, threadId, {
      body: messageBody,
      author_side: "supplier",
      author_user_id: user.id,
    })
    if (!message) return NextResponse.json({ error: "Messaging is not ready yet." }, { status: 503 })
    return NextResponse.json({ message })
  } catch (err) {
    captureException(err, { source: "api/supplier/messages/[threadId] POST", requestId })
    return NextResponse.json({ error: "Failed to post message", requestId }, { status: 500 })
  }
}
