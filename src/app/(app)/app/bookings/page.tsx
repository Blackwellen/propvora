import { getBookingAccess, loadBookingsData } from "@/components/bookings/server"
import { BookingsOverviewClient } from "@/components/bookings/BookingsOverviewClient"

/* ──────────────────────────────────────────────────────────────────────────
   Bookings — OVERVIEW (server component).

   Resolves the active workspace + booking entitlement server-side via
   `getBookingAccess` (gateBookingPages — no feature flags), then loads the
   tolerant bookings dataset and hands it to the interactive client island.
   When the workspace isn't entitled the island renders a premium upgrade
   prompt; when the booking schema isn't provisioned yet it renders a not-ready
   state. Never hidden, never crashed.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

export default async function BookingsPage() {
  const access = await getBookingAccess()
  const data = access.canManage
    ? await loadBookingsData(access.workspaceId)
    : { ready: true, bookings: [], listings: [] }

  return (
    <BookingsOverviewClient
      canManage={access.canManage}
      ready={data.ready}
      planName={access.planName}
      upgradeReason={access.upgradeReason}
      bookings={data.bookings}
      listings={data.listings}
    />
  )
}
