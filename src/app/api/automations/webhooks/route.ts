import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { gateAutomation } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"
import { resolveAuthedWorkspace } from "../_shared"
import {
  listEndpoints,
  listDeliveries,
  createEndpoint,
  setEndpointActive,
  deleteEndpoint,
} from "./_lib"

// Manage INBOUND webhook endpoints. Membership-checked + automation-gated.
// The endpoints minted here are triggered by the PUBLIC receiver at
// /api/automations/trigger/[token].
export const dynamic = "force-dynamic"

const postSchema = z.object({
  workspaceId: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(120),
  definitionId: z.string().uuid().nullable().optional(),
  withSecret: z.boolean().optional(),
})

const patchSchema = z.object({
  workspaceId: z.string().min(1).max(100).optional(),
  id: z.string().uuid(),
  active: z.boolean(),
})

const deleteSchema = z.object({
  workspaceId: z.string().min(1).max(100).optional(),
  id: z.string().uuid(),
})

async function gatedCtx(workspaceId: string | undefined) {
  const auth = await resolveAuthedWorkspace(workspaceId)
  if (!auth.ok) return { error: auth.error, status: auth.status } as const
  const { ctx } = auth
  if (!ctx.workspaceId) return { error: "No active workspace.", status: 400 } as const
  const gate = await gateAutomation(ctx.supabase, ctx.workspaceId)
  if (!gate.allowed) {
    return { error: gate.reason ?? "Automation isn't on your plan.", status: gate.status ?? 402, upgrade: true, tier: gate.tier } as const
  }
  return { ctx } as const
}

export async function GET(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const url = new URL(request.url)
    const workspaceId = url.searchParams.get("workspaceId") ?? undefined
    const endpointId = url.searchParams.get("endpointId") ?? undefined

    const g = await gatedCtx(workspaceId)
    if ("error" in g) {
      return NextResponse.json({ error: g.error, upgrade: g.upgrade, tier: g.tier }, { status: g.status })
    }
    const { ctx } = g

    // Delivery history for one endpoint.
    if (endpointId) {
      const deliveries = await listDeliveries(ctx.supabase, endpointId)
      return NextResponse.json({ ok: true, deliveries }, { status: 200 })
    }

    const endpoints = await listEndpoints(ctx.supabase, ctx.workspaceId!)
    return NextResponse.json({ ok: true, endpoints }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/webhooks:GET", requestId })
    return NextResponse.json({ error: "Couldn't load webhooks.", requestId }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = postSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "A webhook name is required." }, { status: 400 })
    }
    const { workspaceId, name, definitionId, withSecret } = parsed.data

    const g = await gatedCtx(workspaceId)
    if ("error" in g) {
      return NextResponse.json({ error: g.error, upgrade: g.upgrade, tier: g.tier }, { status: g.status })
    }
    const { ctx } = g

    const { endpoint, secret } = await createEndpoint(ctx.supabase, ctx.workspaceId!, ctx.userId, {
      name,
      definitionId: definitionId ?? null,
      withSecret: withSecret ?? false,
    })

    // The token + secret are returned ONCE. The secret is never stored in
    // plaintext and cannot be retrieved again.
    return NextResponse.json({ ok: true, endpoint, secret }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/webhooks:POST", requestId })
    return NextResponse.json({ error: "Couldn't create the webhook. Please try again.", requestId }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = patchSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "A webhook id and active flag are required." }, { status: 400 })
    }
    const { workspaceId, id, active } = parsed.data

    const g = await gatedCtx(workspaceId)
    if ("error" in g) {
      return NextResponse.json({ error: g.error, upgrade: g.upgrade, tier: g.tier }, { status: g.status })
    }
    const { ctx } = g

    await setEndpointActive(ctx.supabase, ctx.workspaceId!, id, active)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/webhooks:PATCH", requestId })
    return NextResponse.json({ error: "Couldn't update the webhook.", requestId }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = deleteSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "A webhook id is required." }, { status: 400 })
    }
    const { workspaceId, id } = parsed.data

    const g = await gatedCtx(workspaceId)
    if ("error" in g) {
      return NextResponse.json({ error: g.error, upgrade: g.upgrade, tier: g.tier }, { status: g.status })
    }
    const { ctx } = g

    await deleteEndpoint(ctx.supabase, ctx.workspaceId!, id)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/webhooks:DELETE", requestId })
    return NextResponse.json({ error: "Couldn't delete the webhook.", requestId }, { status: 500 })
  }
}
