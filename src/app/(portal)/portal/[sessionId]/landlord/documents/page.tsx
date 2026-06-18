import { requirePortalSession } from "../../_guard"
import { getLandlordPropertyIds } from "@/lib/portal/data"
import { createAdminClient } from "@/lib/supabase/admin"
import { PortalPageHeader } from "@/components/portals/portal-ui"
import PortalDocumentsClient, { type PortalDoc } from "@/components/portals/PortalDocumentsClient"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function LandlordDocumentsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "landlord")
  const base = `/portal/${session.id}/landlord`

  // Scoped to the landlord's linked properties only.
  let docs: PortalDoc[] = []
  try {
    const propertyIds = await getLandlordPropertyIds(session)
    if (propertyIds.length) {
      const admin = createAdminClient()
      const { data } = await admin
        .from("property_documents")
        .select("id, name, type:category, file_path:file_url, file_size, created_at")
        .eq("workspace_id", session.workspaceId)
        .in("property_id", propertyIds)
        .order("created_at", { ascending: false })
      docs = (data ?? []) as PortalDoc[]
    }
  } catch { /* tolerate */ }

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Documents"
        subtitle="Statements, compliance files, agreements and shared records in one place."
        backHref={base}
      />
      <PortalDocumentsClient
        docs={docs} base={base}
        filters={["All", "Statements", "Compliance", "Tenancy", "Maintenance", "Legal", "Insurance", "Certificates"]}
      />
    </div>
  )
}
