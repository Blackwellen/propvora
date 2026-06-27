"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSectionBasePath, resolveSectionHref } from "@/components/sections/SectionBasePath"
import {
  CalendarRange,
  CalendarDays,
  Calendar,
  List,
  GanttChart,
} from "lucide-react"

const VIEW_TABS = [
  {
    key:   "month",
    label: "Month",
    href:  "/property-manager/calendar/views/month",
    icon:  CalendarRange,
  },
  {
    key:   "week",
    label: "Week",
    href:  "/property-manager/calendar/views/week",
    icon:  CalendarDays,
  },
  {
    key:   "day",
    label: "Day",
    href:  "/property-manager/calendar/views/day",
    icon:  Calendar,
  },
  {
    key:   "agenda",
    label: "Agenda",
    href:  "/property-manager/calendar/views/agenda",
    icon:  List,
  },
  {
    key:   "gantt",
    label: "Gantt",
    href:  "/property-manager/calendar/views/gantt",
    icon:  GanttChart,
  },
] as const

export default function CalendarViewsSwitcher() {
  const rawPathname = usePathname()
  const ctx = useSectionBasePath()
  // Rebase the live pathname back onto /property-manager/calendar so active-state
  // matching works identically whether mounted under /app or /supplier.
  const pathname =
    ctx && rawPathname.startsWith(ctx.base)
      ? "/property-manager/calendar" + rawPathname.slice(ctx.base.length)
      : rawPathname

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {VIEW_TABS.map((tab) => {
        const active = pathname.startsWith(tab.href)
        const Icon = tab.icon
        return (
          <Link
            key={tab.key}
            href={resolveSectionHref(tab.href, ctx)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 border",
              active
                ? "bg-[var(--brand)] text-white border-[var(--brand)] shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
