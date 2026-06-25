import { requirePortalSession } from "../../_guard"
import { getLinkedPropertyDocuments } from "@/lib/portal/data"
import { PortalPageHeader } from "@/components/portals/portal-ui"
import PortalDocumentsClient, { type PortalDoc } from "@/components/portals/PortalDocumentsClient"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function AccountantDocumentsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "accountant")
  const base = `/portal/${session.id}/accountant`

  const docs = (await getLinkedPropertyDocuments(session)) as unknown as PortalDoc[]

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Financial documents"
        subtitle="Statements, invoices, receipts and supporting financial records."
        backHref={base}
      />
      <PortalDocumentsClient
        docs={docs} base={base}
        filters={["All", "Statements", "Invoices", "Receipts", "Tax", "Other"]}
      />
    </div>
  )
}
