import { publicSearch } from "@/components/marketplace-public/data"
import { PublicSearchClient } from "@/components/marketplace-public/PublicSearchClient"
import { intentByKey } from "@/components/marketplace-public/intent"

export const dynamic = "force-dynamic"

export default async function ServicesPage() {
  const intent = intentByKey("services")
  const seed = await publicSearch({ page: 1, pageSize: 24, category: intent.category ?? undefined, transactionType: intent.transactionType ?? undefined })
  return (
    <PublicSearchClient
      intent="services"
      lockIntent
      initialListings={seed.items}
      initialTotal={seed.total}
      heading="Service packages"
      subheading="Inventory reports, compliance services and professional packages — book and pay securely."
    />
  )
}
