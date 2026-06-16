import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { getBookingAccess, loadBooking } from "@/components/bookings/server"
import { ReservationDetailClient } from "@/components/bookings/ReservationDetailClient"
import { BookingUpgradePrompt, BookingNotReady } from "@/components/bookings/primitives"
import { BookingSectionClient } from "@/components/bookings/BookingSectionClient"
import { BOOKING_SECTION_KEYS, type BookingSectionKey } from "@/components/bookings/module"
import { loadBookingsData } from "@/components/bookings/server"

/* ──────────────────────────────────────────────────────────────────────────
   Reservation detail (server component).

   Re-resolves workspace + booking entitlement, loads the reservation
   tolerantly, and renders the interactive detail island. Gated → upgrade
   prompt; not found / not provisioned → premium not-ready state.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const access = await getBookingAccess()

  if (BOOKING_SECTION_KEYS.has(id as BookingSectionKey)) {
    const data = access.canManage
      ? await loadBookingsData(access.workspaceId)
      : { ready: true, bookings: [], listings: [] }

    return (
      <BookingSectionClient
        section={id as BookingSectionKey}
        canManage={access.canManage}
        ready={data.ready}
        planName={access.planName}
        upgradeReason={access.upgradeReason}
        bookings={data.bookings}
        listings={data.listings}
      />
    )
  }

  if (!access.canManage) {
    return (
      <DashboardContainer>
        <MobileTopBar title="Reservation" subtitle="Booking management" showBack backHref="/app/bookings" />
        <div className="px-4 md:px-6 py-4 md:py-6">
          <BookingUpgradePrompt planName={access.planName} reason={access.upgradeReason} />
        </div>
      </DashboardContainer>
    )
  }

  const booking = await loadBooking(access.workspaceId, id)

  if (!booking) {
    return (
      <DashboardContainer>
        <MobileTopBar title="Reservation" subtitle={id.slice(0, 8)} showBack backHref="/app/bookings" />
        <div className="px-4 md:px-6 py-4 md:py-6 space-y-4">
          <Link
            href="/app/bookings"
            className="hidden md:inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Bookings
          </Link>
          <BookingNotReady
            title="Reservation not found"
            description="This reservation couldn't be loaded. It may have been removed, or the reservations engine isn't provisioned for this workspace yet."
          />
        </div>
      </DashboardContainer>
    )
  }

  return <ReservationDetailClient booking={booking} />
}
