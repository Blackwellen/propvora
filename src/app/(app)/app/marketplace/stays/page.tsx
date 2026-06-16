import { getMarketplaceAccess } from "@/components/marketplace/server"
import { MarketplaceBrowseClient } from "@/components/marketplace/MarketplaceBrowseClient"

export const dynamic = "force-dynamic"

export default async function MarketplaceStaysPage() {
  const access = await getMarketplaceAccess()
  return (
    <MarketplaceBrowseClient
      canBrowse={access.canBrowse}
      canPublish={access.canPublish}
      planName={access.planName}
      defaultCountry={access.defaultCountry}
      initialCategory="stays"
      lockCategory
      title="Stays & accommodation"
      description="Short lets, serviced accommodation and mid-term stays"
    />
  )
}
