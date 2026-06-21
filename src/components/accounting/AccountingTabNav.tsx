"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSectionBasePath, resolveSectionHref } from "@/components/sections/SectionBasePath"
import { useScrollActiveTabIntoView } from "@/hooks/useScrollActiveTabIntoView"

const ACCOUNTING_TABS = [
  {
    key: "accounts",
    label: "Accounts",
    href: "/property-manager/accounting/accounts/overview",
    // active for overview, new, [id] but NOT journal-ledger
    matchPaths: [
      "/property-manager/accounting/accounts/overview",
      "/property-manager/accounting/accounts/new",
    ],
    matchPrefix: "/property-manager/accounting/accounts/",
    excludePaths: ["/property-manager/accounting/accounts/journal-ledger"],
  },
  {
    key: "journal-ledger",
    label: "Journal Ledger",
    href: "/property-manager/accounting/accounts/journal-ledger",
    matchPaths: ["/property-manager/accounting/accounts/journal-ledger"],
  },
  {
    key: "ledger",
    label: "General Ledger",
    href: "/property-manager/accounting/ledger/chart",
    matchPrefix: "/property-manager/accounting/ledger",
  },
  {
    key: "reconciliation",
    label: "Reconciliation",
    href: "/property-manager/accounting/reconciliation",
    matchPrefix: "/property-manager/accounting/reconciliation",
  },
  {
    key: "client-accounts",
    label: "Client Accounts",
    href: "/property-manager/accounting/client-accounts",
    matchPrefix: "/property-manager/accounting/client-accounts",
  },
  {
    key: "mtd",
    label: "MTD",
    href: "/property-manager/accounting/mtd",
    matchPrefix: "/property-manager/accounting/mtd",
  },
  {
    key: "forecast",
    label: "Forecast",
    href: "/property-manager/accounting/forecast",
    matchPrefix: "/property-manager/accounting/forecast",
  },
  {
    key: "owner-statements",
    label: "Owner Statements",
    href: "/property-manager/accounting/owner-statements",
    matchPrefix: "/property-manager/accounting/owner-statements",
  },
  {
    key: "reports",
    label: "Reports",
    href: "/property-manager/accounting/reports",
    matchPrefix: "/property-manager/accounting/reports",
  },
] as const

function isTabActive(tab: typeof ACCOUNTING_TABS[number], pathname: string): boolean {
  // Check excludePaths first
  if ("excludePaths" in tab && tab.excludePaths) {
    for (const ep of tab.excludePaths) {
      if (pathname === ep || pathname.startsWith(ep + "/")) return false
    }
  }
  // Check exact matchPaths
  if ("matchPaths" in tab && tab.matchPaths) {
    for (const mp of tab.matchPaths) {
      if (pathname === mp) return true
    }
  }
  // Check prefix match
  if ("matchPrefix" in tab && tab.matchPrefix) {
    if (pathname === tab.matchPrefix || pathname.startsWith(tab.matchPrefix + "/")) return true
  }
  return false
}

export function AccountingTabNav({ actions }: { actions?: React.ReactNode }) {
  const rawPathname = usePathname()
  const router = useRouter()
  const ctx = useSectionBasePath()
  // Rebase the live path onto /app/accounting so active-detection is identical
  // whether mounted under /app or e.g. /supplier/accounting.
  const pathname =
    ctx && rawPathname.startsWith(ctx.base)
      ? "/property-manager/accounting" + rawPathname.slice(ctx.base.length)
      : rawPathname

  const activeKey = ACCOUNTING_TABS.find(tab => isTabActive(tab, pathname))?.key ?? ""
  const activeHref = ACCOUNTING_TABS.find(t => t.key === activeKey)?.href ?? ACCOUNTING_TABS[0].href
  const { containerRef, itemRef } = useScrollActiveTabIntoView(activeKey)

  return (
    <div className="border-b border-slate-200 bg-white">
      {/* Mobile dropdown — shown only below md breakpoint */}
      <div className="md:hidden px-4 py-2.5">
        <select
          value={activeHref}
          onChange={(e) => router.push(resolveSectionHref(e.target.value, ctx))}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Navigate section"
        >
          {ACCOUNTING_TABS.map((tab) => (
            <option key={tab.key} value={tab.href}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop tab strip — hidden below md */}
      <div className="hidden md:flex items-center justify-between">
        {/* Wrapper: reduce px at <lg to stop "Reports" clipping at 1366px; right-fade indicates scrollability */}
        <div className="relative flex-1 min-w-0">
          <div ref={containerRef} className="flex items-center gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {ACCOUNTING_TABS.map((tab) => {
              const active = tab.key === activeKey
              return (
                <Link
                  key={tab.key}
                  ref={itemRef(tab.key)}
                  href={resolveSectionHref(tab.href, ctx)}
                  className={cn(
                    "px-3.5 lg:px-5 py-3.5 text-[12px] lg:text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
                    active
                      ? "border-[#2563EB] text-[#2563EB]"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300",
                  )}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
          {/* Right-fade pointer — absolute over scroll container, not clipped by it */}
          <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" aria-hidden="true" />
        </div>
        {actions && <div className="px-4 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
