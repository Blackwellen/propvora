"use client"

import { Wallet, ShieldCheck, Banknote, ArrowUpRight, Lock, Info, Download } from "lucide-react"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { MoneyTabNav, MoneyPageHeader, MoneyKpiCard } from "@/components/money"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import PayoutsTable, { type PayoutTableRow } from "@/components/payments/PayoutsTable"
import ConnectStatusBanner, { type ConnectBannerState } from "@/components/payments/ConnectStatusBanner"
import { formatPence } from "@/components/payments/status"

interface PayoutsClientProps {
  canReceivePayouts: boolean
  ready: boolean
  planName: string
  upgradeReason: string | null
  summary: {
    escrowHeldPence: number
    pendingPayoutPence: number
    paidThisMonthPence: number
    currency: string
  }
  payouts: PayoutTableRow[]
  connect: ConnectBannerState
}

function downloadCSV(rows: PayoutTableRow[]) {
  if (!rows.length) return
  const headers = ["reference", "guest", "listing", "check_in", "check_out", "gross_pence", "fee_pence", "net_pence", "currency", "status"]
  const body = rows.map((r) =>
    [r.reference, r.guestName ?? "", r.listingTitle ?? "", r.checkIn ?? "", r.checkOut ?? "", r.grossPence, r.feePence, r.netPence, r.currency, r.status]
      .map((v) => JSON.stringify(v ?? ""))
      .join(",")
  )
  const csv = [headers.join(","), ...body].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "payouts.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export default function PayoutsClient({
  canReceivePayouts,
  ready,
  planName,
  upgradeReason,
  summary,
  payouts,
  connect,
}: PayoutsClientProps) {
  return (
    <DashboardContainer>
      <MobileTopBar
        title="Payouts"
        subtitle="Escrow & earnings"
        overflowActions={
          canReceivePayouts && payouts.length > 0
            ? [{ label: "Export CSV", icon: Download, onClick: () => downloadCSV(payouts) }]
            : []
        }
      />

      <div className="hidden md:block">
        <MoneyPageHeader
          breadcrumb="Payouts"
          title="Payouts & Escrow"
          subtitle="Track funds held in escrow and released to your connected account."
          actions={
            canReceivePayouts && payouts.length > 0 ? (
              <button
                onClick={() => downloadCSV(payouts)}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            ) : undefined
          }
        />
      </div>

      <MoneyTabNav />

      {/* ── Entitlement gate: premium upgrade prompt ── */}
      {!canReceivePayouts ? (
        <div className="mt-6">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-8 sm:p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-[#1D4ED8]" />
            </div>
            <h2 className="text-[19px] font-bold text-slate-900">Payouts &amp; escrow</h2>
            <p className="mt-2 text-[13.5px] text-slate-500 leading-relaxed max-w-md mx-auto">
              {upgradeReason ??
                `Receiving payments and managing escrow isn't included on the ${planName} plan. Upgrade to take direct bookings and get paid through Propvora.`}
            </p>
            <ul className="mt-5 space-y-2 text-left max-w-sm mx-auto">
              {[
                "Take card payments for direct bookings",
                "Funds held safely in escrow until each stay completes",
                "Automatic payouts to your own Stripe account",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="/app/workspace-settings/billing"
              className="mt-6 inline-flex items-center gap-1.5 h-11 px-6 rounded-xl bg-[#1D4ED8] text-white text-[14px] font-semibold hover:bg-[#1A45BE] transition-colors"
            >
              View upgrade options <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Connect onboarding / status */}
          <div className="mt-6">
            <ConnectStatusBanner state={connect} />
          </div>

          {/* KPIs (integer pence formatted at the edge) */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MoneyKpiCard
              label="Held in escrow"
              value={formatPence(summary.escrowHeldPence, summary.currency)}
              subtitle="Awaiting stay completion"
              icon={<ShieldCheck className="w-5 h-5" />}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
            />
            <MoneyKpiCard
              label="Pending payout"
              value={formatPence(summary.pendingPayoutPence, summary.currency)}
              subtitle="Clearing to your account"
              icon={<Wallet className="w-5 h-5" />}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
            <MoneyKpiCard
              label="Paid this month"
              value={formatPence(summary.paidThisMonthPence, summary.currency)}
              subtitle="Settled payouts"
              icon={<Banknote className="w-5 h-5" />}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
          </div>

          {/* Escrow explainer */}
          <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[12.5px] text-slate-500 leading-relaxed">
              Guest payments are <span className="font-semibold text-slate-600">held in escrow</span> and
              only released to you after each stay is confirmed and completed. Capture and payout are
              processed automatically by Stripe — amounts here reflect real records, not projections.
            </p>
          </div>

          {/* Not-ready note (payments schema absent) */}
          {!ready && payouts.length === 0 && (
            <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[12.5px] text-blue-800 leading-relaxed">
                Payments aren&apos;t fully provisioned for this workspace yet. Once guests start paying for
                bookings, their escrow and payout activity will appear here automatically.
              </p>
            </div>
          )}

          {/* Payouts table / cards */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Payout activity</h3>
            <PayoutsTable rows={payouts} />
          </div>
        </>
      )}
    </DashboardContainer>
  )
}
