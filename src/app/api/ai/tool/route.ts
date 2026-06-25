/**
 * POST /api/ai/tool
 *
 * The Copilot's action executor. Runs ONE tool through the full
 * permission → credit → execute → audit pipeline (src/lib/ai/tools.ts). The
 * model proposes a tool + args (or the client invokes one directly from an
 * approved action card); this endpoint disposes deterministically.
 *
 * Body: { tool, args, workspaceId, chatId?, entityId?, approved? }
 * Returns:
 *   200 { status:"succeeded", result, creditCost }
 *   202 { status:"awaiting_approval", requiresApproval:true }  — needs human OK
 *   402 { status:"denied" | "failed", reason }                 — permission/credits
 *   401/403 on auth/membership failure
 *
 * Server-side only: the tool runs under RLS as the caller for reads, and the
 * audited write executor for side effects. The model never executes anything
 * directly — every action lands here first.
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { gateAiCopilot } from "@/lib/billing/gates"
import { resolveEffectiveLevel } from "@/lib/ai/permissions"
import { executeTool, TOOL_REGISTRY } from "@/lib/ai/tools"
import { checkRate } from "@/lib/ai/metering"
import { captureException, requestIdFrom } from "@/lib/observability"

export const dynamic = "force-dynamic"

const schema = z.object({
  tool: z.string().min(1).max(64),
  args: z.record(z.string(), z.unknown()).default({}),
  workspaceId: z.string().min(1).max(100),
  chatId: z.string().uuid().optional(),
  entityId: z.string().max(100).optional(),
  approved: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
    }
    const { tool, args, workspaceId, chatId, entityId, approved } = parsed.data

    if (!TOOL_REGISTRY[tool]) {
      return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 })
    }

    // Membership + plan gate (Copilot is Scale+).
    if (workspaceId !== "demo-workspace") {
      const { data: member } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .single()
      if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

      const gate = await gateAiCopilot(supabase, workspaceId)
      if (!gate.allowed) {
        return NextResponse.json({ error: gate.reason, upgrade: true, tier: gate.tier }, { status: gate.status ?? 402 })
      }
    }

    // Burst guard (per workspace) — actions are rate-limited too.
    const rate = await checkRate(supabase, workspaceId)
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many actions too quickly. Please wait a moment." }, { status: 429 })
    }

    // Resolve the effective permission level for this (workspace, user, entity).
    const effective = await resolveEffectiveLevel(supabase, workspaceId, user.id, entityId)

    const result = await executeTool({
      supabase,
      workspaceId,
      userId: user.id,
      chatId: chatId ?? null,
      toolName: tool,
      args,
      effective,
      approved,
      surface: "chat",
    })

    const httpStatus =
      result.status === "succeeded" ? 200
      : result.status === "awaiting_approval" ? 202
      : result.status === "denied" ? 403
      : 402

    return NextResponse.json(result, { status: httpStatus })
  } catch (err) {
    captureException(err, { source: "api/ai/tool", requestId })
    return NextResponse.json({ error: "Failed to run the action.", requestId }, { status: 500 })
  }
}
