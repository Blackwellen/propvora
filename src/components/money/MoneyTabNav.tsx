"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useFeatureFlag } from "@/hooks/useFeatureFlag"
import type { V2FlagKey } from "@/lib/flags/registry"
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  FileText,
  Receipt,
  AlertTriangle,
  Vault,
  Siren,
  ShieldAlert,
  ShieldCheck,
  Percent,
  Banknote,
  Undo2,
  Scale,
} from "lucide-react"

// Day-to-day financial tracking (V1, always on) + the V2 marketplace money rails
// (escrow/holds/commissions/payouts/refunds/disputes) which are flag-gated so the
// V2 surface never leaks into V1. Each gated tab names the V2 flag it requires;
// when that flag is off the tab is filtered out entirely (the matching route
// layout guard also redirects on direct URL access). Accounting (journal,
// reconciliation, MTD, reports) lives in /property-manager/accounting.
const MONEY_TABS: ReadonlyArray<{
  key: string
  label: string
  href: string
  icon: typeof LayoutDashboard
  /** V2 flag required to show this tab. Undefined = V1, always visible. */
  flag?: V2FlagKey
}> = [
  { key: "overview",    label: "Overview",    href: "/property-manager/money",              icon: LayoutDashboard },
  { key: "income",      label: "Income",      href: "/property-manager/money/income",       icon: TrendingUp },
  { key: "expenses",    label: "Expenses",    href: "/property-manager/money/expenses",     icon: TrendingDown },
  { key: "invoices",    label: "Invoices",    href: "/property-manager/money/invoices",     icon: FileText },
  { key: "bills",       label: "Bills",       href: "/property-manager/money/bills",        icon: Receipt },
  { key: "arrears",     label: "Arrears",     href: "/property-manager/money/arrears",      icon: AlertTriangle },
  { key: "deposits",    label: "Deposits",    href: "/property-manager/money/deposits",     icon: Vault },
  { key: "escrow",      label: "Escrow",      href: "/property-manager/money/escrow",       icon: ShieldCheck, flag: "marketplaceEscrow" },
  { key: "holds",       label: "Holds",       href: "/property-manager/money/holds",        icon: ShieldAlert, flag: "marketplaceEscrow" },
  { key: "commissions", label: "Commissions", href: "/property-manager/money/commissions",  icon: Percent, flag: "marketplacePayments" },
  { key: "payouts",     label: "Payouts",     href: "/property-manager/money/payouts",      icon: Banknote, flag: "marketplacePayments" },
  { key: "refunds",     label: "Refunds",     href: "/property-manager/money/refunds",      icon: Undo2, flag: "marketplacePayments" },
  { key: "disputes",    label: "Disputes",    href: "/property-manager/money/disputes",     icon: Scale, flag: "marketplaceDisputes" },
  { key: "rent-chase",  label: "Rent Chase",  href: "/property-manager/money/rent-chase",   icon: Siren },
] as const

interface MoneyTabNavProps {
  actions?: React.ReactNode
  /** Optional badge counts keyed by tab key (e.g. { arrears: 5 }) */
  counts?: Record<string, number>
}

const OVERVIEW_HREF = "/property-manager/money"

export function MoneyTabNav({ actions, counts }: MoneyTabNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  // V2 marketplace money-rail flags. When a flag is off the matching tab is
  // filtered out so the V2 surface never appears in the V1 Money nav. (The
  // per-route layout guards independently redirect on direct URL access.)
  const escrowEnabled = useFeatureFlag("marketplaceEscrow")
  const paymentsEnabled = useFeatureFlag("marketplacePayments")
  const disputesEnabled = useFeatureFlag("marketplaceDisputes")
  const flagState: Record<V2FlagKey, boolean> = {
    marketplaceEscrow: escrowEnabled,
    marketplacePayments: paymentsEnabled,
    marketplaceDisputes: disputesEnabled,
  } as Record<V2FlagKey, boolean>

  const tabs = MONEY_TABS.filter((t) => !t.flag || flagState[t.flag])

  const isActive = (href: string) =>
    href === OVERVIEW_HREF ? pathname === OVERVIEW_HREF : pathname.startsWith(href)
  // The active tab's href — the non-overview match wins, else Overview.
  const activeHref =
    tabs.find((t) => t.href !== OVERVIEW_HREF && pathname.startsWith(t.href))?.href ?? OVERVIEW_HREF

  return (
    <div className="border-b border-slate-200 bg-white">
      {/* Mobile / tablet / PWA (< lg): 14 tabs would squash, so collapse to a
          dropdown select that navigates on change (Tab System Rule, 8+ tabs).
          Gated at lg to match the app shell's mobile breakpoint (MobileTopBar /
          MobileBottomNav take over below lg) — avoids a double header. */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-2.5">
        <label className="relative flex-1 min-w-0">
          <span className="sr-only">Money section</span>
          <select
            value={activeHref}
            onChange={(e) => router.push(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 py-2.5 text-[13px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)]"
            aria-label="Money section"
          >
            {tabs.map((tab) => {
              const count = counts?.[tab.key]
              return (
                <option key={tab.key} value={tab.href}>
                  {tab.label}{count != null && count > 0 ? ` (${count > 99 ? "99+" : count})` : ""}
                </option>
              )
            })}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </label>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      {/* Desktop (>= lg): horizontal scrollable tab bar with a fade-free hidden scrollbar. */}
      <div className="hidden lg:flex items-center justify-between">
        <div className="flex items-center gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map((tab) => {
            const active = isActive(tab.href)
            const Icon = tab.icon
            const count = counts?.[tab.key]
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 shrink-0 px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
                  active
                    ? "border-[var(--brand)] text-[var(--brand)]"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
                {count != null && count > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-red-100 text-red-700 text-[10px] font-[700] min-w-[18px] h-[18px] px-1">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
        {actions && <div className="px-4 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
