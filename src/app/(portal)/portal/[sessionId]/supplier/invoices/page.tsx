import { requirePortalSession } from "../../_guard"
import { getSupplierInvoices, getSupplierJobs } from "@/lib/portal/data"
import InvoicesList from "./InvoicesList"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function SupplierInvoicesPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "supplier")
  const [invoices, jobs] = await Promise.all([
    getSupplierInvoices(session),
    getSupplierJobs(session),
  ])
  return <InvoicesList invoices={invoices} session={session} jobs={jobs} />
}
