"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
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

// Day-to-day financial tracking + the P5 money rails (holds/commissions/payouts/
// refunds/disputes). Accounting (journal, reconciliation, MTD, reports) lives in
// /app/accounting.
const MONEY_TABS = [
  { key: "overview",    label: "Overview",    href: "/app/money",              icon: LayoutDashboard },
  { key: "income",      label: "Income",      href: "/app/money/income",       icon: TrendingUp },
  { key: "expenses",    label: "Expenses",    href: "/app/money/expenses",     icon: TrendingDown },
  { key: "invoices",    label: "Invoices",    href: "/app/money/invoices",     icon: FileText },
  { key: "bills",       label: "Bills",       href: "/app/money/bills",        icon: Receipt },
  { key: "arrears",     label: "Arrears",     href: "/app/money/arrears",      icon: AlertTriangle },
  { key: "deposits",    label: "Deposits",    href: "/app/money/deposits",     icon: Vault },
  { key: "escrow",      label: "Escrow",      href: "/app/money/escrow",       icon: ShieldCheck },
  { key: "holds",       label: "Holds",       href: "/app/money/holds",        icon: ShieldAlert },
  { key: "commissions", label: "Commissions", href: "/app/money/commissions",  icon: Percent },
  { key: "payouts",     label: "Payouts",     href: "/app/money/payouts",      icon: Banknote },
  { key: "refunds",     label: "Refunds",     href: "/app/money/refunds",      icon: Undo2 },
  { key: "disputes",    label: "Disputes",    href: "/app/money/disputes",     icon: Scale },
  { key: "rent-chase",  label: "Rent Chase",  href: "/app/money/rent-chase",   icon: Siren },
] as const

interface MoneyTabNavProps {
  actions?: React.ReactNode
  /** Optional badge counts keyed by tab key (e.g. { arrears: 5 }) */
  counts?: Record<string, number>
}

export function MoneyTabNav({ actions, counts }: MoneyTabNavProps) {
  const pathname = usePathname()

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {MONEY_TABS.map((tab) => {
            const active =
              tab.href === "/app/money"
                ? pathname === "/app/money"
                : pathname.startsWith(tab.href)
            const Icon = tab.icon
            const count = counts?.[tab.key]
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
                  active
                    ? "border-[#2563EB] text-[#2563EB]"
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
