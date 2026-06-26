import { createOAuthState, resolveWorkspaceId } from "@/lib/integrations/oauth"

export const dynamic = "force-dynamic"

export async function GET() {
  const clientId = process.env.DOCUSIGN_CLIENT_ID
  if (!clientId) {
    return Response.json(
      { error: "DocuSign OAuth not configured. Add DOCUSIGN_CLIENT_ID and DOCUSIGN_CLIENT_SECRET to your environment variables." },
      { status: 503 },
    )
  }

  const workspaceId = await resolveWorkspaceId()
  if (!workspaceId) return Response.json({ error: "Not authenticated." }, { status: 401 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const state = createOAuthState(workspaceId)

  // Use production endpoint; sandbox is account-d.docusign.com
  const baseUrl = process.env.DOCUSIGN_ENV === "sandbox"
    ? "https://account-d.docusign.com"
    : "https://account.docusign.com"

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${appUrl}/api/integrations/docusign/callback`,
    scope: "signature extended",
    state,
  })

  return Response.redirect(`${baseUrl}/oauth/auth?${params.toString()}`)
}
