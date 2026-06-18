"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/payouts/[payoutId] — payout detail (manifest image 52).

   Linked jobs in the payout, escrow release conditions, blockers requiring
   action, fee breakdown, audit trail, and a "Resolve blockers" CTA → the
   blocker-resolution sub-route. Payout/payment-method data is private to the
   owner; the destination is shown masked only.
─────────────────────────────────────────────────────────────────────────── */

import { useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ChevronLeft, Wallet, AlertTriangle, CheckCircle2, Circle, Clock, Banknote,
  ChevronRight, Building2, ArrowUpRight,
} from "lucide-react"
import { SupplierCard, SupplierStatusBadge, SupplierButton, toneForStatus, humaniseStatus } from "@/components/supplier-workspace/ui"
import { MobileTopBar } from "@/components/mobile"
import { moneyPence, shortDate } from "@/components/supplier-workspace/format"
import { getSeedPayoutDetail } from "@/features/supplier/finance/data/payout-detail"

export const dynamic = "force-dynamic"

export default function SupplierPayoutDetailPage() {
  const { payoutId } = useParams<{ payoutId: string }>()
  const p = useMemo(() => getSeedPayoutDetail(payoutId), [payoutId])
  const openBlockers = p.blockers.filter((b) => b.status !== "resolved")
  const metConditions = p.escrowConditions.filter((c) => c.met).length

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
          <p className="mt-0.5 text-sm text-slate-500 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-400" />{p.workspaceName}</p>
        </div>
        {openBlockers.length > 0 && (
          <Link href={`/supplier/payouts/${p.ref}/blockers`}>
            <SupplierButton><AlertTriangle className="w-4 h-4" /> Resolve {openBlockers.length} blocker{openBlockers.length === 1 ? "" : "s"}</SupplierButton>
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
          <span>This payout is held until {openBlockers.length} release condition{openBlockers.length === 1 ? "" : "s"} {openBlockers.length === 1 ? "is" : "are"} met. <Link href={`/supplier/payouts/${p.ref}/blockers`} className="font-semibold underline">Resolve now</Link>.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          {/* Jobs in this payout */}
          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Jobs in this payout</h2>
            <div className="divide-y divide-slate-100">
              {p.jobs.map((j) => (
                <Link key={j.id} href={j.href} className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{j.title}</p>
                    <p className="text-xs text-slate-400">{j.ref} · completed {shortDate(j.completedAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-900">{moneyPence(j.netPence)}</p>
                    <p className="text-[11px] text-slate-400">fee {moneyPence(j.feePence)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </Link>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-200">
              <span className="text-sm font-medium text-slate-600">Net payout</span>
              <span className="text-base font-bold text-slate-900">{moneyPence(p.netPence, p.currency)}</span>
            </div>
          </SupplierCard>

          {/* Fee breakdown */}
          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Breakdown</h2>
            <dl className="space-y-2 text-sm">
              <Row k="Gross earnings" v={moneyPence(p.grossPence, p.currency)} />
              <Row k="Platform fee" v={`−${moneyPence(p.feePence, p.currency)}`} />
              {p.vatPence > 0 && <Row k="VAT" v={moneyPence(p.vatPence, p.currency)} />}
              <div className="flex justify-between border-t border-slate-200 pt-2"><dt className="font-medium text-slate-600">Net to {p.destinationMasked}</dt><dd className="font-bold text-slate-900">{moneyPence(p.netPence, p.currency)}</dd></div>
            </dl>
          </SupplierCard>
        </div>

        <div className="space-y-4">
          {/* Escrow release conditions */}
          <SupplierCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Release conditions</h2>
              <span className="text-xs font-semibold text-slate-400">{metConditions}/{p.escrowConditions.length}</span>
            </div>
            <ul className="space-y-2.5">
              {p.escrowConditions.map((c) => (
                <li key={c.id} className="flex items-start gap-2 text-sm">
                  {c.met ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />}
                  <span className={c.met ? "text-slate-600" : "text-slate-800 font-medium"}>{c.label}</span>
                </li>
              ))}
            </ul>
            {openBlockers.length > 0 && (
              <Link href={`/supplier/payouts/${p.ref}/blockers`} className="mt-4 block">
                <SupplierButton className="w-full justify-center"><AlertTriangle className="w-4 h-4" /> Resolve blockers</SupplierButton>
              </Link>
            )}
          </SupplierCard>

          {/* Audit */}
          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Activity</h2>
            <ol className="space-y-3">
              {p.audit.map((a, i) => (
                <li key={a.id} className="flex gap-3">
                  <div className="flex flex-col items-center"><span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5" />{i < p.audit.length - 1 && <span className="flex-1 w-px bg-slate-200 my-1" />}</div>
                  <div className="pb-1"><p className="text-sm text-slate-700">{a.label}</p><p className="text-[11px] text-slate-400">{shortDate(a.at)}</p></div>
                </li>
              ))}
            </ol>
          </SupplierCard>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, icon: Icon, strong }: { label: string; value: string; icon: typeof Wallet; strong?: boolean }) {
  return (
    <SupplierCard className="p-4">
      <div className="flex items-center justify-between"><span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</span><Icon className="w-4 h-4 text-slate-400" /></div>
      <p className={`mt-1 font-bold ${strong ? "text-xl text-slate-900" : "text-lg text-slate-800"}`}>{value}</p>
    </SupplierCard>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><dt className="text-slate-500">{k}</dt><dd className="font-semibold text-slate-800">{v}</dd></div>
}
