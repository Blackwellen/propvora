"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
} from "lucide-react"

// 8 operational compliance tabs. Legal advisory (HMO licences, EPC, possession,
// RRA 2026) is its own side-nav location at /property-manager/legal — not a tab here.
const COMPLIANCE_TABS = [
  { key: "overview",      label: "Overview",      href: "/property-manager/compliance/overview", root: "/property-manager/compliance", icon: LayoutDashboard },
  { key: "certificates",  label: "Certificates",  href: "/property-manager/compliance/certificates",  icon: FileCheck2 },
  { key: "inspections",   label: "Inspections",   href: "/property-manager/compliance/inspections",   icon: ClipboardList },
  { key: "documents",     label: "Documents",     href: "/property-manager/compliance/documents",     icon: FolderOpen },
  { key: "evidence",      label: "Evidence",      href: "/property-manager/compliance/evidence",      icon: Shield },
  { key: "coverage",      label: "Coverage",      href: "/property-manager/compliance/coverage",      icon: Building2 },
  { key: "supplier-docs", label: "Supplier Docs", href: "/property-manager/compliance/supplier-docs", icon: Truck },
  { key: "reports",       label: "Reports",       href: "/property-manager/compliance/reports",       icon: BarChart3 },
] as const

interface ComplianceTabNavProps {
  actions?: React.ReactNode
  /** Optional badge counts keyed by tab key (e.g. { certificates: 3 }) */
  counts?: Record<string, number>
}

export function ComplianceTabNav({ actions, counts }: ComplianceTabNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const visibleTabs = COMPLIANCE_TABS

  const isTabActive = (tab: (typeof COMPLIANCE_TABS)[number]) =>
    tab.key === "overview"
      ? pathname === "/property-manager/compliance" || pathname === "/property-manager/compliance/overview"
      : pathname.startsWith(tab.href)
  const activeHref = visibleTabs.find(isTabActive)?.href ?? visibleTabs[0].href

  return (
    <div className="border-b border-slate-200 bg-white">
      {/* Phone / PWA (< md): collapse the 8 tabs to a dropdown that navigates on
          change (Tab System Rule, 8+ tabs). Tablet and up scroll the strip. */}
      <div className="md:hidden px-4 py-2.5">
        <label className="relative block">
          <span className="sr-only">Compliance section</span>
          <select
            value={activeHref}
            onChange={(e) => router.push(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 py-2.5 text-[13px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)]"
            aria-label="Compliance section"
          >
            {visibleTabs.map((tab) => {
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
      </div>

      {/* Tablet & desktop (>= md): horizontal scrollable tab strip. */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {visibleTabs.map((tab) => {
            const active =
              tab.key === "overview"
                ? pathname === "/property-manager/compliance" || pathname === "/property-manager/compliance/overview"
                : pathname.startsWith(tab.href)
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
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300",
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
