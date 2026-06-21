"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useScrollActiveTabIntoView } from "@/hooks/useScrollActiveTabIntoView"
// Day-to-day financial tracking + the P5 money rails (holds/commissions/payouts/
// refunds/disputes). Accounting (journal, reconciliation, MTD, reports) lives in
// /app/accounting.
const MONEY_TABS = [
  { key: "overview",    label: "Overview",    href: "/property-manager/money" },
  { key: "income",      label: "Income",      href: "/property-manager/money/income" },
  { key: "expenses",    label: "Expenses",    href: "/property-manager/money/expenses" },
  { key: "invoices",    label: "Invoices",    href: "/property-manager/money/invoices" },
  { key: "bills",       label: "Bills",       href: "/property-manager/money/bills" },
  { key: "arrears",     label: "Arrears",     href: "/property-manager/money/arrears" },
  { key: "deposits",    label: "Deposits",    href: "/property-manager/money/deposits" },
  { key: "escrow",      label: "Escrow",      href: "/property-manager/money/escrow" },
  { key: "holds",       label: "Holds",       href: "/property-manager/money/holds" },
  { key: "commissions", label: "Commissions", href: "/property-manager/money/commissions" },
  { key: "payouts",     label: "Payouts",     href: "/property-manager/money/payouts" },
  { key: "refunds",     label: "Refunds",     href: "/property-manager/money/refunds" },
  { key: "disputes",    label: "Disputes",    href: "/property-manager/money/disputes" },
  { key: "rent-chase",  label: "Rent Chase",  href: "/property-manager/money/rent-chase" },
] as const

interface MoneyTabNavProps {
  actions?: React.ReactNode
}

export function MoneyTabNav({ actions }: MoneyTabNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const activeKey = MONEY_TABS.find(tab =>
    tab.href === "/property-manager/money"
      ? pathname === "/property-manager/money"
      : pathname.startsWith(tab.href)
  )?.key ?? ""
  const activeHref = MONEY_TABS.find(t => t.key === activeKey)?.href ?? MONEY_TABS[0].href
  const { containerRef, itemRef } = useScrollActiveTabIntoView(activeKey)

  return (
    <div className="border-b border-slate-200 bg-white">
      {/* Mobile dropdown — shown only below md breakpoint */}
      <div className="md:hidden px-4 py-2.5">
        <select
          value={activeHref}
          onChange={(e) => router.push(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Navigate section"
        >
          {MONEY_TABS.map((tab) => (
            <option key={tab.key} value={tab.href}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop tab strip — hidden below md */}
      <div className="hidden md:flex items-center justify-between">
        {/* Wrapper with right-fade gradient to signal scrollable tab row on narrow screens */}
        <div className="relative flex-1 min-w-0">
          <div ref={containerRef} className="flex items-center gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {MONEY_TABS.map((tab) => {
              const active = tab.key === activeKey
              return (
                <Link
                  key={tab.key}
                  ref={itemRef(tab.key)}
                  href={tab.href}
                  className={cn(
                    "px-4 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
                    active
                      ? "border-[#2563EB] text-[#2563EB]"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
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
