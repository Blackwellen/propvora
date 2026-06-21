"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import MobileTabs, { type MobileTabItem } from "@/components/mobile/MobileTabs"

export interface SectionTabItem {
  id: string
  label: string
  icon?: React.ElementType
  /** Optional count badge (number or short string). */
  badge?: number | string
}

interface AppSectionTabsProps {
  tabs: SectionTabItem[]
  /** Controlled active tab id. */
  value: string
  onChange: (id: string) => void
  /** Accessible label for the tablist. */
  "aria-label"?: string
  className?: string
}

/**
 * ONE consistent section tab strip for /property-manager pages.
 *
 * Renders a single presentation across breakpoints so there is never a double
 * tab bar or a clipped/merged label:
 *  - `lg+`  → a clean underline strip (icon + label + badge), aria roles.
 *  - `<lg`  → the shared scrollable `MobileTabs` pill control (auto-scroll the
 *             active tab into view, roving arrow-key focus, ≥44px targets).
 *
 * Pass the SAME `value` / `onChange` state you already use for the desktop
 * strip — only the presentation changes. This component owns no routing; it is
 * a controlled view switcher. Place it directly under the page header and above
 * the filter bar (see the page-order standard in the shell docs).
 *
 * a11y: desktop strip is a real `role=tablist` with `aria-selected` and roving
 * tabindex; mobile delegates to `MobileTabs` which carries the same semantics.
 */
export default function AppSectionTabs({
  tabs,
  value,
  onChange,
  "aria-label": ariaLabel = "Sections",
  className,
}: AppSectionTabsProps) {
  const desktopListRef = useRef<HTMLDivElement>(null)
  const desktopBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Scroll active tab into view on desktop strip when value changes
  useEffect(() => {
    const el = desktopBtnRefs.current[value]
    if (!el) return
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", inline: "center", block: "nearest" })
  }, [value])

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
    badge: t.badge,
  }))

  return (
    <div className={className}>
      {/* Desktop strip — lg+ */}
      <div
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        className="hidden lg:flex items-center gap-1 border-b border-slate-200 overflow-x-auto [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const active = tab.id === value
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={cn(
                "border-b-2 -mb-px px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 motion-reduce:transition-none",
                active
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
              {tab.badge != null && tab.badge !== 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    active ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-slate-100 text-slate-500"
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
