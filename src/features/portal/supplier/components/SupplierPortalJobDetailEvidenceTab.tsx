import { Images } from "lucide-react"
import { PortalSectionCard, PortalEmptyState, PortalButtonLink } from "@/components/portals/portal-ui"

interface SupplierPortalJobDetailEvidenceTabProps {
  messagesHref: string
}

export function SupplierPortalJobDetailEvidenceTab({
  messagesHref,
}: SupplierPortalJobDetailEvidenceTabProps) {
  return (
    <PortalSectionCard title="Evidence & photos" icon={Images}>
      <PortalEmptyState
        icon={Images}
        title="No evidence uploaded yet"
        description="Upload photos and evidence of completed work via messages."
        action={<PortalButtonLink href={messagesHref}>Upload via message</PortalButtonLink>}
      />
    </PortalSectionCard>
  )
}
