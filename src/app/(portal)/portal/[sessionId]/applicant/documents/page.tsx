import { requirePortalSession } from "../../_guard"
import { getApplicantDocuments } from "@/lib/portal/data"
import { PortalPageHeader } from "@/components/portals/portal-ui"
import PortalDocumentsClient, { type PortalDoc } from "@/components/portals/PortalDocumentsClient"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function ApplicantDocumentsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "applicant")
  const base = `/portal/${session.id}/applicant`

  const docs = (await getApplicantDocuments(session)) as unknown as PortalDoc[]

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Documents"
        subtitle="Listing details, draft agreements and forms shared for your application."
        backHref={base}
      />
      <PortalDocumentsClient
        docs={docs} base={base}
        filters={["All", "Listing", "Tenancy", "Forms", "Other"]}
      />
    </div>
  )
}
