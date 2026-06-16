import { getBookingAccess } from "@/components/bookings/server"
import { loadBookingListingsData, loadAttachableProperties } from "@/components/bookings/server-deep"
import { ListingsManagerDeepClient } from "@/components/bookings/ListingsManagerDeepClient"

/* ──────────────────────────────────────────────────────────────────────────
   Bookings → Listings (server component).

   Manage booking_listings — the sellable stay products, separate from property
   records. Resolves workspace + entitlement (gateBookingPages — no flags).
   Gated → upgrade prompt; cold schema → not-ready state.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

export default async function BookingListingsPage() {
  const access = await getBookingAccess()

  if (!access.canManage) {
    return (
      <ListingsManagerDeepClient
        canManage={false}
        ready
        planName={access.planName}
        upgradeReason={access.upgradeReason}
        listings={[]}
        properties={[]}
      />
    )
  }

  const [data, properties] = await Promise.all([
    loadBookingListingsData(access.workspaceId),
    loadAttachableProperties(access.workspaceId),
  ])

  return (
    <ListingsManagerDeepClient
      canManage
      ready={data.ready}
      planName={access.planName}
      upgradeReason={access.upgradeReason}
      listings={data.listings}
      properties={properties}
    />
  )
}
