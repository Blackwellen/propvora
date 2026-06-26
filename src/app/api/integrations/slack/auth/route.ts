import { createOAuthState, resolveWorkspaceId } from "@/lib/integrations/oauth"

export const dynamic = "force-dynamic"

export async function GET() {
  const clientId = process.env.SLACK_CLIENT_ID
  if (!clientId) {
    return Response.json(
      { error: "Slack OAuth not configured. Add SLACK_CLIENT_ID and SLACK_CLIENT_SECRET to your environment variables." },
      { status: 503 },
    )
  }

  const workspaceId = await resolveWorkspaceId()
  if (!workspaceId) return Response.json({ error: "Not authenticated." }, { status: 401 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const state = createOAuthState(workspaceId)

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/api/integrations/slack/callback`,
    scope: "incoming-webhook,chat:write,channels:read,channels:history,users:read",
    state,
  })

  return Response.redirect(`https://slack.com/oauth/v2/authorize?${params.toString()}`)
}
