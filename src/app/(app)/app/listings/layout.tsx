import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isFeatureEnabled } from "@/lib/flags"

// Listings (direct-booking pages) is a V2 surface (directBookingPages, default
// OFF). Server-side gate so direct-URL access is blocked, not just hidden in nav.
export const dynamic = "force-dynamic"

export default async function ListingsLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_QA_ALL_FLAGS !== "true") {
    const supabase = await createClient()
    const enabled = await isFeatureEnabled("directBookingPages", { supabase })
    if (!enabled) redirect("/property-manager")
  }
  return <>{children}</>
}
