"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileCheck2,
  ClipboardList,
  FolderOpen,
  Shield,
  Building2,
  Truck,
  BarChart3,
  Flame,
  Zap,
  Home,
  Users,
  Vault,
  AlertTriangle,
  Droplets,
  CheckCircle,
  FileWarning,
  Lock,
} from "lucide-react"
import { useCountryCode } from "@/hooks/useWorkspaceJurisdiction"
import { getTabsForCountry, COMPLIANCE_TABS } from "@/lib/i18n/tab-config"

// Map tab keys to icons
const TAB_ICONS: Record<string, React.ElementType> = {
  overview:               LayoutDashboard,
  certificates:           FileCheck2,
  inspections:            ClipboardList,
  evidence:               Shield,
  coverage:               Building2,
  "supplier-docs":        Truck,
  documents:              FolderOpen,
  reports:                BarChart3,
  gas_safety:             Flame,
  eicr:                   Zap,
  epc:                    Zap,
  right_to_rent:          Users,
  hmo_licensing:          Home,
  deposit_protection:     Vault,
  fire_safety:            Flame,
  legionella:             Droplets,
  section21_tracker:      FileWarning,
  section8_tracker:       FileWarning,
  fair_housing:           CheckCircle,
  habitability:           Home,
  lead_paint:             AlertTriangle,
  smoke_co_us:            Flame,
  security_deposit_us:    Vault,
  rent_control_us:        Lock,
  bond_lodgement:         Vault,
  smoke_alarms_au:        Flame,
  pool_safety_au:         Droplets,
  gas_appliances_au:      Flame,
  heizung:                Flame,
  nebenkostenabrechnung:  BarChart3,
  rauchmelder:            Flame,
  mietrecht:              FileWarning,
  ejari:                  CheckCircle,
  dewa:                   Zap,
  trakheesi:              Building2,
  fire_safety_ca:         Flame,
  smoke_co_ca:            Flame,
}

// Routes that have real pages — key to href mapping.
// All other country-specific tabs route to the compliance overview with a hash.
const TAB_ROUTES: Record<string, string> = {
  overview:       "/app/compliance/overview",
  certificates:   "/app/compliance/certificates",
  inspections:    "/app/compliance/inspections",
  evidence:       "/app/compliance/evidence",
  coverage:       "/app/compliance/coverage",
  "supplier-docs": "/app/compliance/supplier-docs",
  documents:      "/app/compliance/documents",
  reports:        "/app/compliance/reports",
}

function tabHref(key: string): string {
  return TAB_ROUTES[key] ?? `/app/compliance/overview#${key}`
}

export function ComplianceTabNav({ actions }: { actions?: React.ReactNode }) {
  const pathname = usePathname()
  const countryCode = useCountryCode()
  const tabs = getTabsForCountry(COMPLIANCE_TABS, countryCode)

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map((tab) => {
            const href = tabHref(tab.key)
            const active =
              tab.key === "overview"
                ? pathname === "/app/compliance" || pathname === "/app/compliance/overview"
                : href.startsWith("/app/compliance/") && !href.includes("#")
                  ? pathname.startsWith(href)
                  : false
            const Icon = TAB_ICONS[tab.key] ?? FileCheck2
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
