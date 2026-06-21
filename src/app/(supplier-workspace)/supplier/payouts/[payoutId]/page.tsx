"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/payouts/[payoutId] — payout detail (manifest image 52).
─────────────────────────────────────────────────────────────────────────── */

import { useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronLeft, Wallet, AlertTriangle, Clock, Banknote, ArrowUpRight, Building2 } from "lucide-react"
import { SupplierCard, SupplierStatusBadge, SupplierButton, toneForStatus, humaniseStatus } from "@/components/supplier-workspace/ui"
import { MobileTopBar } from "@/components/mobile"
import { moneyPence, shortDate } from "@/components/supplier-workspace/format"
import { getSeedPayoutDetail } from "@/features/supplier/finance/data/payout-detail"

// Extracted payout-detail section components
import { PayoutJobsList } from "@/features/supplier/finance/components/payout-detail/PayoutJobsList"
import { PayoutFeeBreakdown } from "@/features/supplier/finance/components/payout-detail/PayoutFeeBreakdown"
import { PayoutEscrowConditions } from "@/features/supplier/finance/components/payout-detail/PayoutEscrowConditions"
import { PayoutAuditTrail } from "@/features/supplier/finance/components/payout-detail/PayoutAuditTrail"

export const dynamic = "force-dynamic"

export default function SupplierPayoutDetailPage() {
  const { payoutId } = useParams<{ payoutId: string }>()
  const p = useMemo(() => getSeedPayoutDetail(payoutId), [payoutId])
  const openBlockers = p.blockers.filter((b) => b.status !== "resolved")

  return (
    <div className="space-y-5">
      <MobileTopBar title={`Payout ${p.ref}`} subtitle="Settled funds" showBack backHref="/supplier/payouts" />

      <Link href="/supplier/payouts" className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" /> Back to payouts
      </Link>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-semibold text-slate-900">Payout {p.ref}</h1>
            <SupplierStatusBadge tone={toneForStatus(p.status)}>{humaniseStatus(p.status)}</SupplierStatusBadge>
          </div>
          <p className="mt-0.5 text-sm text-slate-500 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            {p.workspaceName}
          </p>
        </div>
        {openBlockers.length > 0 && (
          <Link href={`/supplier/payouts/${p.ref}/blockers`}>
            <SupplierButton>
              <AlertTriangle className="w-4 h-4" /> Resolve {openBlockers.length} blocker{openBlockers.length === 1 ? "" : "s"}
            </SupplierButton>
          </Link>
        )}
      </div>

      {/* Amount KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Net payout" value={moneyPence(p.netPence, p.currency)} icon={Wallet} strong />
        <Kpi label="Gross" value={moneyPence(p.grossPence, p.currency)} icon={Banknote} />
        <Kpi label="Platform fee" value={`−${moneyPence(p.feePence, p.currency)}`} icon={ArrowUpRight} />
        <Kpi label="Expected" value={p.expectedAt ? shortDate(p.expectedAt) : "On release"} icon={Clock} />
      </div>

      {openBlockers.length > 0 && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            This payout is held until {openBlockers.length} release condition{openBlockers.length === 1 ? "" : "s"}{" "}
            {openBlockers.length === 1 ? "is" : "are"} met.{" "}
            <Link href={`/supplier/payouts/${p.ref}/blockers`} className="font-semibold underline">
              Resolve now
            </Link>
            .
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          <PayoutJobsList jobs={p.jobs} netPence={p.netPence} currency={p.currency} />
          <PayoutFeeBreakdown
            grossPence={p.grossPence}
            feePence={p.feePence}
            vatPence={p.vatPence}
            netPence={p.netPence}
            destinationMasked={p.destinationMasked}
            currency={p.currency}
          />
        </div>

        <div className="space-y-4">
          <PayoutEscrowConditions
            conditions={p.escrowConditions}
            blockersRef={`/supplier/payouts/${p.ref}/blockers`}
            openBlockersCount={openBlockers.length}
          />
          <PayoutAuditTrail entries={p.audit} />
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, icon: Icon, strong }: { label: string; value: string; icon: typeof Wallet; strong?: boolean }) {
  return (
    <SupplierCard className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <p className={`mt-1 font-bold ${strong ? "text-xl text-slate-900" : "text-lg text-slate-800"}`}>{value}</p>
    </SupplierCard>
  )
}
