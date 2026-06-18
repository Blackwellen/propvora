import { requirePortalSession } from "../../_guard"
import { getSupplierDocuments } from "@/lib/portal/data"
import { PortalPageHeader } from "@/components/portals/portal-ui"
import PortalDocumentsClient, { type PortalDoc } from "@/components/portals/PortalDocumentsClient"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function SupplierDocumentsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "supplier")
  const base = `/portal/${session.id}/supplier`
  const docs = (await getSupplierDocuments(session).catch(() => [])) as unknown as PortalDoc[]

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Documents"
        subtitle="View, manage and share all documents related to your jobs and compliance."
        backHref={base}
      />
      <PortalDocumentsClient
        docs={docs} base={base}
        filters={["All", "Job docs", "Scope of works", "RAMS", "Photos", "Certificates", "Invoices", "Compliance"]}
        requestHref={`${base}/messages`}
      />
    </div>
  )
}
