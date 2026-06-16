import { getBookingAccess } from "@/components/bookings/server"
import { loadBookingListingsData, loadCalendarData } from "@/components/bookings/server-deep"
import { BookingCalendarClient } from "@/components/bookings/BookingCalendarClient"

/* ──────────────────────────────────────────────────────────────────────────
   Bookings → Calendar (server component).

   Month availability + pricing grid over the real `booking_availability_days`
   engine, merged with live bookings. Listing + month come from the URL
   (?listing=&month=yyyy-mm-01). Gated → upgrade prompt.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

function monthBounds(monthStart: string): { from: string; to: string } {
  const [y, m] = monthStart.split("-").map(Number)
  const from = `${y}-${String(m).padStart(2, "0")}-01`
  const next = new Date(y, m, 1)
  const to = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`
  return { from, to }
}

function thisMonthStart(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
}

export default async function BookingCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string; month?: string }>
}) {
  const sp = await searchParams
  const access = await getBookingAccess()

  if (!access.canManage) {
    return (
      <BookingCalendarClient
        canManage={false}
        ready
        planName={access.planName}
        upgradeReason={access.upgradeReason}
        listings={[]}
        selectedListingId={null}
        monthStart={thisMonthStart()}
        days={[]}
        basePricePence={null}
        currency="GBP"
      />
    )
  }

  const listingsData = await loadBookingListingsData(access.workspaceId)
  const listings = listingsData.listings.map((l) => ({
    id: l.id,
    title: l.title,
    status: l.status,
    location: l.countryCode,
    currency: l.currency,
    baseNightlyPence: l.basePricePence,
    propertyId: l.propertyId,
  }))

  const monthStart = sp.month && /^\d{4}-\d{2}-01$/.test(sp.month) ? sp.month : thisMonthStart()
  const selectedListingId = sp.listing && listings.some((l) => l.id === sp.listing) ? sp.listing : listings[0]?.id ?? null
  const { from, to } = monthBounds(monthStart)

  const cal = selectedListingId
    ? await loadCalendarData(access.workspaceId, selectedListingId, from, to)
    : { ready: false, days: [], basePricePence: null, currency: "GBP" }

  return (
    <BookingCalendarClient
      canManage
      ready={cal.ready}
      planName={access.planName}
      upgradeReason={access.upgradeReason}
      listings={listings}
      selectedListingId={selectedListingId}
      monthStart={monthStart}
      days={cal.days}
      basePricePence={cal.basePricePence}
      currency={cal.currency}
    />
  )
}
