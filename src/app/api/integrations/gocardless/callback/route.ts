// GoCardless callback placeholder — GoCardless uses API keys not OAuth,
// so this route exists for consistency but is not used in the standard flow.
export const dynamic = "force-dynamic"

export async function GET() {
  return Response.json(
    { message: "GoCardless does not use OAuth callbacks. Configure via API key in the integrations hub." },
    { status: 200 },
  )
}
