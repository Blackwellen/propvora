"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  BookText,
  GitMerge,
  Landmark,
  FileText,
  BarChart3,
  TrendingUp,
} from "lucide-react"

const ACCOUNTING_TABS = [
  {
    key: "accounts",
    label: "Accounts",
    href: "/app/accounting/accounts/overview",
    icon: BookOpen,
    // active for overview, new, [id] but NOT journal-ledger
    matchPaths: [
      "/app/accounting/accounts/overview",
      "/app/accounting/accounts/new",
    ],
    matchPrefix: "/app/accounting/accounts/",
    excludePaths: ["/app/accounting/accounts/journal-ledger"],
  },
  {
    key: "journal-ledger",
    label: "Journal Ledger",
    href: "/app/accounting/accounts/journal-ledger",
    icon: BookText,
    matchPaths: ["/app/accounting/accounts/journal-ledger"],
  },
  {
    key: "reconciliation",
    label: "Reconciliation",
    href: "/app/accounting/reconciliation",
    icon: GitMerge,
    matchPrefix: "/app/accounting/reconciliation",
  },
  {
    key: "client-accounts",
    label: "Client Accounts",
    href: "/app/accounting/client-accounts",
    icon: Landmark,
    matchPrefix: "/app/accounting/client-accounts",
  },
  {
    key: "mtd",
    label: "MTD",
    href: "/app/accounting/mtd",
    icon: FileText,
    matchPrefix: "/app/accounting/mtd",
  },
  {
    key: "forecast",
    label: "Forecast",
    href: "/app/accounting/forecast",
    icon: TrendingUp,
    matchPrefix: "/app/accounting/forecast",
  },
  {
    key: "reports",
    label: "Reports",
    href: "/app/accounting/reports",
    icon: BarChart3,
    matchPrefix: "/app/accounting/reports",
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
  const pathname = usePathname()

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {ACCOUNTING_TABS.map((tab) => {
            const active = isTabActive(tab, pathname)
            const Icon = tab.icon
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
                  active
                    ? "border-[#2563EB] text-[#2563EB]"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300",
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
