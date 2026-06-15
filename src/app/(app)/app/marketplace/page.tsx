import { getMarketplaceAccess } from "@/components/marketplace/server"
import { MarketplaceBrowseClient } from "@/components/marketplace/MarketplaceBrowseClient"

/* ──────────────────────────────────────────────────────────────────────────
   Marketplace — BROWSE (server component).

   Resolves the active workspace + marketplace entitlement server-side, then
   hands the result to the interactive client island. Entitlement is enforced
   via the billing gates (marketplaceBrowsing / marketplacePublishing) + the
   workspace type — no feature flags, no client-only gating.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

export default async function MarketplacePage() {
  const access = await getMarketplaceAccess()

  return (
    <MarketplaceBrowseClient
      canBrowse={access.canBrowse}
      canPublish={access.canPublish}
      planName={access.planName}
      defaultCountry={access.defaultCountry}
    />
  )
}
