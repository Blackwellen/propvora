"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, CalendarRange, GanttChart, Users, FileBarChart2 } from "lucide-react"

const PPM_TABS = [
  { key: "overview",   label: "Overview",   href: "/app/work/ppm/overview",   icon: BarChart3 },
  { key: "schedules",  label: "Schedules",  href: "/app/work/ppm/schedules",  icon: CalendarRange },
  { key: "timeline",   label: "Timeline",   href: "/app/work/ppm/timeline",   icon: GanttChart },
  { key: "suppliers",  label: "Suppliers",  href: "/app/work/ppm/suppliers",  icon: Users },
  { key: "reports",    label: "Reports",    href: "/app/work/ppm/reports",    icon: FileBarChart2 },
]

export function PpmTabNav() {
  const pathname = usePathname()
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {PPM_TABS.map((tab) => {
          const active = pathname.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
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
    </div>
  )
}
