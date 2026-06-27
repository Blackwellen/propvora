"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { label: "Overview",   href: "/property-manager/portfolio" },
  { label: "Properties", href: "/property-manager/portfolio/properties" },
  { label: "Units",      href: "/property-manager/portfolio/units" },
  { label: "Tenancies",  href: "/property-manager/portfolio/tenancies" },
]

export function PortfolioSectionTabs() {
  const pathname = usePathname()
  const router = useRouter()

  const activeHref = TABS.find((tab) =>
    tab.href === "/property-manager/portfolio"
      ? pathname === "/property-manager/portfolio"
      : pathname.startsWith(tab.href)
  )?.href ?? TABS[0].href

  return (
    <>
      {/* Mobile dropdown — shown only below md breakpoint */}
      <div className="md:hidden border-b border-slate-200 mb-5 -mt-1 pb-2.5">
        <select
          value={activeHref}
          onChange={(e) => router.push(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)]"
          aria-label="Navigate section"
        >
          {TABS.map((tab) => (
            <option key={tab.href} value={tab.href}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop tab strip — hidden below md */}
      <div className="hidden md:flex items-center gap-0 border-b border-slate-200 mb-5 -mt-1">
        {TABS.map((tab) => {
          const active =
            tab.href === "/property-manager/portfolio"
              ? pathname === "/property-manager/portfolio"
              : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px whitespace-nowrap transition-all duration-150",
                active
                  ? "border-[var(--brand)] text-[var(--brand)]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </>
  )
}
