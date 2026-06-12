"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, KeyRound, IdCard, Target } from "lucide-react"

const PORTALS_TABS = [
  { key: "overview", label: "Overview", href: "/app/portals", icon: LayoutDashboard },
  { key: "access", label: "Access Grants", href: "/app/portals/access", icon: KeyRound },
  { key: "profiles", label: "Profiles", href: "/app/portals/profiles", icon: IdCard },
  { key: "purposes", label: "Purposes", href: "/app/portals/purposes", icon: Target },
] as const

export function PortalsTabNav() {
  const pathname = usePathname()

  return (
    <div className="border-b border-slate-200 bg-white shadow-[0_1px_0_0_#e2e8f0]">
      <div
        className="flex items-end gap-0 overflow-x-auto px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        role="tablist"
        aria-label="Portals navigation"
      >
        {PORTALS_TABS.map((tab) => {
          const active =
            tab.href === "/app/portals"
              ? pathname === "/app/portals"
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
