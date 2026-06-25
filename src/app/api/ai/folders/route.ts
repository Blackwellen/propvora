/**
 * Chat folders CRUD — Gmail-style organisation for saved Copilot chats.
 *   GET    /api/ai/folders?workspaceId=...        → list folders
 *   POST   /api/ai/folders { workspaceId, name, color? }   → create
 *   PATCH  /api/ai/folders { workspaceId, id, name?, color? } → rename/recolour
 *   DELETE /api/ai/folders { workspaceId, id }     → delete (threads keep, folder_id nulls)
 *
 * RLS-scoped to workspace members (ai_chat_folders policy). Auth required.
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

async function member(supabase: Awaited<ReturnType<typeof createClient>>, workspaceId: string, userId: string) {
  const { data } = await supabase.from("workspace_members").select("role").eq("workspace_id", workspaceId).eq("user_id", userId).single()
  return !!data
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const workspaceId = request.nextUrl.searchParams.get("workspaceId") ?? ""
    if (!workspaceId) return NextResponse.json({ folders: [] })
    const { data } = await supabase
      .from("ai_chat_folders")
      .select("id, name, color, parent_folder_id, position")
      .eq("workspace_id", workspaceId)
      .order("position", { ascending: true })
    return NextResponse.json({ folders: data ?? [] })
  } catch {
    return NextResponse.json({ folders: [] })
  }
}

const createSchema = z.object({ workspaceId: z.string().min(1).max(100), name: z.string().min(1).max(60), color: z.string().max(20).optional() })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const parsed = createSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
    const { workspaceId, name, color } = parsed.data
    if (!(await member(supabase, workspaceId, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const { data, error } = await supabase
      .from("ai_chat_folders")
      .insert({ workspace_id: workspaceId, name, color: color ?? null, created_by: user.id })
      .select("id, name, color, parent_folder_id, position")
      .single()
    if (error) return NextResponse.json({ error: "Could not create folder" }, { status: 500 })
    return NextResponse.json({ folder: data })
  } catch {
    return NextResponse.json({ error: "Could not create folder" }, { status: 500 })
  }
}

const patchSchema = z.object({ workspaceId: z.string().min(1), id: z.string().uuid(), name: z.string().min(1).max(60).optional(), color: z.string().max(20).optional() })

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const parsed = patchSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
    const { workspaceId, id, name, color } = parsed.data
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (name !== undefined) patch.name = name
    if (color !== undefined) patch.color = color
    await supabase.from("ai_chat_folders").update(patch).eq("id", id).eq("workspace_id", workspaceId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Could not update folder" }, { status: 500 })
  }
}

const delSchema = z.object({ workspaceId: z.string().min(1), id: z.string().uuid() })

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const parsed = delSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
    const { workspaceId, id } = parsed.data
    // Threads keep existing; their folder_id is set null by the FK ON DELETE SET NULL.
    await supabase.from("ai_chat_folders").delete().eq("id", id).eq("workspace_id", workspaceId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Could not delete folder" }, { status: 500 })
  }
}
