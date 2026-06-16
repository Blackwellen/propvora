import { NextResponse } from "next/server"
import { z } from "zod"
import { getAdminIdentity } from "@/lib/admin/guard"
import { createAdminClient } from "@/lib/supabase/admin"
import { setNodeEnabled, updatePlanLimit, forceReplayRun } from "@/lib/automation/admin"
import { recordAudit } from "@/lib/audit/log"

// Platform-admin automation controls. Cross-tenant; fail-closed (non-admin 403).
// Writes: node KILL-SWITCH toggle (global safety control the compiler reads),
// plan-limit edits (governance caps), and force-replay of a run (which always
// re-applies the normal gates + approval safety — never bypasses payment/legal).
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const postSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("toggle_node"), nodeType: z.string().min(1), enabled: z.boolean() }),
  z.object({
    action: z.literal("update_plan_limit"),
    plan: z.string().min(1),
    patch: z.object({
      max_active: z.number().int().min(0).optional(),
      max_runs_month: z.number().int().min(0).optional(),
      max_nodes: z.number().int().min(0).optional(),
      max_webhooks: z.number().int().min(0).optional(),
      retention_days: z.number().int().min(0).optional(),
    }),
  }),
  z.object({ action: z.literal("force_replay"), runId: z.string().min(1) }),
])

export async function POST(req: Request) {
  const identity = await getAdminIdentity()
  if (!identity) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const parsed = postSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 })

  const supabase = createAdminClient()
  const data = parsed.data

  if (data.action === "toggle_node") {
    await setNodeEnabled(supabase, data.nodeType, data.enabled)
    try {
      await recordAudit(supabase, {
        workspaceId: null,
        userId: identity.userId,
        action: data.enabled ? "admin.automation_node_enabled" : "admin.automation_node_killed",
        resourceType: "automation_node_registry",
        resourceId: data.nodeType,
        metadata: { node_type: data.nodeType, enabled: data.enabled },
      })
    } catch { /* audit best-effort */ }
    return NextResponse.json({ ok: true, nodeType: data.nodeType, enabled: data.enabled }, { status: 200 })
  }

  if (data.action === "update_plan_limit") {
    await updatePlanLimit(supabase, data.plan, data.patch)
    try {
      await recordAudit(supabase, {
        workspaceId: null, userId: identity.userId,
        action: "admin.automation_plan_limit_updated",
        resourceType: "automation_plan_limits", resourceId: data.plan,
        metadata: { plan: data.plan, patch: data.patch },
      })
    } catch { /* best-effort */ }
    return NextResponse.json({ ok: true, plan: data.plan }, { status: 200 })
  }

  // force_replay
  const queued = await forceReplayRun(supabase, data.runId)
  try {
    await recordAudit(supabase, {
      workspaceId: null, userId: identity.userId,
      action: "admin.automation_run_force_replayed",
      resourceType: "automation_runs", resourceId: data.runId,
      metadata: { run_id: data.runId, queued },
    })
  } catch { /* best-effort */ }
  return NextResponse.json({ ok: queued, runId: data.runId, queued }, { status: queued ? 200 : 422 })
}
