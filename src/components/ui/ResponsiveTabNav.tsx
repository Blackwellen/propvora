"use client"

/**
 * ResponsiveTabNav — handles 2–15 tabs responsively.
 *
 * Desktop (md: and above):
 *   Horizontal scrollable tab bar with fade gradient on the right side
 *   to indicate overflowing tabs. Active tab auto-scrolls into view.
 *
 * Mobile (below md:):
 *   Native <select> dropdown — zero JS, full a11y, works in PWA.
 *   Navigates via router.push on change.
 *
 * Props:
 *   tabs      — array of { label, href, active }
 *   className — optional extra classes on the outer wrapper
 *
 * Usage:
 *   <ResponsiveTabNav
 *     tabs={[
 *       { label: "Overview", href: "/property-manager/money", active: pathname === "/property-manager/money" },
 *       { label: "Income",   href: "/property-manager/money/income", active: pathname.startsWith("/property-manager/money/income") },
 *     ]}
 *   />
 */

import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useScrollActiveTabIntoView } from "@/hooks/useScrollActiveTabIntoView"

export interface ResponsiveTabNavItem {
  label: string
  href: string
  active: boolean
  /** Optional lock icon / badge element rendered after the label */
  badge?: React.ReactNode
}

interface ResponsiveTabNavProps {
  tabs: ResponsiveTabNavItem[]
  /** Optional right-aligned slot (e.g. action buttons) shown on md: and above */
  actions?: React.ReactNode
  className?: string
  "aria-label"?: string
}

export function ResponsiveTabNav({
  tabs,
  actions,
  className,
  "aria-label": ariaLabel = "Section navigation",
}: ResponsiveTabNavProps) {
  const router = useRouter()
  const activeHref = tabs.find(t => t.active)?.href ?? tabs[0]?.href ?? ""
  const { containerRef, itemRef } = useScrollActiveTabIntoView(activeHref)

  return (
    <div className={cn("border-b border-slate-200 bg-white", className)}>
      {/* Mobile select dropdown — shown only below md */}
      <div className="md:hidden px-4 py-2.5">
        <select
          value={activeHref}
          onChange={(e) => router.push(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label={ariaLabel}
        >
          {tabs.map((tab) => (
            <option key={tab.href} value={tab.href}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop scrollable tab bar — hidden below md */}
      <div className="hidden md:flex items-center justify-between">
        <div className="relative flex-1 min-w-0">
          <div
            ref={containerRef}
            role="tablist"
            aria-label={ariaLabel}
            className="flex items-center gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                ref={itemRef(tab.href)}
                href={tab.href}
                role="tab"
                aria-selected={tab.active}
                className={cn(
                  "flex items-center gap-1.5 px-4 md:px-5 py-3.5",
                  "text-[13px] font-medium whitespace-nowrap",
                  "border-b-2 -mb-px transition-all duration-150",
                  "outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded-t",
                  tab.active
                    ? "border-[#2563EB] text-[#2563EB]"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                {tab.label}
                {tab.badge && <span className="ml-0.5">{tab.badge}</span>}
              </Link>
            ))}
          </div>
          <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" aria-hidden="true" />
        </div>
        {actions && (
          <div className="px-4 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  )
}
