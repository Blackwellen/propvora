import {
  getBookingAccess,
  loadBookingsData,
  loadRatePlans,
} from "@/components/bookings/server"
import { ListingsManagerClient } from "@/components/bookings/ListingsManagerClient"

/* ──────────────────────────────────────────────────────────────────────────
   Bookings → Listings (server component).

   Manage per-listing rate plans (nightly rate, min/max nights, weekend uplift)
   and availability / blocked dates for stay-booking listings. Resolves
   workspace + entitlement (gateBookingPages — no flags); gated workspaces see a
   premium upgrade prompt, an unprovisioned schema shows a not-ready state.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

export default async function BookingListingsPage() {
  const access = await getBookingAccess()

  if (!access.canManage) {
    return (
      <ListingsManagerClient
        canManage={false}
        ready
        planName={access.planName}
        upgradeReason={access.upgradeReason}
        listings={[]}
        ratePlans={[]}
      />
    )
  }

  const data = await loadBookingsData(access.workspaceId)
  const rates = await loadRatePlans(access.workspaceId, data.listings)

  return (
    <ListingsManagerClient
      canManage
      ready={data.ready && rates.ready}
      planName={access.planName}
      upgradeReason={access.upgradeReason}
      listings={data.listings}
      ratePlans={rates.plans}
    />
  )
}
