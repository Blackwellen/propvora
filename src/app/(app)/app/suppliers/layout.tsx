import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isFeatureEnabled } from "@/lib/flags"

// The Suppliers marketplace hub is a V2 surface (marketplaceEnabled, default
// OFF). Server-side gate so direct-URL access is blocked, not just hidden in nav.
// The V1 internal supplier directory lives under /property-manager/work/suppliers.
export const dynamic = "force-dynamic"

export default async function SuppliersLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_QA_ALL_FLAGS !== "true") {
    const supabase = await createClient()
    const enabled = await isFeatureEnabled("marketplaceEnabled", { supabase })
    if (!enabled) redirect("/property-manager/work/suppliers")
  }
  return <>{children}</>
}
