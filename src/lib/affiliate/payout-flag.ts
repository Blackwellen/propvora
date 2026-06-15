// Feature flag for the affiliate payout workflow. Default OFF so the programme
// ships with payouts GATED. Enabled ONLY when the value is exactly "true".
// NEXT_PUBLIC_ so the same answer is available on server + client (to render
// honest "payouts enabled when…" states).
export function isAffiliatePayoutsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AFFILIATE_PAYOUTS_ENABLED === "true"
}
