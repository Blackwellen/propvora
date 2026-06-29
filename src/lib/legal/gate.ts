import "server-only"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isFeatureEnabled } from "@/lib/flags"
import type { V2FlagKey } from "@/lib/flags/registry"

/**
 * Server guard for flag-gated legal pages.
 *
 * The /legal hub already HIDES V2 policy groups (bookings, hosts, marketplace)
 * when their flag is off — but the individual policy routes still existed and
 * resolved on a direct URL, leaking V2 surface area. This makes direct-URL
 * access return a real 404 when the surface is disabled, matching the hub.
 *
 * Honours the QA bypass (NEXT_PUBLIC_QA_ALL_FLAGS=true) like the rest of the app.
 * Call it at the top of a flag-gated legal page (the page becomes async):
 *   await assertLegalSurface("bookingManagement")
 */
export async function assertLegalSurface(flag: V2FlagKey): Promise<void> {
  if (process.env.NEXT_PUBLIC_QA_ALL_FLAGS === "true") return
  const supabase = await createClient()
  const enabled = await isFeatureEnabled(flag, { supabase })
  if (!enabled) notFound()
}
