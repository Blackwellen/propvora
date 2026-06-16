import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { gateAutomation } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"
import { resolveAuthedWorkspace } from "../_shared"
import { listErrors, resolveError } from "@/lib/automation/approvals"

// Automation errors surface: list recorded run/node errors and resolve them.
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const url = new URL(request.url)
    const workspaceId = url.searchParams.get("workspaceId") ?? undefined
    const resolvedParam = url.searchParams.get("resolved")

    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth
    if (!ctx.workspaceId) return NextResponse.json({ ok: true, errors: [] }, { status: 200 })

    const gate = await gateAutomation(ctx.supabase, ctx.workspaceId)
    if (!gate.allowed) return NextResponse.json({ error: gate.reason, upgrade: true, tier: gate.tier }, { status: gate.status ?? 402 })

    const errors = await listErrors(ctx.supabase, ctx.workspaceId, {
      resolved: resolvedParam === null ? undefined : resolvedParam === "true",
    })
    return NextResponse.json({ ok: true, errors }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/errors:GET", requestId })
    return NextResponse.json({ error: "Couldn't load errors.", requestId }, { status: 500 })
  }
}

const postSchema = z.object({
  workspaceId: z.string().min(1).max(100).optional(),
  errorId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = postSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "An errorId is required." }, { status: 400 })
    const { workspaceId, errorId } = parsed.data

    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth
    if (!ctx.workspaceId) return NextResponse.json({ error: "No active workspace." }, { status: 400 })

    const gate = await gateAutomation(ctx.supabase, ctx.workspaceId)
    if (!gate.allowed) return NextResponse.json({ error: gate.reason, upgrade: true, tier: gate.tier }, { status: gate.status ?? 402 })

    await resolveError(ctx.supabase, ctx.workspaceId, errorId, ctx.userId)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/errors:POST", requestId })
    return NextResponse.json({ error: "Couldn't resolve the error.", requestId }, { status: 500 })
  }
}
