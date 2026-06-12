import { redirect } from "next/navigation"
import { getSessionForRoute, type PortalSession, type PortalType } from "@/lib/portal/session"
import { isExternalPortalEnabled } from "@/lib/portal/flags"

// Page-level guard: re-validates the session for this exact sessionId and, if
// provided, asserts the portal type matches the URL segment. Every scoped page
// calls this — defence in depth on top of the layout gate. Fail closed.
export async function requirePortalSession(
  sessionId: string,
  expectedType?: PortalType
): Promise<PortalSession> {
  if (!isExternalPortalEnabled()) redirect("/portal/expired")
  const session = await getSessionForRoute(sessionId)
  if (!session) redirect("/portal/login")
  if (expectedType && session.portalType !== expectedType) {
    // Visitor hit a portal-type segment that isn't theirs — send them to
    // their own home rather than leaking that the segment exists.
    redirect(`/portal/${session.id}/${session.portalType}`)
  }
  return session
}
