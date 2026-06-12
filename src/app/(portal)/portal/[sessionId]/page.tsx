import { redirect } from "next/navigation"
import { requirePortalSession } from "./_guard"

export const dynamic = "force-dynamic"

// /portal/[sessionId] with no portal-type segment — bounce to the typed home.
export default async function PortalSessionIndex({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId)
  redirect(`/portal/${session.id}/${session.portalType}`)
}
