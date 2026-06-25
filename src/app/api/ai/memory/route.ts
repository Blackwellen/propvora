/**
 * GET    /api/ai/memory?workspaceId=...      → workspace + this user's memory facts
 * DELETE /api/ai/memory { workspaceId, scope, key }  → forget a fact
 *
 * Backs the memory settings panel (view + delete what the Copilot has learned).
 * Workspace-fact deletes require owner/admin (service-role); user-fact deletes
 * are the caller's own (RLS-scoped self policy).
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

async function role(supabase: Awaited<ReturnType<typeof createClient>>, workspaceId: string, userId: string) {
  const { data } = await supabase.from("workspace_members").select("role").eq("workspace_id", workspaceId).eq("user_id", userId).single()
  return data?.role as string | undefined
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const workspaceId = request.nextUrl.searchParams.get("workspaceId") ?? ""
    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 })
    if (!(await role(supabase, workspaceId, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const [ws, usr] = await Promise.all([
      supabase.from("ai_memory_workspace").select("key, value, confidence, updated_at").eq("workspace_id", workspaceId).limit(100),
      supabase.from("ai_memory_user").select("key, value, confidence, updated_at").eq("workspace_id", workspaceId).eq("user_id", user.id).limit(100),
    ])
    return NextResponse.json({
      workspace: (ws.data as unknown[]) ?? [],
      user: (usr.data as unknown[]) ?? [],
    })
  } catch {
    return NextResponse.json({ error: "Failed to load memory" }, { status: 500 })
  }
}

const delSchema = z.object({
  workspaceId: z.string().min(1).max(100),
  scope: z.enum(["workspace", "user"]),
  key: z.string().min(1).max(200),
})

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const parsed = delSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
    const { workspaceId, scope, key } = parsed.data
    const r = await role(supabase, workspaceId, user.id)
    if (!r) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    if (scope === "user") {
      // RLS self-policy lets the user delete their own row directly.
      await supabase.from("ai_memory_user").delete().eq("workspace_id", workspaceId).eq("user_id", user.id).eq("key", key)
    } else {
      if (r !== "owner" && r !== "admin") {
        return NextResponse.json({ error: "Only owners/admins can delete workspace memory." }, { status: 403 })
      }
      await createAdminClient().from("ai_memory_workspace").delete().eq("workspace_id", workspaceId).eq("key", key)
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete memory" }, { status: 500 })
  }
}
