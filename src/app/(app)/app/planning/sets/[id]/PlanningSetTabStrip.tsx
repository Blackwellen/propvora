"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { PLANNING_SET_TABS } from "@/lib/planning/types"

interface PlanningSetTabStripProps {
  planningSetId: string
}

export function PlanningSetTabStrip({ planningSetId }: PlanningSetTabStripProps) {
  const pathname = usePathname()
  const base = `/property-manager/planning/sets/${planningSetId}`

  return (
    <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden">
      <div className="flex items-center min-w-max">
        {PLANNING_SET_TABS.map((tab) => {
          const href = `${base}/${tab.slug}`
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={tab.slug}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-all flex-shrink-0",
                isActive
                  ? "border-[#7C3AED] text-[#7C3AED]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold leading-none flex-shrink-0",
                  isActive
                    ? "bg-[#7C3AED] text-white"
                    : "bg-slate-100 text-slate-400"
                )}
              >
                {tab.num}
              </span>
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
