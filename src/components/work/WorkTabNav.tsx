"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, CheckSquare, Briefcase, LayoutGrid, GanttChart, Users, CalendarClock, FileBarChart2, MessageSquareWarning } from "lucide-react"

const WORK_TABS = [
  { key: "overview",   label: "Overview",   href: "/app/work",                       icon: BarChart3 },
  { key: "tasks",      label: "Tasks",      href: "/app/work/tasks",                  icon: CheckSquare },
  { key: "jobs",       label: "Jobs",       href: "/app/work/jobs",                   icon: Briefcase },
  { key: "board",      label: "Board",      href: "/app/work/board",                  icon: LayoutGrid },
  { key: "gantt",      label: "Gantt",      href: "/app/work/gantt",                  icon: GanttChart },
  { key: "ppm",        label: "PPM",        href: "/app/work/ppm/overview",           icon: CalendarClock },
  { key: "suppliers",  label: "Suppliers",  href: "/app/work/suppliers/preferred",    icon: Users },
  { key: "complaints", label: "Complaints", href: "/app/work/complaints",             icon: MessageSquareWarning },
  { key: "reports",    label: "Reports",    href: "/app/work/reports",                icon: FileBarChart2 },
]

export function WorkTabNav() {
  const pathname = usePathname()
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {WORK_TABS.map(tab => {
          const active =
            tab.href === "/app/work"
              ? pathname === "/app/work"
              : tab.key === "ppm"
              ? pathname.startsWith("/app/work/ppm")
              : tab.key === "suppliers"
              ? pathname.startsWith("/app/work/suppliers")
              : pathname.startsWith(tab.href)
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
    </div>
  )
}
