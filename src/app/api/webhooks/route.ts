import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { randomBytes } from "node:crypto"
import { createClient } from "@/lib/supabase/server"

// GET  /api/webhooks  — list outbound webhook endpoints for the workspace
// POST /api/webhooks  — create a new outbound webhook endpoint
// 42P01-tolerant: if webhook_endpoints table doesn't exist, returns empty list.
export const dynamic = "force-dynamic"

const WEBHOOK_EVENTS = [
  "rent.received",
  "job.created",
  "job.completed",
  "tenancy.started",
  "tenancy.ending",
  "certificate.expiring",
  "payment.failed",
  "booking.confirmed",
] as const

const postSchema = z.object({
  url: z.string().url().refine((u) => u.startsWith("https://"), { message: "Webhook URL must use HTTPS." }),
  events: z.array(z.string()).min(1, "Select at least one event."),
  workspaceId: z.string().uuid().optional(),
})

async function resolveWorkspace(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, bodyWsId?: string) {
  let workspaceId = bodyWsId ?? null
  if (!workspaceId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", userId)
      .maybeSingle()
    workspaceId = (profile?.current_workspace_id as string | null) ?? null
  }
  return workspaceId
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    const wsId = url.searchParams.get("workspaceId") ?? undefined
    const workspaceId = await resolveWorkspace(supabase, user.id, wsId)
    if (!workspaceId) return NextResponse.json({ error: "No active workspace." }, { status: 400 })

    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    try {
      const { data, error } = await supabase
        .from("webhook_endpoints")
        .select("id, url, events, status, last_delivery_at, created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })

      if (error?.code === "42P01") {
        return NextResponse.json({ ok: true, endpoints: [], migrationRequired: true }, { status: 200 })
      }
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      return NextResponse.json({ ok: true, endpoints: data ?? [] }, { status: 200 })
    } catch (dbErr) {
      const msg = dbErr instanceof Error ? dbErr.message : ""
      if (msg.includes("42P01")) return NextResponse.json({ ok: true, endpoints: [], migrationRequired: true }, { status: 200 })
      throw dbErr
    }
  } catch (err) {
    return NextResponse.json({ error: "Failed to load webhooks." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid request."
      return NextResponse.json({ error: firstError }, { status: 400 })
    }
    const { url, events, workspaceId: bodyWsId } = parsed.data

    // Validate all events are known
    const knownEvents = new Set<string>(WEBHOOK_EVENTS)
    const unknownEvents = events.filter((e) => !knownEvents.has(e))
    if (unknownEvents.length > 0) {
      return NextResponse.json({ error: `Unknown event types: ${unknownEvents.join(", ")}` }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const workspaceId = await resolveWorkspace(supabase, user.id, bodyWsId)
    if (!workspaceId) return NextResponse.json({ error: "No active workspace." }, { status: 400 })

    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Generate a cryptographically secure secret (shown ONCE, never stored in plaintext)
    const secret = randomBytes(32).toString("hex")

    try {
      const { data, error } = await supabase
        .from("webhook_endpoints")
        .insert({
          workspace_id: workspaceId,
          url,
          secret, // V1: stored as-is; V2: hash only, return secret once
          events,
          status: "active",
        })
        .select("id, url, events, status, created_at")
        .single()

      if (error?.code === "42P01") {
        return NextResponse.json(
          { error: "Webhook endpoints table not yet set up. Apply the database migration first.", migrationRequired: true },
          { status: 503 },
        )
      }
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Return the secret ONCE — it is not retrievable after this response
      return NextResponse.json({ ok: true, endpoint: data, secret }, { status: 200 })
    } catch (dbErr) {
      const msg = dbErr instanceof Error ? dbErr.message : ""
      if (msg.includes("42P01")) {
        return NextResponse.json({ error: "Migration required.", migrationRequired: true }, { status: 503 })
      }
      throw dbErr
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `Failed to create webhook: ${msg}` }, { status: 500 })
  }
}
