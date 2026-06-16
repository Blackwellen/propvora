import { createClient } from "@/lib/supabase/server"
import { getMarketplaceAccess } from "@/components/marketplace/server"
import { getSuppliersByIds } from "@/lib/marketplace/suppliers"
import { SupplierCompare } from "@/components/suppliers/SupplierCompare"

/* ──────────────────────────────────────────────────────────────────────────
   Supplier COMPARE — side-by-side comparison of up to 4 selected suppliers.
   Ids arrive via ?ids=a,b,c. Real data via getSuppliersByIds (the same enriched
   supplier substrate as the directory). Entitlement-gated like the directory.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

export default async function SupplierComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const { ids: idsRaw } = await searchParams
  const access = await getMarketplaceAccess()

  const ids = (idsRaw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4)

  let suppliers: Awaited<ReturnType<typeof getSuppliersByIds>> = []
  if (access.canBrowse && ids.length > 0) {
    const supabase = await createClient()
    suppliers = await getSuppliersByIds(supabase, ids)
  }

  return <SupplierCompare suppliers={suppliers} />
}
