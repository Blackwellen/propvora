"use client"

import { Wallet, TrendingUp, Clock, ShieldCheck, Receipt, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileTopBar, ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import {
  SupplierPageHeader,
  SupplierCard,
  SupplierKpiStrip,
  SupplierEmptyState,
  SupplierLoadingState,
  SupplierNotReady,
  SupplierStatusBadge,
  toneForStatus,
  humaniseStatus,
  type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { money, shortDate } from "@/components/supplier-workspace/format"
import type { SupplierEarningsSummary, SupplierPaymentRow } from "@/components/supplier-workspace/types"

export default function SupplierEarningsPage() {
  const summary = useSupplierApi<SupplierEarningsSummary>("/api/supplier/jobs/earnings", {
    select: (j) => (j as { summary?: SupplierEarningsSummary }).summary ?? (j as SupplierEarningsSummary),
  })
  const payments = useSupplierApi<SupplierPaymentRow[]>("/api/supplier/jobs/payments", {
    select: (j) => (j as { payments?: SupplierPaymentRow[] }).payments ?? (Array.isArray(j) ? (j as SupplierPaymentRow[]) : []),
  })

  const s = summary.data
  const currency = s?.currency ?? "GBP"
  const indicative = s?.indicative ?? true // default to indicative until payments are wired

  const kpis: SupplierKpi[] = [
    { icon: TrendingUp, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", value: money(s?.total_earned ?? 0, currency), label: "Total earned", sub: indicative ? "Indicative" : "Lifetime", subColor: "text-slate-500" },
    { icon: Clock, iconBg: "bg-amber-50", iconColor: "text-amber-600", value: money(s?.pending_payout ?? 0, currency), label: "Pending payout", sub: "Awaiting release", subColor: "text-amber-600" },
    { icon: ShieldCheck, iconBg: "bg-blue-50", iconColor: "text-blue-600", value: money(s?.in_escrow ?? 0, currency), label: "Held / escrow", sub: "Until job approved", subColor: "text-slate-500" },
    { icon: Wallet, iconBg: "bg-violet-50", iconColor: "text-violet-600", value: money(s?.paid_out ?? 0, currency), label: "Paid out", sub: s?.jobs_paid ? `${s.jobs_paid} job${s.jobs_paid === 1 ? "" : "s"}` : "—", subColor: "text-slate-500" },
  ]

  const mobileMapping: MobileCardMapping<SupplierPaymentRow> = {
    getKey: (p) => p.id ?? Math.random().toString(36),
    title: (p) => p.job_title ?? p.job_reference ?? "Payment",
    badge: (p) => (p.status ? <SupplierStatusBadge tone={toneForStatus(p.status)}>{humaniseStatus(p.status)}</SupplierStatusBadge> : null),
    fields: [
      { label: "Gross", render: (p) => money(p.gross_amount, p.currency) },
      { label: "Fee", render: (p) => money(p.platform_fee_amount, p.currency) },
      { label: "Payout", render: (p) => money(p.payout_amount, p.currency) },
      { label: "Date", render: (p) => shortDate(p.created_at) },
    ],
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Earnings" subtitle="Payouts & payment history" />

      <SupplierPageHeader
        title="Earnings"
        subtitle="Your payout summary and payment history"
      />

      {indicative && (
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-[#EFF6FF] px-3.5 py-3">
          <Info className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
          <p className="text-[13px] text-[#1d4ed8]">
            Figures shown are <span className="font-semibold">indicative</span>. Live balances and payouts appear once payments are connected to your workspace.
          </p>
        </div>
      )}

      {summary.loading ? (
        <SupplierLoadingState rows={2} />
      ) : summary.notReady ? (
        <SupplierCard className="p-5">
          <SupplierNotReady icon={Wallet} title="Earnings coming online" description="Your payout summary appears here once payments are connected." />
        </SupplierCard>
      ) : (
        <SupplierKpiStrip kpis={kpis} />
      )}

      <SupplierCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-4 h-4 text-slate-500" />
          <h2 className="text-base font-semibold text-slate-900">Payment history</h2>
        </div>
        {payments.loading ? (
          <SupplierLoadingState rows={4} />
        ) : payments.notReady ? (
          <SupplierNotReady icon={Receipt} title="No payment records" description="Completed and paid jobs will appear here once payments are connected." />
        ) : (payments.data ?? []).length === 0 ? (
          <SupplierEmptyState
            icon={Receipt}
            title="No payments yet"
            description="When jobs are approved and released, each payment — gross amount, platform fee and your net payout — is itemised here."
          />
        ) : (
          <ResponsiveTable rows={payments.data ?? []} mobile={mobileMapping}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-left">
                  <Th>Job</Th>
                  <Th className="text-right">Gross</Th>
                  <Th className="text-right">Platform fee</Th>
                  <Th className="text-right">Your payout</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(payments.data ?? []).map((p, i) => (
                  <tr key={p.id ?? i} className="hover:bg-slate-50/60 transition-colors">
                    <Td className="font-medium text-slate-800">{p.job_title ?? p.job_reference ?? "—"}</Td>
                    <Td className="text-right text-slate-600">{money(p.gross_amount, p.currency)}</Td>
                    <Td className="text-right text-slate-500">{money(p.platform_fee_amount, p.currency)}</Td>
                    <Td className="text-right font-semibold text-emerald-700">{money(p.payout_amount, p.currency)}</Td>
                    <Td className="text-slate-600">{shortDate(p.created_at)}</Td>
                    <Td>{p.status ? <SupplierStatusBadge tone={toneForStatus(p.status)}>{humaniseStatus(p.status)}</SupplierStatusBadge> : "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTable>
        )}
      </SupplierCard>
    </div>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400", className)}>{children}</th>
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3", className)}>{children}</td>
}
