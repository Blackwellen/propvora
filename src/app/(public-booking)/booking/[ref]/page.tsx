import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { lookupGuestTrip } from "@/lib/booking"
import GuestPortal from "@/components/booking/GuestPortal"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Manage your booking · Propvora",
  robots: { index: false, follow: false },
}

/**
 * Magic-link guest portal entry: /booking/[ref]?token=…  OR  /booking/[ref]
 * (then ref + email gate).
 *
 * When a token is present we resolve the trip SERVER-SIDE via the SECURITY
 * DEFINER `booking_portal_lookup` RPC and hydrate the client with it — the guest
 * is anonymous and never reads `bookings` directly. Without a token (or if the
 * token is invalid) the client renders the ref+email gate.
 */
export default async function GuestBookingPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { ref } = await params
  const { token } = await searchParams

  let initialTrip = null
  if (token) {
    const supabase = await createClient()
    initialTrip = await lookupGuestTrip(supabase, { token })
  }

  return (
    <GuestPortal
      initialTrip={initialTrip}
      refParam={decodeURIComponent(ref ?? "")}
      token={token ?? null}
    />
  )
}
