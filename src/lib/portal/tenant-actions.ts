"use server"
// Server actions for the tenant portal — wrap admin-client writes so client
// components can call them, re-validating the session server-side.

import { getSessionForRoute } from "@/lib/portal/session"
import { createTenantMaintenanceRequest, type NewMaintenanceRequest } from "@/lib/portal/data-extra"

/** Server action: tenant raises a maintenance request. */
export async function reportRepairAction(
  sessionId: string,
  input: NewMaintenanceRequest
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await getSessionForRoute(sessionId)
  if (!session || session.portalType !== "tenant") {
    return { ok: false, error: "Session invalid or not a tenant portal." }
  }
  return createTenantMaintenanceRequest(session, input)
}
