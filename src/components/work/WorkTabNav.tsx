"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useScrollActiveTabIntoView } from "@/hooks/useScrollActiveTabIntoView"

const WORK_TABS = [
  { key: "overview",   label: "Overview",   href: "/property-manager/work" },
  { key: "tasks",      label: "Tasks",      href: "/property-manager/work/tasks" },
  { key: "jobs",       label: "Jobs",       href: "/property-manager/work/jobs" },
  { key: "board",      label: "Board",      href: "/property-manager/work/board" },
  { key: "gantt",      label: "Gantt",      href: "/property-manager/work/gantt" },
  { key: "ppm",        label: "PPM",        href: "/property-manager/work/ppm/overview" },
  { key: "suppliers",  label: "Suppliers",  href: "/property-manager/work/suppliers/preferred" },
  { key: "complaints", label: "Complaints", href: "/property-manager/work/complaints" },
  { key: "reports",    label: "Reports",    href: "/property-manager/work/reports" },
]

export function WorkTabNav() {
  const pathname = usePathname()
  const router = useRouter()
  const activeKey = WORK_TABS.find(tab =>
    tab.href === "/property-manager/work"
      ? pathname === "/property-manager/work"
      : tab.key === "ppm"
      ? pathname.startsWith("/property-manager/work/ppm")
      : tab.key === "suppliers"
      ? pathname.startsWith("/property-manager/work/suppliers")
      : pathname.startsWith(tab.href)
  )?.key ?? ""
  const activeHref = WORK_TABS.find(t => t.key === activeKey)?.href ?? WORK_TABS[0].href
  const { containerRef, itemRef } = useScrollActiveTabIntoView(activeKey)
  return (
    <div className="border-b border-slate-200 bg-white">
      {/* Mobile dropdown — shown only below md breakpoint */}
      <div className="md:hidden px-4 py-2.5">
        <select
          value={activeHref}
          onChange={(e) => router.push(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Navigate section"
        >
          {WORK_TABS.map((tab) => (
            <option key={tab.key} value={tab.href}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop tab strip — hidden below md */}
      {/* relative wrapper enables after: fade to indicate scrollable tab row on narrow screens */}
      <div className="hidden md:block relative">
      <div ref={containerRef} className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-8 after:bg-gradient-to-l after:from-white after:to-transparent after:pointer-events-none">
        {WORK_TABS.map(tab => {
          const active = tab.key === activeKey
          return (
            <Link
              key={tab.key}
              ref={itemRef(tab.key)}
              href={tab.href}
              className={cn(
                "px-3 sm:px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
                active
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
      </div>
    </div>
  )
}
