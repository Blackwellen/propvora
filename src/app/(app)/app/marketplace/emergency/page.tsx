import { getMarketplaceAccess } from "@/components/marketplace/server"
import { MarketplaceBrowseClient } from "@/components/marketplace/MarketplaceBrowseClient"

export const dynamic = "force-dynamic"

export default async function MarketplaceEmergencyPage() {
  const access = await getMarketplaceAccess()
  return (
    <MarketplaceBrowseClient
      canBrowse={access.canBrowse}
      canPublish={access.canPublish}
      planName={access.planName}
      defaultCountry={access.defaultCountry}
      initialCategory="emergency"
      lockCategory
      title="Emergency call-outs"
      description="Urgent trades ready to respond now across your coverage area"
    />
  )
}
