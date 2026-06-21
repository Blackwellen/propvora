import { PortalPageHeader } from "@/components/portals/portal-ui"
import PortalDocumentsClient, { type PortalDoc } from "@/components/portals/PortalDocumentsClient"

interface SupplierPortalDocumentsTabProps {
  docs: PortalDoc[]
  base: string
}

export function SupplierPortalDocumentsTab({ docs, base }: SupplierPortalDocumentsTabProps) {
  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Documents"
        subtitle="View, manage and share all documents related to your jobs and compliance."
        backHref={base}
      />
      <PortalDocumentsClient
        docs={docs}
        base={base}
        filters={[
          "All",
          "Job docs",
          "Scope of works",
          "RAMS",
          "Photos",
          "Certificates",
          "Invoices",
          "Compliance",
        ]}
        requestHref={`${base}/messages`}
      />
    </div>
  )
}
