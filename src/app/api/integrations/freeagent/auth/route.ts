import { createOAuthState, resolveWorkspaceId } from "@/lib/integrations/oauth"

export const dynamic = "force-dynamic"

export async function GET() {
  const clientId = process.env.FREEAGENT_CLIENT_ID
  if (!clientId) {
    return Response.json(
      { error: "FreeAgent OAuth not configured. Add FREEAGENT_CLIENT_ID and FREEAGENT_CLIENT_SECRET to your environment variables." },
      { status: 503 },
    )
  }

  const workspaceId = await resolveWorkspaceId()
  if (!workspaceId) return Response.json({ error: "Not authenticated." }, { status: 401 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const state = createOAuthState(workspaceId)

  // FreeAgent uses a custom OAuth endpoint
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${appUrl}/api/integrations/freeagent/callback`,
    state,
  })

  return Response.redirect(`https://api.freeagent.com/v2/approve_app?${params.toString()}`)
}
