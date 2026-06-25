/**
 * GET /api/ai/credits?workspaceId=...
 *
 * Returns the workspace's per-class credit balances (allowance/used/remaining)
 * for the credits settings panel. Auth + membership gated; reads are RLS-scoped.
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCreditBalances, CREDIT_VALUE_GBP } from "@/lib/ai/credits"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const workspaceId = request.nextUrl.searchParams.get("workspaceId") ?? ""
    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 })

    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single()
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const balances = await getCreditBalances(supabase, workspaceId)
    const MAX = Number.MAX_SAFE_INTEGER
    return NextResponse.json({
      creditValueGbp: CREDIT_VALUE_GBP,
      balances: balances.map((b) => ({
        class: b.class,
        allowance: b.allowance === MAX ? null : b.allowance, // null = unlimited
        used: b.used,
        remaining: b.remaining === MAX ? null : b.remaining,
      })),
    })
  } catch {
    return NextResponse.json({ error: "Failed to load credits" }, { status: 500 })
  }
}
