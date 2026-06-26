"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface AffiliateTabNavProps {
  /** Base path the section is mounted at, e.g. "/property-manager/affiliates" or "/user/affiliate". */
  basePath: string
}

export function AffiliateTabNav({ basePath }: AffiliateTabNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const tabs = [
    { key: "overview",  label: "Overview",  href: basePath },
    { key: "links",     label: "Links",     href: `${basePath}/links` },
    { key: "referrals", label: "Referrals", href: `${basePath}/referrals` },
    { key: "network",   label: "Network",   href: `${basePath}/network` },
    { key: "earnings",  label: "Earnings",  href: `${basePath}/earnings` },
    { key: "settings",  label: "Settings",  href: `${basePath}/settings` },
  ] as const

  const activeHref = tabs.find((tab) =>
    tab.href === basePath ? pathname === basePath : pathname.startsWith(tab.href)
  )?.href ?? tabs[0].href

  return (
    <div className="border-b border-slate-200 bg-white shadow-[0_1px_0_0_#e2e8f0]">
      {/* Mobile dropdown — shown only below md breakpoint */}
      <div className="md:hidden px-4 py-2.5">
        <select
          value={activeHref}
          onChange={(e) => router.push(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Navigate section"
        >
          {tabs.map((tab) => (
            <option key={tab.key} value={tab.href}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop tab strip — hidden below md */}
      <div
        className="hidden md:flex items-end gap-0 overflow-x-auto px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        role="tablist"
        aria-label="Affiliate navigation"
      >
        {tabs.map((tab) => {
          const active =
            tab.href === basePath
              ? pathname === basePath
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
                "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded-t",
                active
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
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
