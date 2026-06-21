"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { SupplierCard } from "@/components/supplier-workspace/ui"
import { moneyPence, shortDate } from "@/components/supplier-workspace/format"

export interface PayoutJob {
  id: string
  title: string
  ref: string
  href: string
  completedAt: string | null
  netPence: number
  feePence: number
}

export interface PayoutJobsListProps {
  jobs: PayoutJob[]
  netPence: number
  currency: string
}

export function PayoutJobsList({ jobs, netPence, currency }: PayoutJobsListProps) {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Jobs in this payout</h2>
      <div className="divide-y divide-slate-100">
        {jobs.map((j) => (
          <Link
            key={j.id}
            href={j.href}
            className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate">{j.title}</p>
              <p className="text-xs text-slate-400">
                {j.ref} · completed {shortDate(j.completedAt)}
              </p>
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
        <span className="text-base font-bold text-slate-900">{moneyPence(netPence, currency)}</span>
      </div>
    </SupplierCard>
  )
}
