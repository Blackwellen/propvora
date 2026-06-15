import { getPayoutsAccess, loadPayoutsData, loadConnectBanner } from "./server"
import PayoutsClient from "./PayoutsClient"

/* ──────────────────────────────────────────────────────────────────────────
   /app/money/payouts — operator PAYOUTS + ESCROW dashboard (server component).

   Resolves the active workspace + payouts entitlement server-side via
   `getPayoutsAccess` (gateBookingPages — REAL entitlement, no feature flags),
   then loads the tolerant escrow/payout dataset + Connect status and hands them
   to the interactive client island. When not entitled the island renders a
   premium upgrade prompt; when the payment schema isn't provisioned it renders a
   coherent not-ready state. Never hidden, never crashed. Money is integer pence.
─────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

export default async function PayoutsPage() {
  const access = await getPayoutsAccess()

  const [data, connect] = access.canReceivePayouts
    ? await Promise.all([
        loadPayoutsData(access.workspaceId),
        loadConnectBanner(access.workspaceId),
      ])
    : [
        {
          ready: true,
          summary: { escrowHeldPence: 0, pendingPayoutPence: 0, paidThisMonthPence: 0, currency: "GBP" },
          payouts: [],
        },
        { connected: false, status: "none", payoutsEnabled: false },
      ]

  return (
    <PayoutsClient
      canReceivePayouts={access.canReceivePayouts}
      ready={data.ready}
      planName={access.planName}
      upgradeReason={access.upgradeReason}
      summary={data.summary}
      payouts={data.payouts}
      connect={connect}
    />
  )
}
