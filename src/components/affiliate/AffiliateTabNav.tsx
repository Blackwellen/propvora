"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Link2,
  Users,
  DollarSign,
  Settings,
} from "lucide-react"

interface AffiliateTabNavProps {
  /** Base path the section is mounted at, e.g. "/property-manager/affiliates" or "/user/affiliate". */
  basePath: string
}

export function AffiliateTabNav({ basePath }: AffiliateTabNavProps) {
  const pathname = usePathname()

  const tabs = [
    { key: "overview",  label: "Overview",  href: basePath,                  icon: LayoutDashboard },
    { key: "links",     label: "Links",     href: `${basePath}/links`,       icon: Link2 },
    { key: "referrals", label: "Referrals", href: `${basePath}/referrals`,   icon: Users },
    { key: "earnings",  label: "Earnings",  href: `${basePath}/earnings`,    icon: DollarSign },
    { key: "settings",  label: "Settings",  href: `${basePath}/settings`,    icon: Settings },
  ] as const

  return (
    <div className="border-b border-slate-200 bg-white shadow-[0_1px_0_0_#e2e8f0]">
      <div
        className="flex items-end gap-0 overflow-x-auto px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        role="tablist"
        aria-label="Affiliate navigation"
      >
        {tabs.map((tab) => {
          const active =
            tab.href === basePath
              ? pathname === basePath
              : pathname.startsWith(tab.href)
          const Icon = tab.icon

          return (
            <Link
              key={tab.key}
              href={tab.href}
              role="tab"
              aria-selected={active}
              className={cn(
                "relative flex items-center gap-1.5 px-4 py-3.5 text-[13px] font-medium whitespace-nowrap",
                "border-b-2 -mb-px transition-colors duration-150 outline-none",
                "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded-t",
                active
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              )}
            >
              <Icon
                className={cn(
                  "w-[15px] h-[15px] shrink-0 transition-colors duration-150",
                  active ? "text-blue-600" : "text-slate-400"
                )}
              />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
