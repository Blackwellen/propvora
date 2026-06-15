import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { gateAutomation, gateCanvasLite } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"
import {
  resolveAuthedWorkspace,
  validateDefinition,
  saveDefinition,
  listDefinitions,
} from "../_shared"

// Save / load automation definitions. Membership-checked + plan-gated.
export const dynamic = "force-dynamic"

const postSchema = z.object({
  workspaceId: z.string().min(1).max(100).optional(),
  /** "canvas" requires the Canvas Lite entitlement; "builder" needs base automation. */
  source: z.enum(["builder", "canvas"]).optional(),
  definition: z.record(z.string(), z.unknown()),
})

export async function GET(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const url = new URL(request.url)
    const workspaceId = url.searchParams.get("workspaceId") ?? undefined
    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth

    if (ctx.workspaceId) {
      const gate = await gateAutomation(ctx.supabase, ctx.workspaceId)
      if (!gate.allowed) {
        return NextResponse.json({ error: gate.reason, upgrade: true, tier: gate.tier }, { status: gate.status ?? 402 })
      }
    }
    const definitions = await listDefinitions(ctx)
    return NextResponse.json({ ok: true, definitions }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/definitions:GET", requestId })
    return NextResponse.json({ error: "Couldn't load automations.", requestId }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = postSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "A valid definition is required." }, { status: 400 })
    }
    const { definition: raw, workspaceId, source } = parsed.data

    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth
    if (!ctx.workspaceId) {
      return NextResponse.json({ error: "No active workspace to save into." }, { status: 400 })
    }

    // Base automation entitlement always required.
    const gate = await gateAutomation(ctx.supabase, ctx.workspaceId)
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason, upgrade: true, tier: gate.tier }, { status: gate.status ?? 402 })
    }
    // Canvas Lite is a higher entitlement — gate when the save originates there.
    if (source === "canvas") {
      const canvasGate = await gateCanvasLite(ctx.supabase, ctx.workspaceId)
      if (!canvasGate.allowed) {
        return NextResponse.json({ error: canvasGate.reason, upgrade: true, tier: canvasGate.tier }, { status: canvasGate.status ?? 402 })
      }
    }

    const { definition, notes } = validateDefinition(raw)
    if (!definition) {
      return NextResponse.json({ error: "This automation isn't complete enough to save.", notes }, { status: 422 })
    }
    // Preserve an id passed through on the raw object (update path).
    if (typeof (raw as Record<string, unknown>).id === "string") {
      definition.id = String((raw as Record<string, unknown>).id)
    }

    const saved = await saveDefinition(ctx, definition)
    return NextResponse.json({ ok: true, id: saved.id }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/definitions:POST", requestId })
    return NextResponse.json({ error: "Couldn't save the automation. Please try again.", requestId }, { status: 500 })
  }
}
