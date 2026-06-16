"use server"
// Server actions for portal supplier — wrap the admin-client functions
// so they can be called from client components.

import { getSessionForRoute } from "@/lib/portal/session"
import { supplierSubmitInvoice, supplierRequestSignOff, type NewSupplierInvoice } from "@/lib/portal/data"

/**
 * Server action: supplier submits an invoice.
 * Re-validates the session server-side so the client cannot spoof scope.
 */
export async function submitInvoiceAction(
  sessionId: string,
  input: NewSupplierInvoice
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await getSessionForRoute(sessionId)
  if (!session || session.portalType !== "supplier") {
    return { ok: false, error: "Session invalid or not a supplier portal." }
  }
  return supplierSubmitInvoice(session, input)
}

/**
 * Server action: supplier requests sign-off on a job.
 * Re-validates session to confirm the job belongs to this supplier.
 */
export async function signOffJobAction(
  sessionId: string,
  jobId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSessionForRoute(sessionId)
  if (!session || session.portalType !== "supplier") {
    return { ok: false, error: "Session invalid or not a supplier portal." }
  }
  return supplierRequestSignOff(session, jobId)
}
