import { publicSearch } from "@/components/marketplace-public/data"
import { PublicSearchClient } from "@/components/marketplace-public/PublicSearchClient"
import { intentByKey } from "@/components/marketplace-public/intent"

export const dynamic = "force-dynamic"

export default async function EmergencyPage() {
  const intent = intentByKey("emergency")
  const seed = await publicSearch({ page: 1, pageSize: 24, category: intent.category ?? undefined, transactionType: intent.transactionType ?? undefined })
  return (
    <PublicSearchClient
      intent="emergency"
      lockIntent
      initialListings={seed.items}
      initialTotal={seed.total}
      heading="Emergency call-outs"
      subheading="Urgent trades ready to respond now — leaks, lockouts, heating and electrical emergencies."
    />
  )
}
