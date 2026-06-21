"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Gavel, Key, Zap, Scale, FileWarning, FileText, AlertTriangle, Globe } from "lucide-react"
import { useCountryCode } from "@/hooks/useWorkspaceJurisdiction"
import { getTabsForCountry, LEGAL_TABS } from "@/lib/i18n/tab-config"

// Map tab keys to icons
const TAB_ICONS: Record<string, React.ElementType> = {
  overview:             Scale,
  possession:           Gavel,
  "hmo-licences":       Key,
  "epc-advisory":       Zap,
  "rra-2026":           Scale,
  eviction_us:          Gavel,
  court_us:             FileText,
  fair_housing_legal:   FileWarning,
  termination_au:       Gavel,
  tribunal_au:          Scale,
  kuendigung:           Gavel,
  mietgericht:          Scale,
  rental_dispute:       AlertTriangle,
  rera_ae:              Globe,
  ltb_ca:               Scale,
}

// Routes that have real pages — key to href mapping.
const TAB_ROUTES: Record<string, string> = {
  overview:         "/app/legal",
  possession:       "/app/legal/possession",
  "hmo-licences":   "/app/legal/hmo-licences",
  "epc-advisory":   "/app/legal/epc-advisory",
  "rra-2026":       "/app/legal/rra-2026",
}

function tabHref(key: string): string {
  return TAB_ROUTES[key] ?? `/app/legal#${key}`
}

export function LegalTabNav({ actions }: { actions?: React.ReactNode }) {
  const pathname = usePathname()
  const countryCode = useCountryCode()
  const tabs = getTabsForCountry(LEGAL_TABS, countryCode)

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map((tab) => {
            const href = tabHref(tab.key)
            const active =
              tab.key === "overview"
                ? pathname === "/app/legal" || pathname === "/app/legal/"
                : href.startsWith("/app/legal/")
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
