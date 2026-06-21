import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { randomBytes } from "node:crypto"
import { gateAutomation } from "@/lib/billing/gates"
import { captureException, requestIdFrom } from "@/lib/observability"
import { resolveAuthedWorkspace } from "../_shared"

// Outbound webhook CRUD — Propvora → external systems.
// Distinct from the INBOUND receiver (automation_webhook_endpoints).
export const dynamic = "force-dynamic"

const TABLE = "automation_webhooks"
const LOGS_TABLE = "automation_webhook_logs"

const createSchema = z.object({
  workspaceId: z.string().min(1).max(100).optional(),
  url: z.string().url("Must be a valid https:// URL").startsWith("https://", "Webhook URLs must use HTTPS"),
  description: z.string().max(500).optional(),
  event_types: z.array(z.string()).min(1, "Select at least one event type"),
  withSecret: z.boolean().optional(),
})

const updateSchema = z.object({
  workspaceId: z.string().min(1).max(100).optional(),
  id: z.string().uuid(),
  url: z.string().url().startsWith("https://").optional(),
  description: z.string().max(500).optional(),
  event_types: z.array(z.string()).optional(),
  enabled: z.boolean().optional(),
})

const deleteSchema = z.object({
  workspaceId: z.string().min(1).max(100).optional(),
  id: z.string().uuid(),
})

const testSchema = z.object({
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
    return { error: gate.reason ?? "Automations not on your plan.", status: gate.status ?? 402, upgrade: true, tier: gate.tier } as const
  }
  return { ctx } as const
}

// GET — list webhooks (+ optional logs for one webhook)
export async function GET(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const url = new URL(request.url)
    const workspaceId = url.searchParams.get("workspaceId") ?? undefined
    const webhookId = url.searchParams.get("webhookId") ?? undefined

    const g = await gatedCtx(workspaceId)
    if ("error" in g) return NextResponse.json({ error: g.error, upgrade: g.upgrade, tier: g.tier }, { status: g.status })
    const { ctx } = g

    if (webhookId) {
      // Return last 20 delivery logs for a specific webhook
      const { data, error } = await ctx.supabase
        .from(LOGS_TABLE)
        .select("id, event_type, http_status, response_ms, delivered_at, error_msg")
        .eq("webhook_id", webhookId)
        .eq("workspace_id", ctx.workspaceId!)
        .order("delivered_at", { ascending: false })
        .limit(20)
      if (error) throw new Error(error.message)
      return NextResponse.json({ ok: true, logs: data ?? [] }, { status: 200 })
    }

    const { data, error } = await ctx.supabase
      .from(TABLE)
      .select("id, url, description, event_types, enabled, last_triggered_at, created_at")
      .eq("workspace_id", ctx.workspaceId!)
      .order("created_at", { ascending: false })
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, webhooks: data ?? [] }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/outbound-webhooks:GET", requestId })
    return NextResponse.json({ error: "Couldn't load webhooks.", requestId }, { status: 500 })
  }
}

// POST — create a new outbound webhook
export async function POST(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = createSchema.safeParse(await request.json())
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid webhook data."
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    const { workspaceId, url: webhookUrl, description, event_types, withSecret } = parsed.data

    const g = await gatedCtx(workspaceId)
    if ("error" in g) return NextResponse.json({ error: g.error, upgrade: g.upgrade, tier: g.tier }, { status: g.status })
    const { ctx } = g

    // Generate a secret token shown once (never stored plaintext in a real system —
    // here we store it for display purposes since there's no encryption layer yet)
    const secret = withSecret ? randomBytes(24).toString("base64url") : null

    const { data, error } = await ctx.supabase
      .from(TABLE)
      .insert({
        workspace_id: ctx.workspaceId!,
        url: webhookUrl,
        description: description ?? null,
        event_types,
        secret_token: secret,
        enabled: true,
        created_by: ctx.userId,
      })
      .select("id, url, description, event_types, enabled, last_triggered_at, created_at")
      .single()
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, webhook: data, secret }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/outbound-webhooks:POST", requestId })
    return NextResponse.json({ error: "Couldn't create the webhook.", requestId }, { status: 500 })
  }
}

// PATCH — update url / description / event_types / enabled
export async function PATCH(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = updateSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "A webhook id is required." }, { status: 400 })
    const { workspaceId, id, ...updates } = parsed.data

    const g = await gatedCtx(workspaceId)
    if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status })
    const { ctx } = g

    const { error } = await ctx.supabase
      .from(TABLE)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId!)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/outbound-webhooks:PATCH", requestId })
    return NextResponse.json({ error: "Couldn't update the webhook.", requestId }, { status: 500 })
  }
}

// DELETE — remove a webhook
export async function DELETE(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = deleteSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "A webhook id is required." }, { status: 400 })
    const { workspaceId, id } = parsed.data

    const g = await gatedCtx(workspaceId)
    if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status })
    const { ctx } = g

    const { error } = await ctx.supabase
      .from(TABLE)
      .delete()
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId!)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/outbound-webhooks:DELETE", requestId })
    return NextResponse.json({ error: "Couldn't delete the webhook.", requestId }, { status: 500 })
  }
}

// PUT — send a test POST to the webhook
export async function PUT(request: NextRequest) {
  const requestId = requestIdFrom(request.headers)
  try {
    const parsed = testSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "A webhook id is required." }, { status: 400 })
    const { workspaceId, id } = parsed.data

    const g = await gatedCtx(workspaceId)
    if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status })
    const { ctx } = g

    // Fetch the webhook
    const { data: webhook, error: fetchErr } = await ctx.supabase
      .from(TABLE)
      .select("id, url, secret_token, event_types")
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId!)
      .single()
    if (fetchErr || !webhook) return NextResponse.json({ error: "Webhook not found." }, { status: 404 })

    const payload = {
      event: "test.webhook",
      id: `test_${Date.now()}`,
      workspace_id: ctx.workspaceId,
      timestamp: new Date().toISOString(),
      data: { message: "This is a test event from Propvora." },
    }

    const startMs = Date.now()
    let httpStatus = 0
    let errorMsg: string | null = null
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (webhook.secret_token) headers["X-Propvora-Token"] = webhook.secret_token as string
      const res = await fetch(webhook.url as string, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      })
      httpStatus = res.status
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : "Request failed."
      httpStatus = 0
    }
    const responseMs = Date.now() - startMs

    // Log the test delivery
    await ctx.supabase.from(LOGS_TABLE).insert({
      workspace_id: ctx.workspaceId!,
      webhook_id: id,
      event_type: "test.webhook",
      http_status: httpStatus,
      response_ms: responseMs,
      error_msg: errorMsg,
      payload,
    }).catch(() => {/* non-fatal */})

    return NextResponse.json({
      ok: !errorMsg && httpStatus >= 200 && httpStatus < 300,
      httpStatus,
      responseMs,
      error: errorMsg,
    }, { status: 200 })
  } catch (err) {
    captureException(err, { source: "api/automations/outbound-webhooks:PUT", requestId })
    return NextResponse.json({ error: "Test delivery failed.", requestId }, { status: 500 })
  }
}
