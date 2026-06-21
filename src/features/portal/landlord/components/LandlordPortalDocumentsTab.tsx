import { PortalPageHeader } from "@/components/portals/portal-ui"
import PortalDocumentsClient, { type PortalDoc } from "@/components/portals/PortalDocumentsClient"

interface LandlordPortalDocumentsTabProps {
  docs: PortalDoc[]
  base: string
}

export function LandlordPortalDocumentsTab({ docs, base }: LandlordPortalDocumentsTabProps) {
  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Documents"
        subtitle="Statements, compliance files, agreements and shared records in one place."
        backHref={base}
      />
      <PortalDocumentsClient
        docs={docs}
        base={base}
        filters={[
          "All",
          "Statements",
          "Compliance",
          "Tenancy",
          "Maintenance",
          "Legal",
          "Insurance",
          "Certificates",
        ]}
      />
    </div>
  )
}
