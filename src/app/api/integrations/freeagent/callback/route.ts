import { parseOAuthState, exchangeCodeBasicAuth, storeTokens, oauthErrorRedirect, oauthSuccessRedirect } from "@/lib/integrations/oauth"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) return oauthErrorRedirect(appUrl, "freeagent", error)
  if (!code || !state) return oauthErrorRedirect(appUrl, "freeagent", "missing_code_or_state")

  const parsed = parseOAuthState(state)
  if (!parsed) return oauthErrorRedirect(appUrl, "freeagent", "invalid_state")

  const clientId = process.env.FREEAGENT_CLIENT_ID
  const clientSecret = process.env.FREEAGENT_CLIENT_SECRET
  if (!clientId || !clientSecret) return oauthErrorRedirect(appUrl, "freeagent", "not_configured")

  try {
    const tokens = await exchangeCodeBasicAuth({
      tokenUrl: "https://api.freeagent.com/v2/token_endpoint",
      code,
      redirectUri: `${appUrl}/api/integrations/freeagent/callback`,
      clientId,
      clientSecret,
    })

    // Get the connected account's company name
    let accountLabel = "FreeAgent"
    try {
      const meRes = await fetch("https://api.freeagent.com/v2/company", {
        headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/json" },
      })
      if (meRes.ok) {
        const data = await meRes.json() as { company?: { name?: string } }
        if (data.company?.name) accountLabel = data.company.name
      }
    } catch { /* non-critical */ }

    await storeTokens({
      workspaceId: parsed.workspaceId,
      provider: "freeagent",
      category: "accounting",
      name: `FreeAgent — ${accountLabel}`,
      tokens,
      accountLabel,
    })

    return oauthSuccessRedirect(appUrl, "freeagent")
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown_error"
    return oauthErrorRedirect(appUrl, "freeagent", msg)
  }
}
