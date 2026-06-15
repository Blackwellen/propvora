"use client"

import { cn } from "@/lib/utils"
import MobileTabs, { type MobileTabItem } from "@/components/mobile/MobileTabs"
import type { SectionTabItem } from "./AppSectionTabs"

export type { SectionTabItem }

interface DetailPageTabsProps {
  tabs: SectionTabItem[]
  /** Controlled active tab id (the detail sub-tab the page is showing). */
  value: string
  onChange: (id: string) => void
  "aria-label"?: string
  className?: string
}

/**
 * Detail-page sub-tab strip (e.g. Overview · Activity · Documents · Notes on an
 * entity detail page). Same single-presentation contract as `AppSectionTabs`,
 * but styled as a compact segmented pill row on desktop to sit neatly inside a
 * detail hero/card rather than spanning a full section header.
 *
 *  - `lg+`  → segmented pill group on a subtle track.
 *  - `<lg`  → the shared scrollable `MobileTabs` pill control.
 *
 * Controlled view switcher only — owns no routing. Use for in-page detail
 * sub-tabs; use `AppSectionTabs` for top-level section tabs.
 */
export default function DetailPageTabs({
  tabs,
  value,
  onChange,
  "aria-label": ariaLabel = "Detail sections",
  className,
}: DetailPageTabsProps) {
  function onKeyDown(e: React.KeyboardEvent) {
    const idx = tabs.findIndex((t) => t.id === value)
    if (idx === -1) return
    let next = idx
    if (e.key === "ArrowRight") next = (idx + 1) % tabs.length
    else if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = tabs.length - 1
    else return
    e.preventDefault()
    onChange(tabs[next].id)
  }

  const mobileItems: MobileTabItem[] = tabs.map((t) => ({
    id: t.id,
    label: t.label,
    icon: t.icon,
    badge: t.badge,
  }))

  return (
    <div className={className}>
      {/* Desktop — segmented pill group (lg+) */}
      <div
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        className="hidden lg:inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-100 overflow-x-auto [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const active = tab.id === value
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 motion-reduce:transition-none",
                active
                  ? "bg-white text-[#2563EB] shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {tab.label}
              {tab.badge != null && tab.badge !== 0 && (
                <span
                  className={cn(
                    "ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold tabular-nums",
                    active ? "bg-[#2563EB] text-white" : "bg-slate-200 text-slate-600"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Mobile — shared scrollable pill control */}
      <div className="lg:hidden">
        <MobileTabs
          tabs={mobileItems}
          value={value}
          onChange={onChange}
          aria-label={ariaLabel}
        />
      </div>
    </div>
  )
}
