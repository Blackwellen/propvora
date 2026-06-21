"use client"

import { cn } from "@/lib/utils"

export function DetailTabs<T extends string>({ tabs, active, onChange }: {
  tabs: { key: T; label: string }[]
  active: T
  onChange: (k: T) => void
}) {
  return (
    <div className="border-b border-slate-200 bg-white">
      {/* Mobile dropdown — shown only below md breakpoint */}
      <div className="md:hidden px-4 py-2.5">
        <select
          value={active}
          onChange={(e) => onChange(e.target.value as T)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Navigate section"
        >
          {tabs.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop tab strip — hidden below md */}
      <div className="hidden md:flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
