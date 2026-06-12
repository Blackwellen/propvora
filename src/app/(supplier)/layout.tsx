import SupplierShell from "@/components/shells/SupplierShell"
import PortalGuidedHelp from "@/guided-help/PortalGuidedHelp"

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuidedHelp>
      <SupplierShell>{children}</SupplierShell>
    </PortalGuidedHelp>
  )
}
