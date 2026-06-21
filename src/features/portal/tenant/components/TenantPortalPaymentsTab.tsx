import { Download, CreditCard } from "lucide-react"
import { PortalPageHeader, PortalButtonLink } from "@/components/portals/portal-ui"
import PortalPaymentsClient, { type LedgerRow } from "@/components/portals/PortalPaymentsClient"

interface TenantPortalPaymentsTabProps {
  rows: LedgerRow[]
  base: string
  rentPcm: number | null
  depositHeld: number | null
  nextDue: string | null
}

export function TenantPortalPaymentsTab({
  rows,
  base,
  rentPcm,
  depositHeld,
  nextDue,
}: TenantPortalPaymentsTabProps) {
  return (
    <div className="space-y-5">
      <PortalPageHeader
        title="Payments"
        subtitle="Your rent ledger, receipts and payment history."
        backHref={base}
        actions={
          <>
            <PortalButtonLink href={`${base}/documents`} icon={Download}>
              Download statement
            </PortalButtonLink>
            <PortalButtonLink href={`${base}/messages`} variant="primary" icon={CreditCard}>
              Make a payment
            </PortalButtonLink>
          </>
        }
      />
      <PortalPaymentsClient
        rows={rows}
        base={base}
        rentPcm={rentPcm}
        depositHeld={depositHeld}
        nextDue={nextDue}
      />
    </div>
  )
}
