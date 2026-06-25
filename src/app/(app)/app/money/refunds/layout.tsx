/**
 * Refunds route gate — server component layout
 *
 * Marketplace refunds are a V2 payment rail, gated behind `marketplacePayments`
 * (payment capture / payout flows). When the flag is off, direct URL access to
 * /property-manager/money/refunds redirects to /property-manager/money (the
 * Money overview), stopping the V2 marketplace surface leaking into the V1
 * Money section.
 *
 * QA override: NEXT_PUBLIC_QA_ALL_FLAGS=true bypasses this gate so testers can
 * reach the page without toggling the DB flag.
 */
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isFeatureEnabled } from "@/lib/flags"

export default async function RefundsLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_QA_ALL_FLAGS === "true") return <>{children}</>

  const supabase = await createClient()
  const enabled = await isFeatureEnabled("marketplacePayments", { supabase })

  if (!enabled) {
    redirect("/property-manager/money")
  }

  return <>{children}</>
}
