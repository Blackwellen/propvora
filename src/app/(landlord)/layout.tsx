import LandlordShell from "@/components/shells/LandlordShell"
import PortalGuidedHelp from "@/guided-help/PortalGuidedHelp"

export default function LandlordLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuidedHelp>
      <LandlordShell>{children}</LandlordShell>
    </PortalGuidedHelp>
  )
}
