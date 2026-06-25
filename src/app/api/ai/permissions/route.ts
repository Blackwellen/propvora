/**
 * GET  /api/ai/permissions?workspaceId=...  → effective + workspace level
 * POST /api/ai/permissions { workspaceId, level }  → set workspace level (owner/admin)
 *
 * Backs the permissions settings panel. The workspace level is one input to the
 * effective level = min(plan, workspace, user, entity); the engine never exceeds
 * the plan ceiling. Writes use the service-role client (ai_permissions write is
 * owner/admin-only and audited).
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolveEffectiveLevel, planMaxLevel, PERMISSION_LEVELS, STRICTNESS_PRESETS } from "@/lib/ai/permissions"
import { getWorkspaceTier } from "@/lib/billing/gates"

export const dynamic = "force-dynamic"

async function requireMember(supabase: Awaited<ReturnType<typeof createClient>>, workspaceId: string, userId: string) {
  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single()
  return data?.role as string | undefined
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const workspaceId = request.nextUrl.searchParams.get("workspaceId") ?? ""
    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 })
    const role = await requireMember(supabase, workspaceId, user.id)
    if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const effective = await resolveEffectiveLevel(supabase, workspaceId, user.id)
    const tier = await getWorkspaceTier(supabase, workspaceId)
    return NextResponse.json({
      effectiveLevel: effective.level,
      planMaxLevel: planMaxLevel(tier),
      tier,
      canEdit: role === "owner" || role === "admin",
      levels: PERMISSION_LEVELS,
      presets: STRICTNESS_PRESETS,
    })
  } catch {
    return NextResponse.json({ error: "Failed to load permissions" }, { status: 500 })
  }
}

const postSchema = z.object({
  workspaceId: z.string().min(1).max(100),
  level: z.number().int().min(0).max(6),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const parsed = postSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
    const { workspaceId, level } = parsed.data

    const role = await requireMember(supabase, workspaceId, user.id)
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Only workspace owners/admins can change AI autonomy." }, { status: 403 })
    }

    // Set the single workspace-scope level. NOTE: a plain upsert on
    // (workspace_id, scope, scope_id) does NOT dedupe here because scope_id is
    // NULL for workspace scope and Postgres treats NULLs as distinct in unique
    // constraints — so we delete-then-insert to guarantee exactly one row.
    const admin = createAdminClient()
    await admin.from("ai_permissions").delete().eq("workspace_id", workspaceId).eq("scope", "workspace").is("scope_id", null)
    await admin.from("ai_permissions").insert({
      workspace_id: workspaceId, scope: "workspace", scope_id: null, level, set_by: user.id, updated_at: new Date().toISOString(),
    })
    await admin.from("ai_audit_log").insert({
      workspace_id: workspaceId,
      actor_user_id: user.id,
      surface: "settings",
      action_type: "ai.permission.set",
      result: { level },
    })

    const effective = await resolveEffectiveLevel(supabase, workspaceId, user.id)
    return NextResponse.json({ ok: true, effectiveLevel: effective.level })
  } catch {
    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 })
  }
}
