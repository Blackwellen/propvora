import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const schema = z.object({ provider: z.string().min(1).max(80) })

interface OAuthConfig {
  type: "oauth"
  access_token: string
  refresh_token?: string | null
  expires_at?: string | null
  account_label?: string | null
}

interface ApiKeyConfig {
  type?: "api_key"
  api_key?: string
}

type IntegrationConfig = OAuthConfig | ApiKeyConfig

async function testOAuthProvider(provider: string, config: OAuthConfig): Promise<{ ok: boolean; detail: string }> {
  const token = config.access_token
  if (!token) return { ok: false, detail: "No access token stored" }

  const testEndpoints: Record<string, { url: string; label: string }> = {
    xero: { url: "https://api.xero.com/connections", label: "Xero connections" },
    quickbooks: { url: "https://accounts.platform.intuit.com/v1/openid_connect/userinfo", label: "QuickBooks userinfo" },
    freeagent: { url: "https://api.freeagent.com/v2/users/me", label: "FreeAgent user" },
    google_calendar: { url: "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1", label: "Google Calendar" },
    google_drive: { url: "https://www.googleapis.com/drive/v3/about?fields=user", label: "Google Drive" },
    outlook: { url: "https://graph.microsoft.com/v1.0/me", label: "Microsoft Graph" },
    slack: { url: "https://slack.com/api/auth.test", label: "Slack" },
    docusign: { url: "https://account.docusign.com/oauth/userinfo", label: "DocuSign" },
    stripe: { url: "https://api.stripe.com/v1/account", label: "Stripe" },
  }

  const endpoint = testEndpoints[provider]
  if (!endpoint) return { ok: true, detail: "No test endpoint defined — assuming connected" }

  try {
    const headers: Record<string, string> = provider === "stripe"
      ? { Authorization: `Bearer ${token}` }
      : { Authorization: `Bearer ${token}` }

    const res = await fetch(endpoint.url, { headers })
    if (res.ok) return { ok: true, detail: `${endpoint.label} responded successfully` }
    if (res.status === 401) return { ok: false, detail: "Token expired or revoked — reconnect required" }
    return { ok: false, detail: `${endpoint.label} returned HTTP ${res.status}` }
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "Network error" }
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body: unknown = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "provider is required" }, { status: 400 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id")
    .eq("id", user.id)
    .maybeSingle()
  const workspaceId = profile?.current_workspace_id as string | null
  if (!workspaceId) return NextResponse.json({ error: "No active workspace" }, { status: 400 })

  const { data: integration } = await supabase
    .from("automation_integrations")
    .select("status, config, secret_ref")
    .eq("workspace_id", workspaceId)
    .eq("provider", parsed.data.provider)
    .maybeSingle()

  if (!integration) {
    return NextResponse.json({ ok: false, detail: "Integration not connected" })
  }

  const config = (integration.config as IntegrationConfig | null)

  if (config && (config as OAuthConfig).type === "oauth") {
    const result = await testOAuthProvider(parsed.data.provider, config as OAuthConfig)

    // Update health based on test result
    await supabase
      .from("automation_integrations")
      .update({
        health: result.ok ? "healthy" : "error",
        last_sync: result.ok ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", workspaceId)
      .eq("provider", parsed.data.provider)

    return NextResponse.json(result)
  }

  // API key integrations: just check if a key is present
  if (integration.secret_ref) {
    return NextResponse.json({ ok: true, detail: "API key configured" })
  }

  return NextResponse.json({ ok: false, detail: "No credentials stored" })
}
