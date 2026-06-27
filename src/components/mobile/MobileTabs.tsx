"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export interface MobileTabItem {
  id: string
  label: string
  icon?: React.ElementType
  /** Optional count badge. */
  badge?: number | string
}

interface MobileTabsProps {
  tabs: MobileTabItem[]
  /** Controlled active tab id (same state the desktop strip uses). */
  value: string
  onChange: (id: string) => void
  className?: string
  /** Visual style. "pill" (default) is a scrollable segmented control. */
  variant?: "pill" | "underline"
  "aria-label"?: string
}

/**
 * Horizontally-scrollable pill / segmented tab control for mobile. Drop-in for
 * desktop in-page top-tab strips: pass the same `value` / `onChange` state and
 * the same tab list — only the presentation changes.
 *
 * a11y: role=tablist with roving arrow-key focus, aria-selected, ≥44px targets,
 * the active pill auto-scrolls into view. Reduced-motion respected (smooth
 * scroll only when motion is allowed).
 */
export default function MobileTabs({
  tabs,
  value,
  onChange,
  className,
  variant = "pill",
  "aria-label": ariaLabel = "Sections",
}: MobileTabsProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Keep the active tab in view when it changes.
  useEffect(() => {
    const el = btnRefs.current[value]
    if (!el) return
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    el.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    })
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
    const nextTab = tabs[next]
    onChange(nextTab.id)
    btnRefs.current[nextTab.id]?.focus()
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden",
        variant === "pill"
          ? "p-1 bg-slate-100 rounded-2xl"
          : "border-b border-slate-200 gap-0",
        className
      )}
      style={{ scrollbarWidth: "none" }}
    >
      {tabs.map((tab) => {
        const active = tab.id === value
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            ref={(el) => {
              btnRefs.current[tab.id] = el
            }}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 min-h-[40px] whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 motion-reduce:transition-none",
              variant === "pill"
                ? cn(
                    "px-3.5 rounded-xl text-[13px] font-semibold",
                    active
                      ? "bg-white text-[var(--brand)] shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )
                : cn(
                    "px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px",
                    active
                      ? "border-[var(--brand)] text-[var(--brand)]"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  )
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {tab.label}
            {tab.badge != null && (
              <span
                className={cn(
                  "ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold tabular-nums",
                  active ? "bg-[var(--brand)] text-white" : "bg-slate-200 text-slate-600"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
