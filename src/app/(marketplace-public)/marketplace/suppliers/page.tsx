import { publicSearch } from "@/components/marketplace-public/data"
import { PublicSearchClient } from "@/components/marketplace-public/PublicSearchClient"
import { intentByKey } from "@/components/marketplace-public/intent"
import SupplierJoinBanner from "@/features/marketplace/components/sections/SupplierJoinBanner"

export const dynamic = "force-dynamic"

export default async function SuppliersPage() {
  const intent = intentByKey("suppliers")
  const seed = await publicSearch({ page: 1, pageSize: 24, category: intent.category ?? undefined, transactionType: intent.transactionType ?? undefined })
  return (
    <div>
      <SupplierJoinBanner />

      <PublicSearchClient
        intent="suppliers"
        lockIntent
        initialListings={seed.items}
        initialTotal={seed.total}
        heading="Suppliers & trades"
        subheading="Vetted cleaning, gas, electrical and maintenance suppliers. Request a quote in seconds."
      />
    </div>
  )
}
