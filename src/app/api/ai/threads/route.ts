import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/** GET /api/ai/threads?workspaceId=xxx — list the last 20 threads for this workspace */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const workspaceId = request.nextUrl.searchParams.get("workspaceId")
    if (!workspaceId) return NextResponse.json({ threads: [] })
    const folderId = request.nextUrl.searchParams.get("folderId")
    const includeArchived = request.nextUrl.searchParams.get("archived") === "1"

    // Select the chat-organisation columns. Tolerant: if the chat-org migration
    // isn't applied the extra columns simply come back null.
    let q = supabase
      .from("ai_chat_threads")
      .select("id, title, context_route, folder_id, chat_type, pinned, pinned_entity_type, pinned_entity_id, archived_at, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(60)
    if (folderId) q = q.eq("folder_id", folderId)
    if (!includeArchived) q = q.is("archived_at", null)

    const { data: threads, error } = await q
    // Fall back to the legacy minimal select if the new columns aren't there yet.
    if (error) {
      const { data: legacy } = await supabase
        .from("ai_chat_threads")
        .select("id, title, context_route, created_at, updated_at")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20)
      return NextResponse.json({ threads: legacy ?? [] })
    }
    return NextResponse.json({ threads: threads ?? [] })
  } catch {
    return NextResponse.json({ threads: [] })
  }
}
