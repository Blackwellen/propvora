import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isExternalPortalEnabled } from "@/lib/portal/flags"
import { getValidatedPortalSession } from "@/lib/portal/session"
import {
  isPortalThreadInScope,
  getPrimaryThreadTarget,
  getPortalContactName,
} from "@/lib/portal/messaging-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/portal/messages
// Send a message as the external portal contact. Either replies to an existing
// thread (threadId, re-scoped as an IDOR guard) or starts a new one attached to
// the session's primary record (tenancy / property / contact). Service-role
// writes, validated strictly against the session — fail closed.
export async function POST(req: NextRequest) {
  if (!isExternalPortalEnabled()) return NextResponse.json({ ok: false, error: "unavailable" }, { status: 404 })

  const session = await getValidatedPortalSession()
  if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })

  let body: { threadId?: string; content?: string; subject?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 })
  }

  const content = (body.content ?? "").trim()
  if (!content) return NextResponse.json({ ok: false, error: "Message is empty." }, { status: 400 })

  const admin = createAdminClient()
  const senderName = await getPortalContactName(session)

  let threadId = body.threadId?.trim() || ""

  // Reply path — the thread MUST be in this session's scope.
  if (threadId) {
    if (!(await isPortalThreadInScope(session, threadId))) {
      return NextResponse.json({ ok: false, error: "not found" }, { status: 404 })
    }
  } else {
    // New-thread path — attach to the session's primary record.
    const target = await getPrimaryThreadTarget(session)
    if (!target) return NextResponse.json({ ok: false, error: "No record to attach a conversation to." }, { status: 400 })
    try {
      const { data, error } = await admin
        .from("message_threads")
        .insert({
          workspace_id: session.workspaceId,
          title: (body.subject ?? "").trim() || `${senderName} — ${session.portalType} portal`,
          type: "portal",
          related_type: target.relatedType,
          related_id: target.relatedId,
          archived: false,
          created_by: null,
        })
        .select("id")
        .single()
      if (error || !data) return NextResponse.json({ ok: false, error: "Could not start conversation." }, { status: 500 })
      threadId = data.id as string
    } catch {
      return NextResponse.json({ ok: false, error: "Could not start conversation." }, { status: 500 })
    }
  }

  try {
    const { data, error } = await admin
      .from("messages")
      .insert({
        thread_id: threadId,
        workspace_id: session.workspaceId,
        sender_id: session.contactId,
        sender_name: senderName,
        content,
      })
      .select("id, thread_id, sender_id, sender_name, content, created_at")
      .single()
    if (error || !data) return NextResponse.json({ ok: false, error: "Could not send message." }, { status: 500 })

    // Bump the thread so it sorts to the top (best-effort).
    try {
      await admin.from("message_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId)
    } catch { /* non-fatal */ }

    return NextResponse.json({
      ok: true,
      threadId,
      message: {
        id: data.id as string,
        threadId: data.thread_id as string,
        senderName: (data.sender_name as string) || senderName,
        content: data.content as string,
        createdAt: data.created_at as string,
        fromMe: true,
      },
    })
  } catch {
    return NextResponse.json({ ok: false, error: "Could not send message." }, { status: 500 })
  }
}
