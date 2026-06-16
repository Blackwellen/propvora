import { getBookingAccess, loadBookingsData } from "@/components/bookings/server"
import { ReservationsRegisterClient } from "@/components/bookings/ReservationsRegisterClient"

/* ──────────────────────────────────────────────────────────────────────────
   Bookings → Reservations register (server component).

   Resolves workspace + entitlement (gateBookingPages — no flags), loads the
   real reservation dataset from `bookings`, and renders the 10-view register.
   Gated → upgrade prompt; cold schema → not-ready state.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

export default async function ReservationsRegisterPage() {
  const access = await getBookingAccess()
  const data = access.canManage
    ? await loadBookingsData(access.workspaceId)
    : { ready: true, bookings: [], listings: [] }

  return (
    <ReservationsRegisterClient
      canManage={access.canManage}
      ready={data.ready}
      planName={access.planName}
      upgradeReason={access.upgradeReason}
      bookings={data.bookings}
      listings={data.listings}
    />
  )
}
