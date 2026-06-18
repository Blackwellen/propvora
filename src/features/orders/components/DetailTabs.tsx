"use client"

import { cn } from "@/lib/utils"

export function DetailTabs<T extends string>({ tabs, active, onChange }: {
  tabs: { key: T; label: string }[]
  active: T
  onChange: (k: T) => void
}) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
              t.key === active ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
