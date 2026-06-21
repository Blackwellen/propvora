// GoCardless uses API keys rather than OAuth, but this route provides a
// guided setup page redirect for better UX.
export const dynamic = "force-dynamic"

export async function GET() {
  const configured = !!process.env.GOCARDLESS_ACCESS_TOKEN
  if (configured) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
    return Response.redirect(`${appUrl}/property-manager/automations?integration=gocardless&status=already_configured`)
  }
  return Response.json(
    {
      message: "GoCardless uses API key authentication.",
      instructions: "Create an access token at https://manage.gocardless.com/developers/access-tokens and add it as GOCARDLESS_ACCESS_TOKEN in your environment.",
    },
    { status: 200 },
  )
}
