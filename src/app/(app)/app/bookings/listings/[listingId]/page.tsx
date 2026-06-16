import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { getBookingAccess } from "@/components/bookings/server"
import { loadListingDetail, loadAttachableProperties } from "@/components/bookings/server-deep"
import { ListingWizardClient } from "@/components/bookings/ListingWizardClient"
import { BookingUpgradePrompt, BookingNotReady } from "@/components/bookings/primitives"

/* ──────────────────────────────────────────────────────────────────────────
   Bookings → Listing setup wizard (server component).

   Loads a single booking_listing with its photos, active pricing profile and
   publish readiness, plus the attachable properties, and renders the wizard.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

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
        <MobileTopBar title="Listing" subtitle="Booking management" showBack backHref="/app/bookings/listings" />
        <div className="px-4 md:px-6 py-4 md:py-6">
          <BookingUpgradePrompt planName={access.planName} reason={access.upgradeReason} />
        </div>
      </DashboardContainer>
    )
  }

  const [detail, properties] = await Promise.all([
    loadListingDetail(access.workspaceId, listingId),
    loadAttachableProperties(access.workspaceId),
  ])

  if (!detail.listing) {
    return (
      <DashboardContainer>
        <MobileTopBar title="Listing" subtitle={listingId.slice(0, 8)} showBack backHref="/app/bookings/listings" />
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
    <ListingWizardClient
      listing={detail.listing}
      photos={detail.photos}
      pricing={detail.pricing}
      readiness={detail.readiness}
      properties={properties}
      accommodation={
        detail.accommodation ?? {
          accommodationCategory: "short_stay",
          letType: "entire",
          typeDetails: {
            wifiName: null,
            wifiPassword: null,
            checkInMethod: null,
            minNights: null,
            maxNights: null,
            tenancyLengthMonths: null,
            furnished: null,
            billsIncluded: {},
            depositPence: null,
            depositScheme: null,
            depositDeclaration: null,
            availableFrom: null,
            epcRating: null,
            councilTaxBand: null,
            floorPlanUrl: null,
            roomSizeSqm: null,
            ensuite: null,
            sharedFacilities: {},
            householdSize: null,
            contractLengthMonths: null,
          },
          rawTypeDetails: {},
        }
      }
      amenityCatalogue={detail.amenityCatalogue}
      selectedAmenitySlugs={detail.selectedAmenitySlugs}
      keylessLock={detail.keylessLock}
    />
  )
}
