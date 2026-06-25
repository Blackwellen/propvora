"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Gavel, Key, Zap, Scale } from "lucide-react"
import { useScrollActiveTabIntoView } from "@/hooks/useScrollActiveTabIntoView"
import { useWorkspaceJurisdiction } from "@/hooks/useWorkspaceJurisdiction"
import { getLegalJurisdiction } from "@/lib/legal/jurisdiction"

const LEGAL_TABS = [
  { key: "overview",     label: "Overview",     href: "/property-manager/legal",              icon: LayoutDashboard },
  { key: "possession",   label: "Possession",   href: "/property-manager/legal/possession",   icon: Gavel },
  { key: "hmo-licences", label: "HMO Licences", href: "/property-manager/legal/hmo-licences", icon: Key },
  { key: "epc-advisory", label: "EPC Advisory", href: "/property-manager/legal/epc-advisory", icon: Zap },
  { key: "rra-2026",     label: "RRA 2026",     href: "/property-manager/legal/rra-2026",     icon: Scale },
] as const

interface LegalTabNavProps {
  actions?: React.ReactNode
  /** Optional badge counts keyed by tab key */
  counts?: Record<string, number>
}

export function LegalTabNav({ actions, counts }: LegalTabNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { countryCode, settings } = useWorkspaceJurisdiction()
  const region = (settings as { region?: string }).region
  const jur = getLegalJurisdiction(countryCode, region)

  // RRA 2026 is an England & Wales statute — hide the tab entirely for any
  // jurisdiction where it does not apply (Scotland, NI, all non-GB countries).
  const tabs = LEGAL_TABS.filter((tab) => (tab.key === "rra-2026" ? jur.modules.rra.applies : true))

  // Overview is the section root, so it is a prefix of every other tab href —
  // it must match exactly, while the rest match by prefix (to stay active on
  // detail/sub-routes such as /legal/possession/[caseId]).
  const activeKey =
    tabs.find((tab) =>
      tab.href === "/property-manager/legal"
        ? pathname === "/property-manager/legal"
        : pathname.startsWith(tab.href),
    )?.key ?? ""
  const activeHref = tabs.find((t) => t.key === activeKey)?.href ?? tabs[0].href
  const { containerRef, itemRef } = useScrollActiveTabIntoView(activeKey)

  return (
    <div className="border-b border-slate-200 bg-white sticky top-0 z-20">
      {/* Mobile dropdown — shown only below md breakpoint */}
      <div className="md:hidden px-4 py-2.5">
        <select
          value={activeHref}
          onChange={(e) => router.push(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Navigate Legal section"
        >
          {tabs.map((tab) => (
            <option key={tab.key} value={tab.href}>
              {tab.label}
              {counts?.[tab.key] ? ` (${counts[tab.key]})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop tab strip — hidden below md */}
      <div className="hidden md:flex items-center justify-between">
        <div
          ref={containerRef}
          className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {tabs.map((tab) => {
            const active = tab.key === activeKey
            const Icon = tab.icon
            const count = counts?.[tab.key]
            return (
              <Link
                key={tab.key}
                ref={itemRef(tab.key)}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150 shrink-0",
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
