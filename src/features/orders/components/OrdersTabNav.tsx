"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Briefcase, FileText, ShieldCheck, CheckCircle2 } from "lucide-react"

const TABS = [
  { key: "active",    label: "Active Orders", icon: Briefcase },
  { key: "quotes",    label: "Quotes",        icon: FileText },
  { key: "escrow",    label: "Escrow",        icon: ShieldCheck },
  { key: "completed", label: "Completed",     icon: CheckCircle2 },
] as const

export type OrdersTab = (typeof TABS)[number]["key"]

export function OrdersTabNav({ active }: { active: OrdersTab }) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = tab.key === active
          return (
            <Link
              key={tab.key}
              href={`/app/work/orders?tab=${tab.key}`}
              className={cn(
                "flex items-center gap-2 px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
                isActive
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
    </div>
  )
}
