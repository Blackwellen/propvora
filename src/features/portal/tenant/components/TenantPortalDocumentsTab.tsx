import { PortalPageHeader } from "@/components/portals/portal-ui"
import PortalDocumentsClient, { type PortalDoc } from "@/components/portals/PortalDocumentsClient"

interface TenantPortalDocumentsTabProps {
  docs: PortalDoc[]
  base: string
}

export function TenantPortalDocumentsTab({ docs, base }: TenantPortalDocumentsTabProps) {
  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Documents"
        subtitle="Your tenancy agreement, certificates, reports and shared records in one place."
        backHref={base}
      />
      <PortalDocumentsClient docs={docs} base={base} />
    </div>
  )
}
