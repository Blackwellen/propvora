import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/webhooks/[id]/test
// Sends a test ping payload to the configured webhook URL and reports the result.
export const dynamic = "force-dynamic"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
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

    // Fetch the webhook endpoint (42P01-tolerant)
    let endpointUrl: string | null = null
    try {
      const { data: endpoint, error } = await supabase
        .from("webhook_endpoints")
        .select("url, status")
        .eq("id", id)
        .eq("workspace_id", workspaceId)
        .single()

      if (error?.code === "42P01") {
        return NextResponse.json({ error: "Webhook table not set up yet." }, { status: 503 })
      }
      if (error || !endpoint) {
        return NextResponse.json({ error: "Webhook endpoint not found." }, { status: 404 })
      }
      endpointUrl = (endpoint as { url: string }).url
    } catch {
      return NextResponse.json({ error: "Could not retrieve webhook endpoint." }, { status: 500 })
    }

    // Build the test payload
    const payload = {
      event: "test.ping",
      timestamp: new Date().toISOString(),
      workspaceId,
      endpointId: id,
      message: "This is a test event from Propvora. If you receive this, your webhook is working correctly.",
    }

    const startMs = Date.now()
    let responseCode: number
    let responseBody: string

    try {
      const res = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Propvora-Webhooks/1.0",
          "X-Propvora-Event": "test.ping",
        },
        body: JSON.stringify(payload),
        // 10 second timeout
        signal: AbortSignal.timeout(10_000),
      })
      responseCode = res.status
      responseBody = await res.text().catch(() => "")
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : "Connection failed"
      return NextResponse.json(
        { ok: false, error: msg, latencyMs: Date.now() - startMs },
        { status: 200 },
      )
    }

    const latencyMs = Date.now() - startMs

    // Record the delivery in webhook_deliveries (best-effort, 42P01-tolerant)
    try {
      await supabase.from("webhook_deliveries").insert({
        endpoint_id: id,
        event_type: "test.ping",
        payload,
        response_code: responseCode,
        response_body: responseBody.slice(0, 2000),
        latency_ms: latencyMs,
        retry_count: 0,
      })
    } catch {
      // Delivery log failure is non-fatal
    }

    return NextResponse.json(
      {
        ok: responseCode >= 200 && responseCode < 300,
        responseCode,
        responseBody: responseBody.slice(0, 500),
        latencyMs,
      },
      { status: 200 },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: `Test failed: ${msg}` }, { status: 500 })
  }
}
