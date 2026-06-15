import { redirect } from "next/navigation"
import CustomerShell from "@/components/shells/CustomerShell"
import { createClient } from "@/lib/supabase/server"
import { isFeatureEnabled } from "@/lib/flags"

/**
 * Customer workspace layout (v2 scaffold).
 *
 * Gated behind the `customerWorkspace` feature flag, which defaults OFF. While
 * the flag is off, the entire route group redirects to /app, so it is INVISIBLE
 * in V1 — no nav entry, no reachable page. When the flag is enabled per
 * workspace (or globally) the lightweight CustomerShell renders.
 *
 * Tolerant: the flag accessor never throws and defaults to OFF, so a missing
 * flags table simply keeps this group hidden.
 */
export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirectTo=/customer")

  const enabled = await isFeatureEnabled("customerWorkspace", { supabase })
  if (!enabled) redirect("/app")

  return <CustomerShell>{children}</CustomerShell>
}
