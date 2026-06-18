import { Download, CreditCard } from "lucide-react"
import { requirePortalSession } from "../../_guard"
import { getTenantPayments, getTenantTenancies } from "@/lib/portal/data"
import { PortalPageHeader, PortalButtonLink } from "@/components/portals/portal-ui"
import PortalPaymentsClient, { type LedgerRow } from "@/components/portals/PortalPaymentsClient"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function computeNextDue(startDate: string | null | undefined): string | null {
  if (!startDate) return null
  const start = new Date(startDate); if (Number.isNaN(start.getTime())) return null
  const day = start.getDate(); const now = new Date()
  let due = new Date(now.getFullYear(), now.getMonth(), day)
  if (due.getTime() < now.setHours(0, 0, 0, 0)) due = new Date(now.getFullYear(), now.getMonth() + 1, day)
  return due.toISOString()
}

export default async function TenantPaymentsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "tenant")
  const base = `/portal/${session.id}/tenant`
  const [payments, tenancies] = await Promise.all([getTenantPayments(session), getTenantTenancies(session)])
  const current = tenancies.find((t) => t.status === "active") ?? tenancies[0] ?? null

  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Payments" subtitle="Your rent ledger, receipts and payment history." backHref={base}
        actions={<><PortalButtonLink href={`${base}/documents`} icon={Download}>Download statement</PortalButtonLink><PortalButtonLink href={`${base}/messages`} variant="primary" icon={CreditCard}>Make a payment</PortalButtonLink></>}
      />
      <PortalPaymentsClient
        rows={payments as LedgerRow[]}
        base={base}
        rentPcm={current?.rent_amount ?? null}
        depositHeld={current?.deposit_amount ?? null}
        nextDue={computeNextDue(current?.start_date)}
      />
    </div>
  )
}
