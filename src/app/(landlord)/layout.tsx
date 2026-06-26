import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import LandlordShell from "@/components/shells/LandlordShell"
import PortalGuidedHelp from "@/guided-help/PortalGuidedHelp"

export default async function LandlordLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirectTo=/landlord-portal")

  return (
    <PortalGuidedHelp>
      <LandlordShell>{children}</LandlordShell>
    </PortalGuidedHelp>
  )
}
