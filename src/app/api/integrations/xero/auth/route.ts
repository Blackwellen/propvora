// OAuth initiation for Xero. Redirects to Xero's authorisation server when
// XERO_CLIENT_ID is configured, or returns a 503 with a clear message if not.
export const dynamic = "force-dynamic"

export async function GET() {
  const clientId = process.env.XERO_CLIENT_ID
  if (!clientId) {
    return Response.json(
      { error: "Xero OAuth not configured. Set XERO_CLIENT_ID and XERO_CLIENT_SECRET in your environment variables." },
      { status: 503 },
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${appUrl}/api/integrations/xero/callback`,
    scope: "openid profile email accounting.transactions accounting.contacts offline_access",
    state: crypto.randomUUID(),
  })

  return Response.redirect(`https://login.xero.com/identity/connect/authorize?${params.toString()}`)
}
