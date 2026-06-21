import PortalMessages from "@/components/portals/PortalMessages"
import type { ComponentProps } from "react"

type PortalMessagesProps = ComponentProps<typeof PortalMessages>

interface LandlordPortalMessagesTabProps extends PortalMessagesProps {}

export function LandlordPortalMessagesTab(props: LandlordPortalMessagesTabProps) {
  return <PortalMessages {...props} />
}
