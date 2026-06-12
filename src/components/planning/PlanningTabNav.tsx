"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Layers,
  FolderOpen,
  Handshake,
  TrendingUp,
  GitBranch,
  ArrowRightLeft,
  Activity,
  BarChart3,
  Zap,
} from "lucide-react"

interface PlanningTab {
  key: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const PLANNING_TABS: PlanningTab[] = [
  { key: "overview",              label: "Overview",              href: "/app/planning",                        icon: LayoutDashboard },
  { key: "profiles",             label: "Profiles",              href: "/app/planning/profiles",               icon: Layers },
  { key: "sets",                 label: "Planning Sets",         href: "/app/planning/sets",                   icon: FolderOpen },
  { key: "offers",               label: "Offers",                href: "/app/planning/landlord-offers",        icon: Handshake },
  { key: "forecasts",            label: "Forecasts",             href: "/app/planning/forecasts",              icon: TrendingUp },
  { key: "yield-intelligence",   label: "Yield Intelligence",    href: "/app/planning/yield-intelligence",     icon: Zap },
  { key: "portfolio-intelligence", label: "Portfolio Intelligence", href: "/app/planning/portfolio-intelligence", icon: BarChart3 },
  { key: "scenarios",            label: "Scenarios",             href: "/app/planning/scenarios",              icon: GitBranch },
  { key: "conversion",           label: "Conversion",            href: "/app/planning/conversions",            icon: ArrowRightLeft },
  { key: "activity",             label: "Activity",              href: "/app/planning/activity",               icon: Activity },
]

export function PlanningTabNav() {
  const pathname = usePathname()

  return (
    <div className="border-b border-slate-200 bg-white sticky top-0 z-20">
      <div className="flex items-center overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2">
        {PLANNING_TABS.map((tab) => {
          const active =
            tab.href === "/app/planning"
              ? pathname === "/app/planning"
              : pathname.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "relative flex items-center gap-2 px-4 whitespace-nowrap transition-all duration-150 shrink-0",
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
              <Icon className="w-4 h-4 shrink-0 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
