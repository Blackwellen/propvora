import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isFeatureEnabled } from "@/lib/flags"

// Route protection for the public Help Centre (/help, and /faq which 301s here).
// `helpCentre` is an operational kill-switch (default ON in V1). With no
// workspace context this reads the global platform flag and fails open to ON,
// so the page stays crawlable unless help is explicitly turned off. QA bypass
// honoured.
export default async function PublicHelpLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_QA_ALL_FLAGS !== "true") {
    const supabase = await createClient()
    const enabled = await isFeatureEnabled("helpCentre", { supabase })
    if (!enabled) redirect("/")
  }
  return <>{children}</>
}
