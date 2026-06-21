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

    const { data: threads } = await supabase
      .from("ai_chat_threads")
      .select("id, title, context_route, created_at, updated_at")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20)

    return NextResponse.json({ threads: threads ?? [] })
  } catch {
    return NextResponse.json({ threads: [] })
  }
}
