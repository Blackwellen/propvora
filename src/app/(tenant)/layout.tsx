import TenantShell from "@/components/shells/TenantShell"
import PortalGuidedHelp from "@/guided-help/PortalGuidedHelp"

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuidedHelp>
      <TenantShell>{children}</TenantShell>
    </PortalGuidedHelp>
  )
}
