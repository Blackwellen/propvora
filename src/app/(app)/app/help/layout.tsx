import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isFeatureEnabled } from "@/lib/flags"

// Route protection for the in-app Help & Getting Started surface. `helpCentre`
// is an operational kill-switch (default ON in V1); when a workspace/global
// disables it, direct URL access redirects back to the dashboard. QA bypass
// honoured so NEXT_PUBLIC_QA_ALL_FLAGS=true keeps the page reachable.
export default async function AppHelpLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_QA_ALL_FLAGS !== "true") {
    const supabase = await createClient()
    const enabled = await isFeatureEnabled("helpCentre", { supabase })
    if (!enabled) redirect("/property-manager")
  }
  return <>{children}</>
}
