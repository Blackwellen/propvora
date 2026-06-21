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
  BarChart3,
  DollarSign,
} from "lucide-react"
import { useCountryCode } from "@/hooks/useWorkspaceJurisdiction"
import { getTabsForCountry, MONEY_TABS } from "@/lib/i18n/tab-config"

// Map tab keys to icons
const TAB_ICONS: Record<string, React.ElementType> = {
  overview:                  LayoutDashboard,
  income:                    TrendingUp,
  expenses:                  TrendingDown,
  invoices:                  FileText,
  bills:                     Receipt,
  escrow:                    ShieldCheck,
  commissions:               Percent,
  payouts:                   Banknote,
  refunds:                   Undo2,
  disputes:                  Scale,
  // UK
  arrears:                   AlertTriangle,
  deposits:                  Vault,
  holds:                     ShieldAlert,
  "rent-chase":              Siren,
  service_charges:           BarChart3,
  // US
  rent_roll_us:              BarChart3,
  late_fees:                 AlertTriangle,
  security_deposits_us:      Vault,
  operating_expenses:        TrendingDown,
  // AU
  rent_roll_au:              BarChart3,
  bond_au:                   Vault,
  outgoings:                 TrendingDown,
  pm_fees:                   Percent,
  // DE
  miete:                     DollarSign,
  kaution:                   Vault,
  betriebskosten:            BarChart3,
  nebenkostenabrechnung_money: Receipt,
  // AE
  rent_cheques:              Receipt,
  security_deposit_ae:       Vault,
  service_charges_ae:        BarChart3,
  // CA
  rent_ca:                   DollarSign,
  deposits_ca:               Vault,
}

// Routes that have real pages — key to href mapping.
const TAB_ROUTES: Record<string, string> = {
  overview:         "/app/money",
  income:           "/app/money/income",
  expenses:         "/app/money/expenses",
  invoices:         "/app/money/invoices",
  bills:            "/app/money/bills",
  escrow:           "/app/money/escrow",
  commissions:      "/app/money/commissions",
  payouts:          "/app/money/payouts",
  refunds:          "/app/money/refunds",
  disputes:         "/app/money/disputes",
  arrears:          "/app/money/arrears",
  deposits:         "/app/money/deposits",
  holds:            "/app/money/holds",
  "rent-chase":     "/app/money/rent-chase",
}

function tabHref(key: string): string {
  return TAB_ROUTES[key] ?? `/app/money#${key}`
}

interface MoneyTabNavProps {
  actions?: React.ReactNode
}

export function MoneyTabNav({ actions }: MoneyTabNavProps) {
  const pathname = usePathname()
  const countryCode = useCountryCode()
  const tabs = getTabsForCountry(MONEY_TABS, countryCode)

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map((tab) => {
            const href = tabHref(tab.key)
            const active =
              tab.key === "overview"
                ? pathname === "/app/money"
                : href.startsWith("/app/money/")
                  ? pathname.startsWith(href)
                  : false
            const Icon = TAB_ICONS[tab.key] ?? FileText
            return (
              <Link
                key={tab.key}
                href={href}
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
