import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const patchSchema = z.object({
  folderId: z.string().uuid().nullable().optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
  title: z.string().min(1).max(120).optional(),
  chatType: z.enum(["standard", "property", "portfolio", "tenant", "automation", "project"]).optional(),
})

/** PATCH /api/ai/threads/[id] — organise a chat (folder / pin / archive / title). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const parsed = patchSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (parsed.data.folderId !== undefined) patch.folder_id = parsed.data.folderId
    if (parsed.data.pinned !== undefined) patch.pinned = parsed.data.pinned
    if (parsed.data.archived !== undefined) patch.archived_at = parsed.data.archived ? new Date().toISOString() : null
    if (parsed.data.title !== undefined) patch.title = parsed.data.title
    if (parsed.data.chatType !== undefined) patch.chat_type = parsed.data.chatType

    // RLS + the user_id filter ensure a user can only organise their own chats.
    const { error } = await supabase.from("ai_chat_threads").update(patch).eq("id", id).eq("user_id", user.id)
    if (error) return NextResponse.json({ error: "Could not update chat" }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Could not update chat" }, { status: 500 })
  }
}

/** GET /api/ai/threads/[id] — fetch messages for a specific thread (RLS-scoped) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    // Verify thread belongs to this user before returning messages
    const { data: thread } = await supabase
      .from("ai_chat_threads")
      .select("id, workspace_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { data: messages } = await supabase
      .from("ai_chat_messages")
      .select("id, role, content, created_at")
      .eq("thread_id", id)
      .order("created_at", { ascending: true })
      .limit(50)

    return NextResponse.json({ messages: messages ?? [] })
  } catch {
    return NextResponse.json({ messages: [] })
  }
}
