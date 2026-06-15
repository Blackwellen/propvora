import { getMarketplaceAccess } from "@/components/marketplace/server"
import { MarketplaceDetailClient } from "@/components/marketplace/MarketplaceDetailClient"
import { MarketplaceBrowseClient } from "@/components/marketplace/MarketplaceBrowseClient"

/* ──────────────────────────────────────────────────────────────────────────
   Marketplace — LISTING DETAIL (server component).

   Resolves entitlement server-side. Browsing-entitled workspaces get the full
   detail surface (media gallery, price, seller trust, non-destructive CTA);
   non-entitled workspaces fall through to the gated browse shell rather than a
   raw 403, keeping the upgrade path discoverable.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

export default async function MarketplaceListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const access = await getMarketplaceAccess()

  if (!access.canBrowse) {
    return (
      <MarketplaceBrowseClient
        canBrowse={false}
        canPublish={access.canPublish}
        planName={access.planName}
        defaultCountry={access.defaultCountry}
      />
    )
  }

  return <MarketplaceDetailClient listingId={id} />
}
