import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { AUTOMATION_NODE_REGISTRY } from "@/lib/automation/node-registry"
import { gateAutomation } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"
import { resolveAuthedWorkspace } from "../_shared"

// Integrations: the integration/webhook NODE catalogue (reference) PLUS the
// workspace's real connection records (automation_integrations). Secrets are
// never returned — only a presence flag. Connect/disconnect updates status.
export const dynamic = "force-dynamic"

const INTEGRATIONS_TABLE = "automation_integrations"

export async function GET(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const workspaceId = new URL(request.url).searchParams.get("workspaceId") ?? undefined
    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth

    const catalogue = AUTOMATION_NODE_REGISTRY.filter((node) => ["Integration", "Webhook/API"].includes(node.group))

    let connections: Array<Record<string, unknown>> = []
    if (ctx.workspaceId) {
      try {
        const { data } = await ctx.supabase
          .from(INTEGRATIONS_TABLE)
          .select("id, provider, name, status, last_used_at, created_at, secret_ref")
          .eq("workspace_id", ctx.workspaceId)
          .order("created_at", { ascending: false })
        connections = ((data as Array<Record<string, unknown>>) ?? []).map((c) => ({
          id: c.id, provider: c.provider, name: c.name, status: c.status,
          last_used_at: c.last_used_at, created_at: c.created_at,
          hasSecret: Boolean(c.secret_ref), // never expose the secret itself
        }))
      } catch { /* tolerant */ }
    }

    return NextResponse.json({ ok: true, catalogue, connections }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/integrations:GET", requestId })
    return NextResponse.json({ error: "Couldn't load integrations.", requestId }, { status: 500 })
  }
}

const postSchema = z.object({
  workspaceId: z.string().min(1).max(100).optional(),
  provider: z.string().min(1).max(60),
  name: z.string().min(1).max(120),
  status: z.enum(["disconnected", "connected", "error", "revoked"]).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = postSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "A provider + name are required." }, { status: 400 })
    const { workspaceId, provider, name, status, config } = parsed.data

    const auth = await resolveAuthedWorkspace(workspaceId)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { ctx } = auth
    if (!ctx.workspaceId) return NextResponse.json({ error: "No active workspace." }, { status: 400 })

    const gate = await gateAutomation(ctx.supabase, ctx.workspaceId)
    if (!gate.allowed) return NextResponse.json({ error: gate.reason, upgrade: true, tier: gate.tier }, { status: gate.status ?? 402 })

    const { data, error } = await ctx.supabase
      .from(INTEGRATIONS_TABLE)
      .insert({
        workspace_id: ctx.workspaceId,
        provider,
        name,
        status: status ?? "disconnected",
        config: config ?? {},
        created_by: ctx.userId,
      })
      .select("id")
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, id: data?.id }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/integrations:POST", requestId })
    return NextResponse.json({ error: "Couldn't save the integration.", requestId }, { status: 500 })
  }
}
