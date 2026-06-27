"use client"

import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  DollarSign,
  Receipt,
  Scale,
  Calculator,
  ListChecks,
  AlertTriangle,
  MessageSquare,
} from "lucide-react"
import type { LucideProps } from "lucide-react"
import { cn } from "@/lib/utils"
import { PROFILE_TABS } from "@/lib/planning/profile-config"
import type { ProfileConfig } from "@/lib/planning/profile-config"

type TabIconMap = Record<string, React.ComponentType<LucideProps>>

const TAB_ICON_MAP: TabIconMap = {
  overview: LayoutDashboard,
  "income-model": DollarSign,
  "cost-drivers": Receipt,
  compliance: Scale,
  "example-forecast": Calculator,
  "starter-checklist": ListChecks,
  risks: AlertTriangle,
  "ai-questions": MessageSquare,
}

interface ProfileTabsProps {
  profile: ProfileConfig
  activeTab: string
}

export default function ProfileTabs({ profile, activeTab }: ProfileTabsProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleTabClick = (tabSlug: string) => {
    router.push(`/property-manager/planning/profiles/${profile.slug}/${tabSlug}`)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
      <div
        className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        role="tablist"
        aria-label="Profile sections"
      >
        {PROFILE_TABS.map((tab, index) => {
          const isActive = activeTab === tab.slug
          const Icon = TAB_ICON_MAP[tab.slug] ?? LayoutDashboard
          const tabNumber = (index + 1).toString().padStart(2, "0")

          return (
            <button
              key={tab.slug}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.slug}`}
              onClick={() => handleTabClick(tab.slug)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap",
                "transition-all duration-150 shrink-0 border-b-2",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand)]",
                isActive
                  ? "border-b-transparent text-white"
                  : "border-b-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
              style={
                isActive
                  ? { backgroundColor: profile.accentColor, borderBottomColor: "transparent" }
                  : undefined
              }
            >
              {/* Tab number badge */}
              <span
                className={cn(
                  "text-[9px] font-bold leading-none rounded px-1 py-0.5",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-400"
                )}
                aria-hidden="true"
              >
                {tabNumber}
              </span>

              {/* Icon */}
              <Icon
                className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-white" : "text-slate-400")}
                aria-hidden="true"
              />

              {/* Label */}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
