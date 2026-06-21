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
  Scale,
} from "lucide-react"

// 9 tabs — operational compliance + legal advisory (merged from /legal nav item).
// Legal tab links to /app/legal (HMO licences, EPC advisory, possession, RRA 2026).
const COMPLIANCE_TABS = [
  { key: "overview",      label: "Overview",      href: "/app/compliance/overview", root: "/app/compliance", icon: LayoutDashboard },
  { key: "certificates",  label: "Certificates",  href: "/app/compliance/certificates",  icon: FileCheck2 },
  { key: "inspections",   label: "Inspections",   href: "/app/compliance/inspections",   icon: ClipboardList },
  { key: "documents",     label: "Documents",     href: "/app/compliance/documents",     icon: FolderOpen },
  { key: "evidence",      label: "Evidence",      href: "/app/compliance/evidence",      icon: Shield },
  { key: "coverage",      label: "Coverage",      href: "/app/compliance/coverage",      icon: Building2 },
  { key: "supplier-docs", label: "Supplier Docs", href: "/app/compliance/supplier-docs", icon: Truck },
  { key: "reports",       label: "Reports",       href: "/app/compliance/reports",       icon: BarChart3 },
  { key: "legal",         label: "Legal",         href: "/app/legal",                    icon: Scale },
] as const

interface ComplianceTabNavProps {
  actions?: React.ReactNode
  /** Optional badge counts keyed by tab key (e.g. { certificates: 3 }) */
  counts?: Record<string, number>
}

export function ComplianceTabNav({ actions, counts }: ComplianceTabNavProps) {
  const pathname = usePathname()

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {COMPLIANCE_TABS.map((tab) => {
            const active =
              tab.key === "overview"
                ? pathname === "/app/compliance" || pathname === "/app/compliance/overview"
                : tab.key === "legal"
                  ? pathname === "/app/legal" || pathname.startsWith("/app/legal/")
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
