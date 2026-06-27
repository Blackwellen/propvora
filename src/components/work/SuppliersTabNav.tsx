"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const SUPPLIER_TABS = [
  { key: "overview",     label: "Overview",     href: "/property-manager/work/suppliers" },
  { key: "directory",    label: "Directory",    href: "/property-manager/work/suppliers/preferred" },
  { key: "compliance",   label: "Compliance",   href: "/property-manager/work/suppliers/compliance" },
  { key: "performance",  label: "Performance",  href: "/property-manager/work/suppliers/performance" },
]

export function SuppliersTabNav() {
  const pathname = usePathname()
  const router = useRouter()

  // Overview is the root /suppliers route, so only match it exactly — otherwise it
  // would also match the more specific /suppliers/preferred path.
  const isActive = (href: string) =>
    href === "/property-manager/work/suppliers"
      ? pathname === href
      : pathname.startsWith(href)

  const activeHref = SUPPLIER_TABS.find((tab) => isActive(tab.href))?.href ?? SUPPLIER_TABS[0].href

  return (
    <div className="border-b border-slate-200 bg-white">
      {/* Mobile dropdown — shown only below md breakpoint */}
      <div className="md:hidden px-4 py-2.5">
        <select
          value={activeHref}
          onChange={(e) => router.push(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)]"
          aria-label="Navigate section"
        >
          {SUPPLIER_TABS.map((tab) => (
            <option key={tab.key} value={tab.href}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop tab strip — hidden below md */}
      <div className="hidden md:flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {SUPPLIER_TABS.map((tab) => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "px-5 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
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
    </div>
  )
}
