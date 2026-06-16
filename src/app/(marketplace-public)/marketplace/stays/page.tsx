import { publicSearch } from "@/components/marketplace-public/data"
import { PublicSearchClient } from "@/components/marketplace-public/PublicSearchClient"
import { intentByKey } from "@/components/marketplace-public/intent"

export const dynamic = "force-dynamic"

export default async function StaysPage() {
  const intent = intentByKey("stays")
  const seed = await publicSearch({ page: 1, pageSize: 24, category: intent.category ?? undefined, transactionType: intent.transactionType ?? undefined })
  return (
    <PublicSearchClient
      intent="stays"
      lockIntent
      initialListings={seed.items}
      initialTotal={seed.total}
      heading="Stays & serviced accommodation"
      subheading="Short lets, serviced apartments and mid-term stays — book directly with escrow protection."
    />
  )
}
