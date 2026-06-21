"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSectionBasePath, resolveSectionHref } from "@/components/sections/SectionBasePath"
import { useScrollActiveTabIntoView } from "@/hooks/useScrollActiveTabIntoView"

/**
 * Route-aware horizontal tab strip for the Automations module.
 * Active tab = blue underline + bold. Tabs follow the canonical order.
 * URLs use the public /property-manager/... prefix (rewrites to /app/...).
 *
 * When mounted inside another workspace (e.g. /supplier/automations) via
 * SectionBasePathProvider, hrefs + active-detection are rebased onto that prefix.
 */

export interface AutomationsTab {
  label: string
  href: string
  /** path fragments (under /app) that mark this tab active */
  match: string[]
  badge?: number
}

export const AUTOMATIONS_TABS: AutomationsTab[] = [
  { label: "Home", href: "/property-manager/automations/home", match: ["/automations", "/automations/home"] },
  { label: "Recipes", href: "/property-manager/automations/recipes", match: ["/automations/recipes", "/automations/templates"] },
  { label: "My Automations", href: "/property-manager/automations/my-automations", match: ["/automations/my-automations"] },
  { label: "Canvas Builder", href: "/property-manager/automations/canvas", match: ["/automations/canvas", "/automations/builder"] },
  { label: "AI Builder", href: "/property-manager/automations/ai-builder", match: ["/automations/ai-builder"] },
  { label: "Runs & Logs", href: "/property-manager/automations/runs-logs", match: ["/automations/runs-logs", "/automations/runs"] },
  { label: "Review Inbox", href: "/property-manager/automations/approvals", match: ["/automations/approvals"] },
  { label: "Errors", href: "/property-manager/automations/errors", match: ["/automations/errors"] },
  { label: "Usage & Limits", href: "/property-manager/automations/usage-limits", match: ["/automations/usage-limits", "/automations/usage"] },
  { label: "Activity", href: "/property-manager/automations/activity", match: ["/automations/activity"] },
]

function isActive(pathname: string, match: string[], base: string) {
  // Rebase the current path back onto /app/automations for matching, whether
  // we're under /property-manager/automations, /app/automations, or a custom
  // base like /supplier/automations.
  let normalized = pathname.replace(/^\/property-manager/, "/property-manager")
  if (base !== "/property-manager/automations" && normalized.startsWith(base)) {
    normalized = "/property-manager/automations" + normalized.slice(base.length)
  }
  return match.some((m) => {
    const target = `/app${m}`
    if (target === "/property-manager/automations") return normalized === target
    return normalized === target || normalized.startsWith(`${target}/`)
  })
}

export default function AutomationsTabs() {
  const pathname = usePathname() ?? ""
  const router = useRouter()
  const ctx = useSectionBasePath()
  const base = ctx?.base ?? "/property-manager/automations"
  const activeHref = AUTOMATIONS_TABS.find(tab => isActive(pathname, tab.match, base))?.href ?? AUTOMATIONS_TABS[0].href
  const { containerRef, itemRef } = useScrollActiveTabIntoView(activeHref)
  return (
    <nav className="relative border-b border-slate-200 bg-white" aria-label="Automation sections">
      {/* Mobile dropdown — shown only below md breakpoint */}
      <div className="md:hidden px-4 py-2.5">
        <select
          value={activeHref}
          onChange={(e) => router.push(resolveSectionHref(e.target.value, ctx))}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Navigate section"
        >
          {AUTOMATIONS_TABS.map((tab) => (
            <option key={tab.href} value={tab.href}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop tab strip — hidden below md */}
      <div
        ref={containerRef}
        className="hidden md:flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-8 after:bg-gradient-to-l after:from-white after:to-transparent after:pointer-events-none"
      >
        {AUTOMATIONS_TABS.map((tab) => {
          const active = isActive(pathname, tab.match, base)
          return (
            <Link
              key={tab.href}
              ref={itemRef(tab.href)}
              href={resolveSectionHref(tab.href, ctx)}
              className={[
                "relative whitespace-nowrap border-b-2 px-3.5 py-3 text-sm transition",
                active
                  ? "border-blue-600 font-semibold text-blue-700"
                  : "border-transparent font-medium text-slate-500 hover:text-slate-800",
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-2">
                {tab.label}
                {tab.badge != null && tab.badge > 0 && (
                  <span
                    className={[
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      active ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500",
                    ].join(" ")}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
