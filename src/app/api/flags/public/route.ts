import { NextResponse } from "next/server"
import { getGlobalFlags } from "@/lib/flags/public"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Public feature-flag endpoint for unauthenticated marketing chrome (PublicNav).
 * Returns only the coarse, non-sensitive global flags that decide whether the
 * marketplace / direct-booking surfaces are advertised. Defaults OFF.
 */
export async function GET() {
  const flags = await getGlobalFlags([
    "marketplaceEnabled", "directBookingPages", "registrationCustomer", "registrationSupplier",
  ])
  return NextResponse.json(
    {
      marketplace: flags.marketplaceEnabled,
      directBooking: flags.directBookingPages,
      registrationCustomer: flags.registrationCustomer,
      registrationSupplier: flags.registrationSupplier,
    },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } }
  )
}
