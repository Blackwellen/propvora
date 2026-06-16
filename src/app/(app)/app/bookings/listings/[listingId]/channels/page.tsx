import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { getBookingAccess } from "@/components/bookings/server"
import { loadListingDetail } from "@/components/bookings/server-deep"
import { BookingUpgradePrompt, BookingNotReady } from "@/components/bookings/primitives"
import ChannelSyncManager from "@/components/bookings/ChannelSyncManager"

/* ──────────────────────────────────────────────────────────────────────────
   Bookings → Listing → Channel sync (server component).

   Renders the iCal channel-sync control panel for one booking_listing. Reuses
   the bookings module's READ-ONLY access + detail loaders (no edits to the
   bookings agent's server.ts / actions / BookingCalendar). The manager itself
   talks only to the /api/booking/ical/* routes.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

export default async function ListingChannelsPage({
  params,
}: {
  params: Promise<{ listingId: string }>
}) {
  const { listingId } = await params
  const access = await getBookingAccess()

  if (!access.canManage) {
    return (
      <DashboardContainer>
        <MobileTopBar title="Channel sync" subtitle="Booking management" showBack backHref={`/app/bookings/listings/${listingId}`} />
        <div className="px-4 md:px-6 py-4 md:py-6">
          <BookingUpgradePrompt planName={access.planName} reason={access.upgradeReason} />
        </div>
      </DashboardContainer>
    )
  }

  const detail = await loadListingDetail(access.workspaceId, listingId)

  if (!detail.listing) {
    return (
      <DashboardContainer>
        <MobileTopBar title="Channel sync" subtitle={listingId.slice(0, 8)} showBack backHref={`/app/bookings/listings/${listingId}`} />
        <div className="px-4 md:px-6 py-4 md:py-6">
          <BookingNotReady
            title="Listing not found"
            description="This booking listing couldn't be loaded. It may have been removed, or isn't in your workspace."
          />
        </div>
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer>
      <MobileTopBar
        title="Channel sync"
        subtitle={detail.listing.title ?? "Listing"}
        showBack
        backHref={`/app/bookings/listings/${listingId}`}
      />
      <div className="px-4 md:px-6 py-4 md:py-6 max-w-3xl">
        <ChannelSyncManager listingId={listingId} listingTitle={detail.listing.title ?? undefined} />
      </div>
    </DashboardContainer>
  )
}
