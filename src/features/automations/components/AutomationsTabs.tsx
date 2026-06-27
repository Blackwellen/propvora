"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSectionBasePath, resolveSectionHref } from "@/components/sections/SectionBasePath"
import { useAutomationsFlags } from "./AutomationsFlagsContext"

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
  { label: "Overview", href: "/property-manager/automations/overview", match: ["/automations", "/automations/overview", "/automations/home"] },
  { label: "Recipes", href: "/property-manager/automations/recipes", match: ["/automations/recipes", "/automations/templates"] },
  { label: "My Automations", href: "/property-manager/automations/my-automations", match: ["/automations/my-automations"] },
  { label: "Canvas Builder", href: "/property-manager/automations/canvas", match: ["/automations/canvas", "/automations/builder"] },
  { label: "Runs & Logs", href: "/property-manager/automations/runs-logs", match: ["/automations/runs-logs", "/automations/runs"] },
  { label: "Approvals", href: "/property-manager/automations/approvals", match: ["/automations/approvals"] },
  { label: "Errors", href: "/property-manager/automations/errors", match: ["/automations/errors"] },
  // Integrations tab houses all third-party connections AND outbound webhooks as
  // sub-tabs: Overview · Integrations · Webhooks · Connection Health · Secrets ·
  // Usage Analytics · Audit Log. Webhooks is NOT a separate main tab.
  { label: "Integrations", href: "/property-manager/automations/integrations", match: ["/automations/integrations", "/automations/webhooks"] },
  { label: "AI Builder", href: "/property-manager/automations/ai-builder", match: ["/automations/ai-builder"] },
  { label: "Usage & Limits", href: "/property-manager/automations/usage-limits", match: ["/automations/usage-limits", "/automations/usage"] },
  // Admin Controls (workspace governance) moved to
  // Workspace Settings → Automation Governance. Intentionally NOT a module tab.
]

function isActive(pathname: string, match: string[], base: string) {
  // Rebase the current path back onto /app/automations for matching, whether
  // we're under /property-manager/automations, /app/automations, or a custom
  // base like /supplier/automations.
  let normalized = pathname.replace(/^\/property-manager/, "/app")
  if (base !== "/app/automations" && normalized.startsWith(base)) {
    normalized = "/app/automations" + normalized.slice(base.length)
  }
  return match.some((m) => {
    const target = `/app${m}`
    if (target === "/app/automations") return normalized === target
    return normalized === target || normalized.startsWith(`${target}/`)
  })
}

export default function AutomationsTabs({
  hiddenTabs,
}: {
  /**
   * Labels of tabs to hide. Used to enforce feature-flag gating:
   *   - "Canvas Builder"  → canvasLite flag OFF
   *   - "Integrations"    → automationsFull flag OFF
   *   (Webhooks is now a sub-tab of Integrations, not a separate main tab)
   */
  hiddenTabs?: string[]
}) {
  const pathname = usePathname() ?? ""
  const ctx = useSectionBasePath()
  const base = ctx?.base ?? "/app/automations"
  // Prefer the centrally-resolved flags from the Automations layout so EVERY
  // page renders an identical, correctly-gated strip. Fall back to the prop for
  // mounts outside that layout (e.g. the Supplier workspace).
  const flags = useAutomationsFlags()
  const effectiveHidden = flags?.hiddenTabs ?? hiddenTabs
  const visibleTabs = effectiveHidden?.length
    ? AUTOMATIONS_TABS.filter((t) => !effectiveHidden.includes(t.label))
    : AUTOMATIONS_TABS
  return (
    <div className="relative border-b border-slate-200">
      {/* Right-edge fade gradient — visible only on mobile/tablet when tabs overflow */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent lg:hidden" aria-hidden="true" />
      <nav className="overflow-x-auto scrollbar-none" aria-label="Automation sections">
        <div className="flex min-w-max items-center gap-1">
          {visibleTabs.map((tab) => {
            const active = isActive(pathname, tab.match, base)
            return (
              <Link
                key={tab.href}
                href={resolveSectionHref(tab.href, ctx)}
                aria-current={active ? "page" : undefined}
                className={[
                  "relative shrink-0 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm transition",
                  active
                    ? "border-[var(--brand)] font-semibold text-[var(--brand)]"
                    : "border-transparent font-medium text-slate-500 hover:text-slate-800",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-2">
                  {tab.label}
                  {tab.badge != null && tab.badge > 0 && (
                    <span
                      className={[
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        active ? "bg-[var(--color-brand-100)] text-[var(--brand)]" : "bg-slate-100 text-slate-500",
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
    </div>
  )
}
