import PortalMessages from "@/components/portals/PortalMessages"
import type { ComponentProps } from "react"

type PortalMessagesProps = ComponentProps<typeof PortalMessages>

interface TenantPortalMessagesTabProps extends PortalMessagesProps {}

export function TenantPortalMessagesTab(props: TenantPortalMessagesTabProps) {
  return <PortalMessages {...props} />
}
