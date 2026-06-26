import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const schema = z.object({ provider: z.string().min(1).max(80) })

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body: unknown = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "provider is required" }, { status: 400 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id")
    .eq("id", user.id)
    .maybeSingle()
  const workspaceId = profile?.current_workspace_id as string | null
  if (!workspaceId) return NextResponse.json({ error: "No active workspace" }, { status: 400 })

  // Verify membership
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { error } = await supabase
    .from("automation_integrations")
    .update({ status: "disconnected", health: "disconnected", enabled: false, updated_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("provider", parsed.data.provider)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
