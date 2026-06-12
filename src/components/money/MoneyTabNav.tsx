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
} from "lucide-react"

// 8 tabs — day-to-day financial tracking. Accounting (journal, reconciliation, MTD, reports) lives in /app/accounting
const MONEY_TABS = [
  { key: "overview",   label: "Overview",   href: "/app/money",              icon: LayoutDashboard },
  { key: "income",     label: "Income",     href: "/app/money/income",       icon: TrendingUp },
  { key: "expenses",   label: "Expenses",   href: "/app/money/expenses",     icon: TrendingDown },
  { key: "invoices",   label: "Invoices",   href: "/app/money/invoices",     icon: FileText },
  { key: "bills",      label: "Bills",      href: "/app/money/bills",        icon: Receipt },
  { key: "arrears",    label: "Arrears",    href: "/app/money/arrears",      icon: AlertTriangle },
  { key: "deposits",   label: "Deposits",   href: "/app/money/deposits",     icon: Vault },
  { key: "rent-chase", label: "Rent Chase", href: "/app/money/rent-chase",   icon: Siren },
] as const

interface MoneyTabNavProps {
  actions?: React.ReactNode
}

export function MoneyTabNav({ actions }: MoneyTabNavProps) {
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
              </Link>
            )
          })}
        </div>
        {actions && <div className="px-4 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
