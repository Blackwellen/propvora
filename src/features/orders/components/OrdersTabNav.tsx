"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { key: "active",    label: "Active Orders" },
  { key: "quotes",    label: "Quotes" },
  { key: "escrow",    label: "Escrow" },
  { key: "completed", label: "Completed" },
] as const

export type OrdersTab = (typeof TABS)[number]["key"]

export function OrdersTabNav({ active }: { active: OrdersTab }) {
  const router = useRouter()
  const activeHref = `/property-manager/work/orders?tab=${active}`

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
          {TABS.map((tab) => (
            <option key={tab.key} value={`/property-manager/work/orders?tab=${tab.key}`}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop tab strip — hidden below md */}
      <div className="hidden md:flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {TABS.map(tab => {
          const isActive = tab.key === active
          return (
            <Link
              key={tab.key}
              href={`/property-manager/work/orders?tab=${tab.key}`}
              className={cn(
                "px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
                isActive
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
  )
}
