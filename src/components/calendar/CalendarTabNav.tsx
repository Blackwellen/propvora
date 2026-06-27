"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSectionBasePath, resolveSectionHref } from "@/components/sections/SectionBasePath"
import { useScrollActiveTabIntoView } from "@/hooks/useScrollActiveTabIntoView"

const CALENDAR_TABS = [
  {
    key:  "overview",
    label: "Overview",
    href:  "/property-manager/calendar",
    /** exact match only */
    exact: true,
  },
  {
    key:  "views",
    label: "Calendar",
    href:  "/property-manager/calendar/views",
    exact: false,
    /** also active for old per-view routes that have been migrated under /views */
    legacyPrefixes: [
      "/property-manager/calendar/month",
      "/property-manager/calendar/week",
      "/property-manager/calendar/day",
      "/property-manager/calendar/agenda",
      "/property-manager/calendar/gantt",
    ],
  },
  {
    key:   "schedule",
    label: "Schedule",
    href:  "/property-manager/calendar/schedule",
    exact: false,
  },
  {
    key:   "timeline",
    label: "Timeline",
    href:  "/property-manager/calendar/timeline",
    exact: false,
  },
  {
    key:   "events",
    label: "Events",
    href:  "/property-manager/calendar/events",
    exact: false,
  },
  {
    key:   "reminders",
    label: "Reminders",
    href:  "/property-manager/calendar/reminders",
    exact: false,
  },
] as const

export function CalendarTabNav({ actions }: { actions?: React.ReactNode }) {
  const rawPathname = usePathname()
  const router = useRouter()
  const ctx = useSectionBasePath()
  // Rebase the live pathname back onto /app/calendar so the existing match
  // logic works identically whether mounted under /app or /supplier.
  const pathname =
    ctx && rawPathname.startsWith(ctx.base)
      ? "/property-manager/calendar" + rawPathname.slice(ctx.base.length)
      : rawPathname

  function isActive(tab: (typeof CALENDAR_TABS)[number]): boolean {
    if (tab.exact) {
      return pathname === tab.href
    }
    if (pathname.startsWith(tab.href)) return true
    if ("legacyPrefixes" in tab && tab.legacyPrefixes) {
      return tab.legacyPrefixes.some((prefix) => pathname.startsWith(prefix))
    }
    return false
  }

  const activeKey = CALENDAR_TABS.find(tab => isActive(tab))?.key ?? ""
  const activeHref = CALENDAR_TABS.find(t => t.key === activeKey)?.href ?? CALENDAR_TABS[0].href
  const { containerRef, itemRef } = useScrollActiveTabIntoView(activeKey)

  return (
    <div className="border-b border-slate-200 bg-white">
      {/* Mobile dropdown — shown only below md breakpoint */}
      <div className="md:hidden px-4 py-2.5">
        <select
          value={activeHref}
          onChange={(e) => router.push(resolveSectionHref(e.target.value, ctx))}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)]"
          aria-label="Navigate section"
        >
          {CALENDAR_TABS.map((tab) => (
            <option key={tab.key} value={tab.href}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop tab strip — hidden below md */}
      <div className="hidden md:flex items-center justify-between">
        <div className="relative flex-1 min-w-0">
        <div ref={containerRef} className="flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-8 after:bg-gradient-to-l after:from-white after:to-transparent after:pointer-events-none">
          {CALENDAR_TABS.map((tab) => {
            const active = tab.key === activeKey
            return (
              <Link
                key={tab.key}
                ref={itemRef(tab.key)}
                href={resolveSectionHref(tab.href, ctx)}
                className={cn(
                  "px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-150",
                  active
                    ? "border-[var(--brand)] text-[var(--brand)]"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
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
