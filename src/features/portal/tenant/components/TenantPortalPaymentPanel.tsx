import { CreditCard, Download, MessageSquare } from "lucide-react"
import { PortalSectionCard, PortalButtonLink, PortalEmptyState } from "@/components/portals/portal-ui"
import { formatMoney, formatDate } from "@/lib/portal/format"

interface TenantPortalPaymentPanelProps {
  rentAmount: number | null
  nextDue: string | null
  base: string
}

export function TenantPortalPaymentPanel({
  rentAmount,
  nextDue,
  base,
}: TenantPortalPaymentPanelProps) {
  return (
    <PortalSectionCard title="Upcoming payment" icon={CreditCard} viewAllHref={`${base}/payments`}>
      {nextDue ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-[#F4F8FF] border border-[#E1ECFF] px-4 py-3">
            <p className="text-xs text-slate-500">Amount due</p>
            <p className="text-xl font-bold text-[#071B4D] mt-0.5">{formatMoney(rentAmount)}</p>
            <p className="text-xs text-slate-400 mt-1">Due {formatDate(nextDue)}</p>
          </div>
          <div className="flex gap-2">
            <PortalButtonLink href={`${base}/messages`} variant="primary" icon={CreditCard} className="flex-1 justify-center">
              Pay now
            </PortalButtonLink>
            <PortalButtonLink href={`${base}/documents`} icon={Download} className="justify-center">
              Statement
            </PortalButtonLink>
          </div>
        </div>
      ) : (
        <PortalEmptyState
          icon={CreditCard}
          title="No payment due"
          description="Your payment schedule appears here."
        />
      )}
    </PortalSectionCard>
  )
}
