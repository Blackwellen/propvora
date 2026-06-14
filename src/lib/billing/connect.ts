/**
 * Stripe Connect (Standard) helpers — owner's own account receives tenant/
 * customer payments. SEPARATE from SaaS subscription billing.
 *
 * Gated behind NEXT_PUBLIC_FF_STRIPE_CONNECT (default OFF). Until the founder
 * enables Connect in the platform Stripe dashboard and flips this flag, every
 * Connect surface stays disabled.
 */

export function connectEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FF_STRIPE_CONNECT === "true"
}

export interface ConnectStatus {
  connected: boolean
  status: "none" | "pending" | "active" | "restricted" | "disabled"
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  accountId: string | null
}

/** Map a Stripe Account object onto our stored status fields. */
export function statusFromAccount(acct: {
  charges_enabled?: boolean
  payouts_enabled?: boolean
  details_submitted?: boolean
  requirements?: { disabled_reason?: string | null } | null
}): { status: ConnectStatus["status"]; charges: boolean; payouts: boolean; details: boolean } {
  const charges = !!acct.charges_enabled
  const payouts = !!acct.payouts_enabled
  const details = !!acct.details_submitted
  let status: ConnectStatus["status"] = "pending"
  if (acct.requirements?.disabled_reason) status = "disabled"
  else if (charges && payouts) status = "active"
  else if (details && (!charges || !payouts)) status = "restricted"
  return { status, charges, payouts, details }
}
