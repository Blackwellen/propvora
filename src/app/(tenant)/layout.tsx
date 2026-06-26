import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import TenantShell from "@/components/shells/TenantShell"
import PortalGuidedHelp from "@/guided-help/PortalGuidedHelp"

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirectTo=/tenant-portal")

  return (
    <PortalGuidedHelp>
      <TenantShell>{children}</TenantShell>
    </PortalGuidedHelp>
  )
}
