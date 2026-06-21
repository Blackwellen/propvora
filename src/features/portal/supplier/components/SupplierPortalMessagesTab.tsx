import PortalMessages from "@/components/portals/PortalMessages"
import type { ComponentProps } from "react"

type PortalMessagesProps = ComponentProps<typeof PortalMessages>

interface SupplierPortalMessagesTabProps extends PortalMessagesProps {}

export function SupplierPortalMessagesTab(props: SupplierPortalMessagesTabProps) {
  return <PortalMessages {...props} />
}
