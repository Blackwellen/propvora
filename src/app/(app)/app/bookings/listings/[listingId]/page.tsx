import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { getBookingAccess } from "@/components/bookings/server"
import { loadListingDetail, loadAttachableProperties } from "@/components/bookings/server-deep"
import { ListingDetailClient } from "@/components/bookings/listing-detail/ListingDetailClient"
import { BookingUpgradePrompt, BookingNotReady } from "@/components/bookings/primitives"
import { createClient } from "@/lib/supabase/server"
import type { BookingRow } from "@/components/bookings/server"

/* ──────────────────────────────────────────────────────────────────────────
   Bookings → Listing detail — 19-tab management view (server component).

   Loads the full listing detail bundle (photos, pricing, readiness,
   accommodation, amenities, keyless lock) plus the listing's own bookings,
   and renders the 19-tab ListingDetailClient. Workspace-scoped throughout.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

async function loadListingBookings(
  workspaceId: string,
  listingId: string
): Promise<BookingRow[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("booking_listing_id", listingId)
      .order("check_in", { ascending: false })
      .limit(100)
    if (error || !Array.isArray(data)) return []
    return (data as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      reference: String(r.id).slice(0, 8).toUpperCase(),
      listingId: (r.booking_listing_id as string) ?? (r.listing_id as string) ?? null,
      listingTitle: "Listing",
      guestName: (r.guest_name as string) ?? "Guest",
      guestEmail: (r.guest_email as string) ?? null,
      checkIn: (r.check_in as string) ?? null,
      checkOut: (r.check_out as string) ?? null,
      nights: Number(r.nights) || 0,
      guests: Number(r.guests_count) || 1,
      status: (r.status as BookingRow["status"]) ?? "pending",
      subtotalPence: Number(r.subtotal_pence) || 0,
      feesPence: Number(r.fees_pence) || 0,
      totalPence: Number(r.total_pence) || 0,
      currency: (r.currency as string) ?? "GBP",
      amountPaidPence: 0,
      source: (r.source as string) ?? "direct",
      createdAt: (r.created_at as string) ?? null,
    }))
  } catch {
    return []
  }
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ listingId: string }>
}) {
  const { listingId } = await params
  const access = await getBookingAccess()

  if (!access.canManage) {
    return (
      <DashboardContainer>
        <MobileTopBar title="Listing" subtitle="Booking management" showBack backHref="/property-manager/bookings/listings" />
        <div className="px-4 md:px-6 py-4 md:py-6">
          <BookingUpgradePrompt planName={access.planName} reason={access.upgradeReason} />
        </div>
      </DashboardContainer>
    )
  }

  const [detail, bookings] = await Promise.all([
    loadListingDetail(access.workspaceId, listingId),
    access.workspaceId
      ? loadListingBookings(access.workspaceId, listingId)
      : Promise.resolve([]),
  ])

  if (!detail.listing) {
    return (
      <DashboardContainer>
        <MobileTopBar title="Listing" subtitle={listingId.slice(0, 8)} showBack backHref="/property-manager/bookings/listings" />
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
    <ListingDetailClient
      listing={detail.listing}
      photos={detail.photos}
      pricing={detail.pricing}
      readiness={detail.readiness}
      accommodation={detail.accommodation}
      amenityCatalogue={detail.amenityCatalogue}
      selectedAmenitySlugs={detail.selectedAmenitySlugs}
      keylessLock={detail.keylessLock}
      bookings={bookings}
    />
  )
}
