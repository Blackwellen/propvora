/**
 * Guests route gate — server component layout
 *
 * The Guests section is gated behind the `bookingManagement` v2 feature flag.
 * When the flag is off, direct URL access to /property-manager/contacts/guests
 * redirects to /property-manager/contacts (the Contacts overview).
 *
 * QA override: NEXT_PUBLIC_QA_ALL_FLAGS=true bypasses this gate so testers can
 * reach the page without toggling the DB flag.
 */
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isFeatureEnabled } from "@/lib/flags"

export default async function GuestsLayout({ children }: { children: React.ReactNode }) {
  // QA all-flags bypass
  if (process.env.NEXT_PUBLIC_QA_ALL_FLAGS === "true") return <>{children}</>

  const supabase = await createClient()
  const enabled = await isFeatureEnabled("bookingManagement", { supabase })

  if (!enabled) {
    redirect("/property-manager/contacts")
  }

  return <>{children}</>
}
