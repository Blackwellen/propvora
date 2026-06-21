"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useScrollActiveTabIntoView } from "@/hooks/useScrollActiveTabIntoView"

interface PlanningTab {
  key: string
  label: string
  href: string
}

const PLANNING_TABS: PlanningTab[] = [
  { key: "overview",              label: "Overview",              href: "/property-manager/planning" },
  { key: "profiles",             label: "Profiles",              href: "/property-manager/planning/profiles" },
  { key: "sets",                 label: "Planning Sets",         href: "/property-manager/planning/sets" },
  { key: "offers",               label: "Offers",                href: "/property-manager/planning/landlord-offers" },
  { key: "forecasts",            label: "Forecasts",             href: "/property-manager/planning/forecasts" },
  { key: "yield-intelligence",   label: "Yield Intelligence",    href: "/property-manager/planning/yield-intelligence" },
  { key: "portfolio-intelligence", label: "Portfolio Intelligence", href: "/property-manager/planning/portfolio-intelligence" },
  { key: "scenarios",            label: "Scenarios",             href: "/property-manager/planning/scenarios" },
  { key: "conversion",           label: "Conversion",            href: "/property-manager/planning/conversions" },
  { key: "activity",             label: "Activity",              href: "/property-manager/planning/activity" },
]

export function PlanningTabNav() {
  const pathname = usePathname()
  const router = useRouter()
  const activeKey = PLANNING_TABS.find(tab =>
    tab.href === "/property-manager/planning"
      ? pathname === "/property-manager/planning"
      : pathname.startsWith(tab.href)
  )?.key ?? ""
  const activeHref = PLANNING_TABS.find(t => t.key === activeKey)?.href ?? PLANNING_TABS[0].href
  const { containerRef, itemRef } = useScrollActiveTabIntoView(activeKey)

  return (
    <div className="border-b border-slate-200 bg-white sticky top-0 z-20">
      {/* Mobile dropdown — shown only below md breakpoint */}
      <div className="md:hidden px-4 py-2.5">
        <select
          value={activeHref}
          onChange={(e) => router.push(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Navigate section"
        >
          {PLANNING_TABS.map((tab) => (
            <option key={tab.key} value={tab.href}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop tab strip — hidden below md */}
      {/* relative wrapper enables after: fade to indicate scrollable tab row on narrow screens */}
      <div className="hidden md:block relative">
      <div ref={containerRef} className="flex items-center overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2 after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-8 after:bg-gradient-to-l after:from-white after:to-transparent after:pointer-events-none">
        {PLANNING_TABS.map((tab) => {
          const active = tab.key === activeKey
          return (
            <Link
              key={tab.key}
              ref={itemRef(tab.key)}
              href={tab.href}
              className={cn(
                "relative px-4 whitespace-nowrap transition-all duration-150 shrink-0",
                "h-12 text-[13px] font-medium",
                "border-b-2 -mb-px",
                active
                  ? "border-[#7C3AED] text-[#7C3AED]"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
              )}
            >
              {/* Active background highlight */}
              {active && (
                <span
                  className="absolute inset-x-1 inset-y-1.5 rounded-lg bg-[#7C3AED]/[0.07] pointer-events-none"
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </Link>
          )
        })}
      </div>
      </div>
    </div>
  )
}
