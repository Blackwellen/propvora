import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isFeatureEnabled } from "@/lib/flags"

// Bookings is a V2 direct-booking surface (bookingManagement, default OFF).
// Server-side gate so direct-URL access is blocked, not just hidden from nav.
export const dynamic = "force-dynamic"

export default async function BookingsLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_QA_ALL_FLAGS !== "true") {
    const supabase = await createClient()
    const enabled = await isFeatureEnabled("bookingManagement", { supabase })
    if (!enabled) redirect("/property-manager")
  }
  return <>{children}</>
}
