import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceProfile, capabilitiesFor } from "@/lib/ai/workspace-context"
import { commandsForCapabilities } from "@/lib/ai/commands"

// The copilot command catalogue, filtered to the active workspace TYPE so the
// palette only ever shows commands that have a real handler AND apply to this
// workspace (operator / supplier / customer). Authenticated + workspace-scoped.
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const workspaceId = request.nextUrl.searchParams.get("workspaceId") ?? undefined

    if (workspaceId && workspaceId !== "demo-workspace") {
      const { data: member } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .single()
      if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const profile = await getWorkspaceProfile(supabase, workspaceId)
    const caps = capabilitiesFor(profile.type)
    const commands = commandsForCapabilities(caps).map((c) => ({
      slug: c.slug,
      label: c.label,
      description: c.description,
      category: c.category,
      requiresApproval: c.requiresApproval,
      shortcut: c.shortcut ?? null,
    }))

    return NextResponse.json({ workspaceType: profile.type, commands })
  } catch {
    return NextResponse.json({ error: "Failed to load commands." }, { status: 500 })
  }
}
