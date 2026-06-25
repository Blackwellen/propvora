"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { PLANNING_SET_TABS } from "@/lib/planning/types"

interface PlanningSetTabStripProps {
  planningSetId: string
}

export function PlanningSetTabStrip({ planningSetId }: PlanningSetTabStripProps) {
  const pathname = usePathname()
  const router = useRouter()
  const base = `/property-manager/planning/sets/${planningSetId}`

  const activeTab = PLANNING_SET_TABS.find((tab) => {
    const href = `${base}/${tab.slug}`
    return pathname === href || pathname.startsWith(`${href}/`)
  }) ?? PLANNING_SET_TABS[0]

  return (
    <>
      {/* Mobile: dropdown select — shown below md */}
      <div className="md:hidden py-2">
        <select
          value={`${base}/${activeTab.slug}`}
          onChange={(e) => router.push(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED]"
          aria-label="Navigate planning set section"
        >
          {PLANNING_SET_TABS.map((tab) => (
            <option key={tab.slug} value={`${base}/${tab.slug}`}>
              {tab.num}. {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: scrollable tab strip — hidden below md */}
      <div className="hidden md:block overflow-x-auto [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center min-w-max">
          {PLANNING_SET_TABS.map((tab) => {
            const href = `${base}/${tab.slug}`
            const isActive = tab.slug === activeTab.slug
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
    </>
  )
}
