import { cn } from "@/lib/utils"
import {
  normalisePaymentPhase,
  paymentVisual,
  normalisePayoutStatus,
  payoutVisual,
} from "./status"

/** A small status pill for a raw payment/intent status. */
export function PaymentStatusBadge({
  status,
  className,
}: {
  status: string | null | undefined
  className?: string
}) {
  const v = paymentVisual(normalisePaymentPhase(status))
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
        v.bg,
        v.text,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", v.dot)} />
      {v.label}
    </span>
  )
}

/** A small status pill for a payout/escrow status. */
export function PayoutStatusBadge({
  status,
  className,
}: {
  status: string | null | undefined
  className?: string
}) {
  const v = payoutVisual(normalisePayoutStatus(status))
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
        v.bg,
        v.text,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", v.dot)} />
      {v.label}
    </span>
  )
}
