import { getMarketplaceAccess } from "@/components/marketplace/server"
import { MarketplaceBrowseClient } from "@/components/marketplace/MarketplaceBrowseClient"

export const dynamic = "force-dynamic"

export default async function MarketplaceSuppliersPage() {
  const access = await getMarketplaceAccess()
  return (
    <MarketplaceBrowseClient
      canBrowse={access.canBrowse}
      canPublish={access.canPublish}
      planName={access.planName}
      defaultCountry={access.defaultCountry}
      initialCategory="suppliers"
      lockCategory
      title="Suppliers & trades"
      description="Vetted cleaning, gas, electrical and maintenance suppliers across Propvora"
    />
  )
}
