"use client"

import { Wallet, Clock, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileTopBar, ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import {
  SupplierPageHeader, SupplierCard, SupplierLoadingState, SupplierEmptyState,
  SupplierStatusBadge, SupplierKpiStrip, SupplierBanner,
  toneForStatus, humaniseStatus, type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { moneyPence, shortDate } from "@/components/supplier-workspace/format"
import type { SupplierPayoutRow, SupplierPayoutSummary } from "@/components/supplier-workspace/types"

export default function SupplierPayoutsPage() {
  const data = useSupplierApi<{ items: SupplierPayoutRow[]; summary: SupplierPayoutSummary }>(
    useSupplierApiUrl("/api/supplier/payouts"),
    { select: (j) => j as { items: SupplierPayoutRow[]; summary: SupplierPayoutSummary } }
  )
  const items = data.data?.items ?? []
  const s = data.data?.summary
  const ccy = s?.currency ?? "GBP"

  const kpis: SupplierKpi[] = [
    { icon: CheckCircle2, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", value: s ? moneyPence(s.paidPence, ccy) : "—", label: "Paid out", sub: "Lifetime", subColor: "text-slate-500" },
    { icon: Clock, iconBg: "bg-amber-50", iconColor: "text-amber-600", value: s ? moneyPence(s.pendingPence, ccy) : "—", label: "Pending", sub: "In transit", subColor: "text-slate-500" },
    { icon: XCircle, iconBg: "bg-red-50", iconColor: "text-red-600", value: s ? moneyPence(s.failedPence, ccy) : "—", label: "Failed / reversed", sub: "Needs attention", subColor: "text-slate-500" },
    { icon: Wallet, iconBg: "bg-blue-50", iconColor: "text-blue-600", value: s ? String(s.count) : "—", label: "Total payouts" },
  ]

  const mobileMapping: MobileCardMapping<SupplierPayoutRow> = {
    getKey: (p) => p.id,
    title: (p) => moneyPence(p.amount_pence, p.currency),
    subtitle: (p) => shortDate(p.created_at),
    badge: (p) => <SupplierStatusBadge tone={toneForStatus(p.status)}>{humaniseStatus(p.status)}</SupplierStatusBadge>,
    fields: [{ label: "Transfer", render: (p) => p.stripe_transfer_id ?? "—" }],
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Payouts" subtitle="Settled funds" />
      <SupplierPageHeader title="Payouts" subtitle="Funds transferred to your connected account. Payouts are issued automatically as work is approved and paid." />

      <SupplierBanner tone="blue">Payouts are created by the platform when a property manager releases payment — you don&apos;t request them here.</SupplierBanner>

      <SupplierKpiStrip kpis={kpis} />

      {data.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={4} /></SupplierCard>
      ) : items.length === 0 ? (
        <SupplierCard className="p-5">
          <SupplierEmptyState
            icon={Wallet}
            title="No payouts yet"
            description="Once you complete jobs and the property manager releases payment, your payouts to your connected account appear here."
          />
        </SupplierCard>
      ) : (
        <ResponsiveTable rows={items} mobile={mobileMapping}>
          <SupplierCard className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-left">
                  <Th>Amount</Th><Th>Date</Th><Th>Transfer ID</Th><Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <Td className="font-semibold text-slate-800">{moneyPence(p.amount_pence, p.currency)}</Td>
                    <Td className="text-slate-600">{shortDate(p.created_at)}</Td>
                    <Td className="text-slate-500 font-mono text-xs">{p.stripe_transfer_id ?? "—"}</Td>
                    <Td><SupplierStatusBadge tone={toneForStatus(p.status)}>{humaniseStatus(p.status)}</SupplierStatusBadge></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SupplierCard>
        </ResponsiveTable>
      )}
    </div>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400", className)}>{children}</th>
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top", className)}>{children}</td>
}
