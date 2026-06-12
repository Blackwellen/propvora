import { requirePortalSession } from "../../_guard"
import { getSupplierInvoices } from "@/lib/portal/data"
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
  const invoices = await getSupplierInvoices(session)
  return <InvoicesList invoices={invoices} />
}
