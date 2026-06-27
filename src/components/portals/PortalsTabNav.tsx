"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const PORTALS_TABS = [
  { key: "overview",  label: "Overview",      href: "/property-manager/portals" },
  { key: "access",    label: "Access Grants", href: "/property-manager/portals/access" },
  { key: "profiles",  label: "Profiles",      href: "/property-manager/portals/profiles" },
  { key: "purposes",  label: "Purposes",      href: "/property-manager/portals/purposes" },
] as const

export function PortalsTabNav() {
  const pathname = usePathname()
  const router = useRouter()

  const activeHref = PORTALS_TABS.find((tab) =>
    tab.href === "/property-manager/portals"
      ? pathname === "/property-manager/portals"
      : pathname.startsWith(tab.href)
  )?.href ?? PORTALS_TABS[0].href

  return (
    <div className="border-b border-slate-200 bg-white shadow-sm">
      {/* Mobile dropdown — shown only below md breakpoint */}
      <div className="md:hidden px-4 py-2.5">
        <select
          value={activeHref}
          onChange={(e) => router.push(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)]"
          aria-label="Navigate section"
        >
          {PORTALS_TABS.map((tab) => (
            <option key={tab.key} value={tab.href}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop tab strip — hidden below md */}
      <div className="hidden md:block relative">
        <div
          className="flex items-end gap-0 overflow-x-auto px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          role="tablist"
          aria-label="Portals navigation"
        >
          {PORTALS_TABS.map((tab) => {
            const active =
              tab.href === "/property-manager/portals"
                ? pathname === "/property-manager/portals"
                : pathname.startsWith(tab.href)

            return (
              <Link
                key={tab.key}
                href={tab.href}
                role="tab"
                aria-selected={active}
                className={cn(
                  "px-4 py-3.5 text-[13px] font-medium whitespace-nowrap",
                  "border-b-2 -mb-px transition-colors duration-150 outline-none",
                  "focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1 rounded-t",
                  active
                    ? "border-[var(--brand)] text-[var(--brand)]"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
        {/* Right-fade — not clipped by the scrollable container */}
        <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" aria-hidden="true" />
      </div>
    </div>
  )
}
