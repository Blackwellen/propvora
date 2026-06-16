import { NextResponse } from "next/server"
import { z } from "zod"
import { getAdminIdentity } from "@/lib/admin/guard"
import { createAdminClient } from "@/lib/supabase/admin"
import { setNodeEnabled } from "@/lib/automation/admin"
import { recordAudit } from "@/lib/audit/log"

// Platform-admin automation controls. Cross-tenant; fail-closed (non-admin 403).
// The only write is a node KILL-SWITCH toggle in the node registry — a global
// safety control that the canvas compiler reads to block a node type everywhere.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const postSchema = z.object({
  action: z.literal("toggle_node"),
  nodeType: z.string().min(1),
  enabled: z.boolean(),
})

export async function POST(req: Request) {
  const identity = await getAdminIdentity()
  if (!identity) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const parsed = postSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  const { nodeType, enabled } = parsed.data

  const supabase = createAdminClient()
  await setNodeEnabled(supabase, nodeType, enabled)
  try {
    await recordAudit(supabase, {
      workspaceId: null,
      userId: identity.userId,
      action: enabled ? "admin.automation_node_enabled" : "admin.automation_node_killed",
      resourceType: "automation_node_registry",
      resourceId: nodeType,
      metadata: { node_type: nodeType, enabled },
    })
  } catch { /* audit best-effort */ }

  return NextResponse.json({ ok: true, nodeType, enabled }, { status: 200 })
}
