import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { getBookingAccess } from "@/components/bookings/server"
import { loadAttachableProperties } from "@/components/bookings/server-deep"
import { BookingUpgradePrompt } from "@/components/bookings/primitives"
import { NewListingWizardClient } from "@/components/bookings/NewListingWizardClient"

/* ──────────────────────────────────────────────────────────────────────────
   Bookings → New listing wizard (server component).

   Multi-step onboarding for creating a new booking_listing: property type →
   location/property link → rooms/beds → summary → pricing → publish.
   Resolves workspace + entitlement server-side; gated on booking management.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

export default async function NewListingPage() {
  const access = await getBookingAccess()

  if (!access.canManage) {
    return (
      <DashboardContainer>
        <MobileTopBar title="New listing" subtitle="Booking management" showBack backHref="/app/bookings/listings" />
        <div className="px-4 md:px-6 py-4 md:py-6">
          <BookingUpgradePrompt planName={access.planName} reason={access.upgradeReason} />
        </div>
      </DashboardContainer>
    )
  }

  const properties = await loadAttachableProperties(access.workspaceId)

  return (
    <NewListingWizardClient
      properties={properties}
      defaultCountry={access.defaultCountry ?? "GB"}
    />
  )
}
