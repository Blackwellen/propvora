import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

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
