import { parseOAuthState, storeTokens, oauthErrorRedirect, oauthSuccessRedirect } from "@/lib/integrations/oauth"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) return oauthErrorRedirect(appUrl, "slack", error)
  if (!code || !state) return oauthErrorRedirect(appUrl, "slack", "missing_code_or_state")

  const parsed = parseOAuthState(state)
  if (!parsed) return oauthErrorRedirect(appUrl, "slack", "invalid_state")

  const clientId = process.env.SLACK_CLIENT_ID
  const clientSecret = process.env.SLACK_CLIENT_SECRET
  if (!clientId || !clientSecret) return oauthErrorRedirect(appUrl, "slack", "not_configured")

  try {
    // Slack uses POST to oauth.v2.access with client credentials in body
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${appUrl}/api/integrations/slack/callback`,
    })
    const res = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })
    if (!res.ok) throw new Error(`Slack token exchange HTTP ${res.status}`)

    const data = await res.json() as {
      ok: boolean
      error?: string
      access_token?: string
      token_type?: string
      scope?: string
      team?: { id?: string; name?: string }
      incoming_webhook?: { url?: string; channel?: string }
    }

    if (!data.ok || !data.access_token) {
      return oauthErrorRedirect(appUrl, "slack", data.error ?? "token_exchange_failed")
    }

    const teamName = data.team?.name ?? "Slack workspace"

    await storeTokens({
      workspaceId: parsed.workspaceId,
      provider: "slack",
      category: "communications",
      name: `Slack — ${teamName}`,
      tokens: {
        access_token: data.access_token,
        token_type: data.token_type,
        scope: data.scope,
        extra: {
          team_id: data.team?.id,
          team_name: data.team?.name,
          webhook_url: data.incoming_webhook?.url,
          webhook_channel: data.incoming_webhook?.channel,
        },
      },
      accountLabel: teamName,
    })

    return oauthSuccessRedirect(appUrl, "slack")
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown_error"
    return oauthErrorRedirect(appUrl, "slack", msg)
  }
}
