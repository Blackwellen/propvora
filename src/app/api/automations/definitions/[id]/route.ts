import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { gateAutomation } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"
import { resolveAuthedWorkspace, validateDefinition, loadDefinition, saveDefinition } from "../../_shared"

// Load / update a single automation definition by id. Membership-checked + gated.
export const dynamic = "force-dynamic"

const putSchema = z.object({
  workspaceId: z.string().min(1).max(100).optional(),
  definition: z.record(z.string(), z.unknown()),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = requestIdFrom(request.headers)
  try {
    const { id } = await params
    const workspaceId = new URL(request.url).searchParams.get("workspaceId") ?? undefined
    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth

    if (ctx.workspaceId) {
      const gate = await gateAutomation(ctx.supabase, ctx.workspaceId)
      if (!gate.allowed) {
        return NextResponse.json({ error: gate.reason, upgrade: true, tier: gate.tier }, { status: gate.status ?? 402 })
      }
    }

    const definition = await loadDefinition(ctx, id)
    if (!definition) return NextResponse.json({ error: "Automation not found." }, { status: 404 })
    return NextResponse.json({ ok: true, definition }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/definitions/[id]:GET", requestId })
    return NextResponse.json({ error: "Couldn't load the automation.", requestId }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = requestIdFrom(request.headers)
  try {
    const { id } = await params
    const parsed = putSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "A valid definition is required." }, { status: 400 })

    const auth = await resolveAuthedWorkspace(parsed.data.workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth
    if (!ctx.workspaceId) return NextResponse.json({ error: "No active workspace." }, { status: 400 })

    const gate = await gateAutomation(ctx.supabase, ctx.workspaceId)
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason, upgrade: true, tier: gate.tier }, { status: gate.status ?? 402 })
    }

    const { definition, notes } = validateDefinition(parsed.data.definition)
    if (!definition) return NextResponse.json({ error: "This automation isn't complete enough to save.", notes }, { status: 422 })
    definition.id = id

    const saved = await saveDefinition(ctx, definition)
    return NextResponse.json({ ok: true, id: saved.id }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/definitions/[id]:PUT", requestId })
    return NextResponse.json({ error: "Couldn't update the automation.", requestId }, { status: 500 })
  }
}
