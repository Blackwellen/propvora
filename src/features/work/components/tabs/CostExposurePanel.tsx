import React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface CostExposureData {
  overdue: number
  atRisk: number
  pending: number
  total: number
}

interface CostExposurePanelProps {
  costExposure: CostExposureData | null
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)
}

export function CostExposurePanel({ costExposure }: CostExposurePanelProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-1">Cost Exposure</h2>
      <p className="text-3xl font-bold text-slate-900 mt-2 leading-none">{fmt(costExposure?.total ?? 8420)}</p>
      <p className="text-xs text-slate-500 mb-4">Potential Exposure</p>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            Overdue
          </span>
          <span className="font-semibold text-red-600">{fmt(costExposure?.overdue ?? 4250)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            At Risk
          </span>
          <span className="font-semibold text-amber-600">{fmt(costExposure?.atRisk ?? 2950)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
            Pending Quotes
          </span>
          <span className="font-semibold text-blue-600">{fmt(costExposure?.pending ?? 1220)}</span>
        </div>
      </div>
      <Link
        href="/property-manager/work/jobs"
        className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]"
      >
        View Financial Impact <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
