"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useScrollActiveTabIntoView } from "@/hooks/useScrollActiveTabIntoView"

// 8 tabs — operational compliance. Legal (Possession, HMO Licences, EPC, RRA 2026) lives in /app/legal
const COMPLIANCE_TABS = [
  { key: "overview",      label: "Overview",      href: "/property-manager/compliance/overview", root: "/property-manager/compliance" },
  { key: "certificates",  label: "Certificates",  href: "/property-manager/compliance/certificates" },
  { key: "inspections",   label: "Inspections",   href: "/property-manager/compliance/inspections" },
  { key: "documents",     label: "Documents",     href: "/property-manager/compliance/documents" },
  { key: "evidence",      label: "Evidence",      href: "/property-manager/compliance/evidence" },
  { key: "coverage",      label: "Coverage",      href: "/property-manager/compliance/coverage" },
  { key: "supplier-docs", label: "Supplier Docs", href: "/property-manager/compliance/supplier-docs" },
  { key: "reports",       label: "Reports",       href: "/property-manager/compliance/reports" },
] as const

export function ComplianceTabNav({ actions }: { actions?: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const activeKey = COMPLIANCE_TABS.find(tab =>
    tab.key === "overview"
      ? pathname === "/property-manager/compliance" || pathname === "/property-manager/compliance/overview"
      : pathname.startsWith(tab.href)
  )?.key ?? ""
  const activeHref = COMPLIANCE_TABS.find(t => t.key === activeKey)?.href ?? COMPLIANCE_TABS[0].href
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
          {COMPLIANCE_TABS.map((tab) => (
            <option key={tab.key} value={tab.href}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop tab strip — hidden below md */}
      <div className="hidden md:flex items-center justify-between">
        <div className="relative flex-1 min-w-0">
        <div ref={containerRef} className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-8 after:bg-gradient-to-l after:from-white after:to-transparent after:pointer-events-none">
          {COMPLIANCE_TABS.map((tab) => {
            const active = tab.key === activeKey
            return (
              <Link
                key={tab.key}
                ref={itemRef(tab.key)}
                href={tab.href}
                className={cn(
                  "px-3 sm:px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
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
        </div>
        {actions && <div className="px-4 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
