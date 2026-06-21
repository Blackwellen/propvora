/**
 * GET /api/ai/usage
 *
 * Returns the authenticated workspace's current-month AI message usage vs.
 * the plan limit. Used by the Copilot panel footer usage meter.
 *
 * Response shape:
 *   { used: number; limit: number; enabled: boolean }
 *
 * Returns 401 when unauthenticated, 200 with {enabled:false} when AI is not
 * on the plan, 200 with real counts when AI is enabled.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkAiCap } from "@/lib/ai/caps"

export const dynamic = "force-dynamic"

async function resolveWorkspaceId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle()
    return data?.workspace_id ?? null
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const workspaceId = await resolveWorkspaceId(supabase, user.id)
    if (!workspaceId) {
      return NextResponse.json({ used: 0, limit: 0, enabled: false })
    }

    const capCheck = await checkAiCap(supabase, workspaceId)
    return NextResponse.json({
      used: capCheck.used,
      limit: capCheck.limit,
      // enabled = AI is on the plan AND the user hasn't exhausted the limit
      enabled: capCheck.allowed || capCheck.limit > 0,
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 })
  }
}
