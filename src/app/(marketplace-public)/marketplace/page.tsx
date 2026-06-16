import { publicSearch } from "@/components/marketplace-public/data"
import { PublicSearchClient } from "@/components/marketplace-public/PublicSearchClient"

/* Marketplace DISCOVER hub (public, anon-readable). Server-renders the first
   page of real published listings for SEO + fast first paint, then hands off to
   the interactive search island. */

export const dynamic = "force-dynamic"

export default async function MarketplaceDiscoverPage() {
  const seed = await publicSearch({ page: 1, pageSize: 24 })
  return (
    <PublicSearchClient
      intent="all"
      initialListings={seed.items}
      initialTotal={seed.total}
      heading="The property marketplace"
      subheading="Stays, vetted suppliers, emergency call-outs and service packages — all in one place."
    />
  )
}
