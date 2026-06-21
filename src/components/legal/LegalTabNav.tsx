"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Gavel, Key, Zap, Scale } from "lucide-react"

const LEGAL_TABS = [
  { key: "possession",   label: "Possession",   href: "/app/legal/possession",   icon: Gavel },
  { key: "hmo-licences", label: "HMO Licences", href: "/app/legal/hmo-licences", icon: Key },
  { key: "epc-advisory", label: "EPC Advisory", href: "/app/legal/epc-advisory", icon: Zap },
  { key: "rra-2026",     label: "RRA 2026",      href: "/app/legal/rra-2026",     icon: Scale },
] as const

interface LegalTabNavProps {
  actions?: React.ReactNode
  /** Optional badge counts keyed by tab key */
  counts?: Record<string, number>
}

export function LegalTabNav({ actions, counts }: LegalTabNavProps) {
  const pathname = usePathname()

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {LEGAL_TABS.map((tab) => {
            const active = pathname.startsWith(tab.href)
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
