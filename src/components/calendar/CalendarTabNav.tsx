"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  GitBranch,
  FileText,
  Bell,
} from "lucide-react"

const CALENDAR_TABS = [
  {
    key:  "overview",
    label: "Overview",
    href:  "/app/calendar",
    icon:  LayoutDashboard,
    /** exact match only */
    exact: true,
  },
  {
    key:  "views",
    label: "Calendar Views",
    href:  "/app/calendar/views",
    icon:  CalendarDays,
    exact: false,
    /** also active for old per-view routes that have been migrated under /views */
    legacyPrefixes: [
      "/app/calendar/month",
      "/app/calendar/week",
      "/app/calendar/day",
      "/app/calendar/agenda",
      "/app/calendar/gantt",
    ],
  },
  {
    key:   "schedule",
    label: "Schedule",
    href:  "/app/calendar/schedule",
    icon:  ClipboardList,
    exact: false,
  },
  {
    key:   "timeline",
    label: "Timeline",
    href:  "/app/calendar/timeline",
    icon:  GitBranch,
    exact: false,
  },
  {
    key:   "events",
    label: "Events",
    href:  "/app/calendar/events",
    icon:  FileText,
    exact: false,
  },
  {
    key:   "reminders",
    label: "Reminders",
    href:  "/app/calendar/reminders",
    icon:  Bell,
    exact: false,
  },
] as const

export function CalendarTabNav({ actions }: { actions?: React.ReactNode }) {
  const pathname = usePathname()

  function isActive(tab: (typeof CALENDAR_TABS)[number]): boolean {
    if (tab.exact) {
      return pathname === tab.href
    }
    if (pathname.startsWith(tab.href)) return true
    if ("legacyPrefixes" in tab && tab.legacyPrefixes) {
      return tab.legacyPrefixes.some((prefix) => pathname.startsWith(prefix))
    }
    return false
  }

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {CALENDAR_TABS.map((tab) => {
            const active = isActive(tab)
            const Icon = tab.icon
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
                  active
                    ? "border-[#2563EB] text-[#2563EB]"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </Link>
            )
          })}
        </div>
        {actions && <div className="px-4 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
