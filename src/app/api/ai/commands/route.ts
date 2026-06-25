import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceProfile, capabilitiesFor } from "@/lib/ai/workspace-context"
import { commandsForPacks } from "@/lib/ai/commands"

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

    // Feature-flag gating: V2 surfaces (bookings, marketplace) default OFF, so
    // their commands must NOT appear unless the workspace flag is on. Adjust the
    // capability map by the live flags before filtering.
    if (workspaceId && workspaceId !== "demo-workspace" && process.env.NEXT_PUBLIC_QA_ALL_FLAGS !== "true") {
      const { isFeatureEnabled } = await import("@/lib/flags")
      const [bookings, marketplace] = await Promise.all([
        isFeatureEnabled("bookingManagement", { supabase, workspaceId }).catch(() => false),
        isFeatureEnabled("marketplaceEnabled", { supabase, workspaceId }).catch(() => false),
      ])
      caps.bookings = caps.bookings && bookings
      caps.marketplace = caps.marketplace && marketplace
    }

    // commandsForPacks respects NEXT_PUBLIC_QA_ALL_FLAGS for QA mode.
    const commands = commandsForPacks(profile.type, caps).map((c) => ({
      slug: c.slug,
      label: c.label,
      description: c.description,
      category: c.category,
      pack: c.pack,
      requiresApproval: c.requiresApproval,
      shortcut: c.shortcut ?? null,
    }))

    return NextResponse.json({ workspaceType: profile.type, commands })
  } catch {
    return NextResponse.json({ error: "Failed to load commands." }, { status: 500 })
  }
}
