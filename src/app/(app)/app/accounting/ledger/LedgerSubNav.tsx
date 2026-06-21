"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BookOpen, BookText, Scale } from "lucide-react"
import { useSectionBasePath, resolveSectionHref } from "@/components/sections/SectionBasePath"

const TABS = [
  { key: "chart", label: "Chart of Accounts", href: "/property-manager/accounting/ledger/chart", icon: BookOpen, prefix: "/property-manager/accounting/ledger/chart" },
  { key: "journal", label: "Journal", href: "/property-manager/accounting/ledger/journal", icon: BookText, prefix: "/property-manager/accounting/ledger/journal" },
  { key: "trial-balance", label: "Trial Balance", href: "/property-manager/accounting/ledger/trial-balance", icon: Scale, prefix: "/property-manager/accounting/ledger/trial-balance" },
] as const

export function LedgerSubNav() {
  const rawPathname = usePathname()
  const ctx = useSectionBasePath()
  const pathname =
    ctx && rawPathname.startsWith(ctx.base)
      ? "/property-manager/accounting" + rawPathname.slice(ctx.base.length)
      : rawPathname
  return (
    <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {TABS.map((t) => {
        const active = pathname === t.prefix || pathname.startsWith(t.prefix + "/")
        const Icon = t.icon
        return (
          <Link
            key={t.key}
            href={resolveSectionHref(t.href, ctx)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all",
              active
                ? "border-[#2563EB] text-[#2563EB]"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
