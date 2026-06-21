import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/webhooks/[id]/deliveries
// Returns the last 10 delivery attempts for a specific webhook endpoint.
// 42P01-tolerant: returns empty array if table doesn't exist.
export const dynamic = "force-dynamic"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Resolve workspace and verify membership
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_workspace_id")
      .eq("id", user.id)
      .maybeSingle()
    const workspaceId = profile?.current_workspace_id as string | null
    if (!workspaceId) return NextResponse.json({ error: "No active workspace." }, { status: 400 })

    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Verify the endpoint belongs to this workspace
    try {
      const { data: endpoint, error: endpointErr } = await supabase
        .from("webhook_endpoints")
        .select("id")
        .eq("id", id)
        .eq("workspace_id", workspaceId)
        .maybeSingle()

      if (endpointErr?.code === "42P01") {
        return NextResponse.json({ ok: true, deliveries: [], migrationRequired: true }, { status: 200 })
      }
      if (!endpoint) {
        return NextResponse.json({ error: "Webhook endpoint not found." }, { status: 404 })
      }
    } catch {
      return NextResponse.json({ ok: true, deliveries: [] }, { status: 200 })
    }

    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "10", 10), 50)

    try {
      const { data, error } = await supabase
        .from("webhook_deliveries")
        .select("id, event_type, payload, response_code, response_body, latency_ms, retry_count, delivered_at")
        .eq("endpoint_id", id)
        .order("delivered_at", { ascending: false })
        .limit(limit)

      if (error?.code === "42P01") {
        return NextResponse.json({ ok: true, deliveries: [], migrationRequired: true }, { status: 200 })
      }
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      return NextResponse.json({ ok: true, deliveries: data ?? [] }, { status: 200 })
    } catch {
      return NextResponse.json({ ok: true, deliveries: [] }, { status: 200 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `Failed to load deliveries: ${msg}` }, { status: 500 })
  }
}
