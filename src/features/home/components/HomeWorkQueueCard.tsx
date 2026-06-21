"use client"

import Link from "next/link"
import { Wrench, Zap, Droplets, ShieldCheck, ClipboardList } from "lucide-react"
import type { HomeWorkItem } from "../types"

interface HomeWorkQueueCardProps {
  items: HomeWorkItem[]
}

type DueVariant = "red" | "amber" | "blue" | "slate"

function DueBadge({ label, variant }: { label: string; variant: DueVariant }) {
  const styles: Record<DueVariant, string> = {
    red: "bg-red-50 text-red-700 border border-red-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    slate: "bg-slate-100 text-slate-600 border border-slate-200",
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${styles[variant]}`}>
      {label}
    </span>
  )
}

const WORK_ICONS = [Wrench, Zap, Droplets, ShieldCheck, Wrench]
const ICON_STYLES = [
  "bg-red-50 text-red-600",
  "bg-amber-50 text-amber-600",
  "bg-blue-50 text-blue-600",
  "bg-emerald-50 text-emerald-600",
  "bg-slate-50 text-slate-600",
]

export function HomeWorkQueueCard({ items }: HomeWorkQueueCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-slate-900">Work queue</h3>
        <Link href="/property-manager/work" className="text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors">
          View all →
        </Link>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 py-6">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
              <ClipboardList className="text-slate-300" style={{ width: 20, height: 20 }} />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-medium text-slate-600">No open work orders</p>
              <p className="text-[12px] text-slate-400 mt-0.5">New jobs will appear here</p>
            </div>
            <Link href="/property-manager/work" className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              Go to work queue →
            </Link>
          </div>
        ) : (
          items.map((item, idx) => {
            const IconComp = WORK_ICONS[idx % WORK_ICONS.length]
            const iconStyle = ICON_STYLES[idx % ICON_STYLES.length]
            return (
              <Link
                key={item.id}
                href={item.href ?? "/property-manager/work/tasks"}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconStyle}`}>
                  <IconComp style={{ width: 14, height: 14 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </p>
                  {(item.property || item.unit) && (
                    <p className="text-[11px] text-slate-500 truncate">
                      {item.property}{item.unit ? ` · ${item.unit}` : ""}
                    </p>
                  )}
                </div>
                <DueBadge label={item.dueLabel} variant={item.dueVariant} />
              </Link>
            )
          })
        )}
      </div>

      <div className="pt-2 border-t border-slate-100">
        <Link href="/property-manager/work" className="text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors">
          View all work orders →
        </Link>
      </div>
    </div>
  )
}
