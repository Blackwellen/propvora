"use client"

import { Search, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobilePageHeaderProps {
  title: string
  /** When the page already shows the title in a <MobileTopBar>, set this to
   *  avoid a duplicate heading — the count becomes the visible line instead. */
  hideTitle?: boolean
  /** e.g. "12 properties". */
  count?: string
  /** Controlled search value. Omit to hide the search field. */
  search?: string
  onSearchChange?: (v: string) => void
  searchPlaceholder?: string
  /** Show the filter trigger button. */
  onOpenFilters?: () => void
  /** Number of active filters → badge on the filter button. */
  activeFilterCount?: number
  /** Optional inline actions (e.g. a view switcher) rendered on the right. */
  actions?: React.ReactNode
  className?: string
}

/**
 * Mobile-native page header: title + count, a full-width search field, and a
 * filter trigger (opens a MobileFilterSheet). Replaces the wrap-prone desktop
 * filter toolbar on phones. Rendered only below `md` — callers gate it.
 */
export default function MobilePageHeader({
  title,
  hideTitle = false,
  count,
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  onOpenFilters,
  activeFilterCount = 0,
  actions,
  className,
}: MobilePageHeaderProps) {
  const showSearch = search !== undefined && !!onSearchChange
  // When the MobileTopBar already shows the title, don't repeat it — surface the
  // count as the line instead, so phones/PWA don't show a duplicate heading.
  const showTopRow = !hideTitle || !!count || !!actions

  return (
    <div className={cn("md:hidden mb-4", className)}>
      {showTopRow && (
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="min-w-0">
            {hideTitle ? (
              count ? (
                <p className="text-[15px] font-bold text-[#071B4D] leading-tight truncate">{count}</p>
              ) : null
            ) : (
              <>
                <h1 className="text-[19px] font-bold text-[#071B4D] leading-tight truncate">{title}</h1>
                {count && <p className="text-[12.5px] text-slate-500 leading-tight">{count}</p>}
              </>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}

      {(showSearch || onOpenFilters) && (
        <div className="flex items-center gap-2">
          {showSearch && (
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                inputMode="search"
                value={search}
                onChange={(e) => onSearchChange!(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full h-11 pl-9 pr-3 rounded-xl text-[14px] bg-white border border-[#E2EAF6] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all shadow-sm"
              />
            </div>
          )}
          {onOpenFilters && (
            <button
              onClick={onOpenFilters}
              aria-label="Filters"
              className={cn(
                "relative h-11 w-11 shrink-0 rounded-xl border flex items-center justify-center transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40",
                activeFilterCount > 0
                  ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                  : "bg-white border-[#E2EAF6] text-slate-600 hover:bg-[#F0F7FF]"
              )}
            >
              <SlidersHorizontal className="w-[18px] h-[18px]" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
