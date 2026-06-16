import { getMarketplaceAccess } from "@/components/marketplace/server"
import { SupplierDirectoryClient } from "@/components/suppliers/SupplierDirectoryClient"

/* ──────────────────────────────────────────────────────────────────────────
   Operator supplier directory (procurement). The OPERATOR is the buyer who
   browses + procures vetted suppliers. Entitlement is resolved server-side;
   the interactive directory island owns search/filter/compare. Real data via
   /api/marketplace/suppliers → lib/marketplace/suppliers.ts.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

export default async function MarketplaceSuppliersPage() {
  const access = await getMarketplaceAccess()
  return (
    <SupplierDirectoryClient
      canBrowse={access.canBrowse}
      planName={access.planName}
      defaultCountry={access.defaultCountry}
    />
  )
}
