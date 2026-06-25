"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const PPM_TABS = [
  { key: "overview",   label: "Overview",   href: "/property-manager/work/ppm/overview" },
  { key: "schedules",  label: "Schedules",  href: "/property-manager/work/ppm/schedules" },
  { key: "timeline",   label: "Timeline",   href: "/property-manager/work/ppm/timeline" },
]

export function PpmTabNav() {
  const pathname = usePathname()
  const router = useRouter()

  const activeHref = PPM_TABS.find((tab) => pathname.startsWith(tab.href))?.href ?? PPM_TABS[0].href

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
          {PPM_TABS.map((tab) => (
            <option key={tab.key} value={tab.href}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop tab strip — hidden below md */}
      <div className="hidden md:flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {PPM_TABS.map((tab) => {
          const active = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "px-5 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
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
  )
}
