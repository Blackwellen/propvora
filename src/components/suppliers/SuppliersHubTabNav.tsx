"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, BookUser, ShieldCheck, TrendingUp } from "lucide-react"

const TABS = [
  { key: "overview",     label: "Overview",     href: "/app/suppliers",              icon: BarChart3   },
  { key: "directory",    label: "Directory",    href: "/app/suppliers/directory",    icon: BookUser    },
  { key: "compliance",   label: "Compliance",   href: "/app/suppliers/compliance",   icon: ShieldCheck },
  { key: "performance",  label: "Performance",  href: "/app/suppliers/performance",  icon: TrendingUp  },
]

export function SuppliersHubTabNav() {
  const pathname = usePathname()
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {TABS.map((tab) => {
          // Overview tab: exact match. Others: startsWith.
          const active =
            tab.key === "overview"
              ? pathname === tab.href || pathname === "/property-manager/suppliers"
              : pathname.startsWith(tab.href)
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
