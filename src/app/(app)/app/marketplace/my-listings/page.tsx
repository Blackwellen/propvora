import { Suspense } from "react"
import { getMarketplaceAccess } from "@/components/marketplace/server"
import { MyListingsClient } from "@/components/marketplace/MyListingsClient"

/* ──────────────────────────────────────────────────────────────────────────
   Marketplace — MY LISTINGS (server component).

   Resolves the workspace publishing entitlement server-side and hands it to
   the management island. When the workspace can't publish, the island shows an
   explicit upgrade prompt rather than hiding the surface. The client reads the
   active workspace id itself (mirrors useWorkspace) for the owner-scoped API.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

export default async function MyListingsPage() {
  const access = await getMarketplaceAccess()

  return (
    <Suspense fallback={null}>
      <MyListingsClient
        canPublish={access.canPublish}
        planName={access.planName}
        defaultCountry={access.defaultCountry}
      />
    </Suspense>
  )
}
