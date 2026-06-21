"use client"

import { PoundSterling, CalendarClock, Sparkles, CircleDot } from "lucide-react"
import { SupplierCard } from "@/components/supplier-workspace/ui"
import { moneyPence, expiryLabel } from "@/components/supplier-workspace/format"
import type { PipelineRequest } from "@/features/supplier/requests/data/types"

function Kpi({ icon: Icon, label, value }: { icon: typeof PoundSterling; label: string; value: string }) {
  return (
    <SupplierCard className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <p className="text-lg font-bold mt-1 text-slate-900">{value}</p>
    </SupplierCard>
  )
}

export interface QuoteOverviewTabProps {
  request: PipelineRequest | null
}

export function QuoteOverviewTab({ request: r }: QuoteOverviewTabProps) {
  const amount = r?.quoteAmountPence ?? null
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={PoundSterling} label="Value" value={moneyPence(r?.quoteIncVatPence ?? amount)} />
        <Kpi icon={CalendarClock} label="Expiry" value={r?.quoteExpiresAt ? expiryLabel(r.quoteExpiresAt) : "—"} />
        <Kpi icon={Sparkles} label="Win chance" value={r?.winChance != null ? `${r.winChance}%` : "—"} />
        <Kpi icon={CircleDot} label="Status" value={r?.quoteStatus ? r.quoteStatus.replace(/_/g, " ") : "Draft"} />
      </div>
      <SupplierCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">Quote overview</h2>
        </div>
        <p className="text-sm text-slate-600">{r?.scopeSummary || "Quote details appear here."}</p>
        {r && <p className="mt-2 text-sm text-slate-400">For {r.requesterCompany} · {r.serviceTitle}</p>}
      </SupplierCard>
    </div>
  )
}
