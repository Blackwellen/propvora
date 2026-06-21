"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useScrollActiveTabIntoView } from "@/hooks/useScrollActiveTabIntoView"

const LEGAL_TABS = [
  { key: "possession",   label: "Possession",   href: "/property-manager/legal/possession" },
  { key: "hmo-licences", label: "HMO Licences", href: "/property-manager/legal/hmo-licences" },
  { key: "epc-advisory", label: "EPC Advisory", href: "/property-manager/legal/epc-advisory" },
  { key: "rra-2026",     label: "RRA 2026",      href: "/property-manager/legal/rra-2026" },
] as const

export function LegalTabNav({ actions }: { actions?: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const activeKey = LEGAL_TABS.find(tab => pathname.startsWith(tab.href))?.key ?? ""
  const activeHref = LEGAL_TABS.find(t => t.key === activeKey)?.href ?? LEGAL_TABS[0].href
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
          {LEGAL_TABS.map((tab) => (
            <option key={tab.key} value={tab.href}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop tab strip — hidden below md */}
      <div className="hidden md:flex items-center justify-between">
        <div className="relative flex-1 min-w-0">
        <div ref={containerRef} className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-8 after:bg-gradient-to-l after:from-white after:to-transparent after:pointer-events-none">
          {LEGAL_TABS.map((tab) => {
            const active = tab.key === activeKey
            return (
              <Link
                key={tab.key}
                ref={itemRef(tab.key)}
                href={tab.href}
                className={cn(
                  "px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
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
