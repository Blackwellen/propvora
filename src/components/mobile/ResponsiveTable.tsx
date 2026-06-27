"use client"

import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile, useHasMounted } from "./useBreakpoint"

/* ──────────────────────────────────────────────────────────────────────────
   ResponsiveTable / MobileCardList

   A presentation-only wrapper: it renders the EXISTING desktop table verbatim
   on `lg+`, and a stacked card list on phones. Pages opt in by describing how
   each row maps to a card — no data/logic changes required.
─────────────────────────────────────────────────────────────────────────── */

export interface MobileCardField<T> {
  /** Field label (the "label" in label:value). */
  label: string
  /** Cell renderer — return a string/number or any node (chips, badges…). */
  render: (row: T) => React.ReactNode
  /** Hide this field when render() is empty/falsey. */
  hideWhenEmpty?: boolean
}

export interface MobileCardMapping<T> {
  /** Stable key per row. */
  getKey: (row: T) => string
  /** Card title (primary line). */
  title: (row: T) => React.ReactNode
  /** Optional secondary line under the title (address, ref…). */
  subtitle?: (row: T) => React.ReactNode
  /** Optional leading visual (thumbnail / icon chip). */
  leading?: (row: T) => React.ReactNode
  /** Optional status/badge shown top-right. */
  badge?: (row: T) => React.ReactNode
  /** label:value detail rows shown in the card body. */
  fields: MobileCardField<T>[]
  /** Row primary action — tapping the card. Mutually compatible with `actions`. */
  onRowClick?: (row: T) => void
  /** Optional explicit per-row action slot (e.g. an ActionMenu). */
  actions?: (row: T) => React.ReactNode
}

interface ResponsiveTableProps<T> {
  /** Rows to render as cards on mobile. (Desktop table owns its own rows.) */
  rows: T[]
  /** The existing desktop table — rendered unchanged on `lg+`. */
  children: React.ReactNode
  mobile: MobileCardMapping<T>
  /** Shown on mobile when `rows` is empty. */
  emptyState?: React.ReactNode
  className?: string
}

export function ResponsiveTable<T>({
  rows,
  children,
  mobile,
  emptyState,
  className,
}: ResponsiveTableProps<T>) {
  const mounted = useHasMounted()
  const isMobile = useIsMobile()

  // Before mount (and on the server) render the desktop table so SSR matches
  // and there is no flash. After mount, swap to cards on phones.
  if (!mounted || !isMobile) {
    return (
      <>
        <div className={cn("hidden lg:block", className)}>{children}</div>
        {/* Tablet (768–1023) keeps the desktop table inside a horizontal scroll
            wrapper — same component, no regression. */}
        <div className="hidden md:block lg:hidden">{children}</div>
        {/* Mobile placeholder pre-hydration; replaced after mount. */}
        <div className="md:hidden" aria-hidden="true" />
      </>
    )
  }

  return <MobileCardList rows={rows} mapping={mobile} emptyState={emptyState} className={className} />
}

export function MobileCardList<T>({
  rows,
  mapping,
  emptyState,
  className,
}: {
  rows: T[]
  mapping: MobileCardMapping<T>
  emptyState?: React.ReactNode
  className?: string
}) {
  if (rows.length === 0 && emptyState) {
    return <div className="md:hidden">{emptyState}</div>
  }

  return (
    <ul className={cn("md:hidden space-y-2.5", className)} role="list">
      {rows.map((row) => {
        const clickable = !!mapping.onRowClick
        const Tag: "button" | "div" = clickable ? "button" : "div"
        const badge = mapping.badge?.(row)
        const leading = mapping.leading?.(row)
        const subtitle = mapping.subtitle?.(row)
        const actions = mapping.actions?.(row)

        return (
          <li key={mapping.getKey(row)}>
            <Tag
              {...(clickable
                ? {
                    type: "button" as const,
                    onClick: () => mapping.onRowClick!(row),
                  }
                : {})}
              className={cn(
                "w-full text-left bg-white rounded-2xl border border-[#E8EEF8] shadow-sm p-3.5",
                clickable &&
                  "active:scale-[0.99] transition-transform hover:border-[#BFD8FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 motion-reduce:active:scale-100"
              )}
            >
              {/* Header row */}
              <div className="flex items-start gap-3">
                {leading && <div className="shrink-0">{leading}</div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold text-[#071B4D] leading-tight truncate">
                        {mapping.title(row)}
                      </div>
                      {subtitle && (
                        <div className="text-[12px] text-slate-500 leading-tight truncate mt-0.5">
                          {subtitle}
                        </div>
                      )}
                    </div>
                    {badge && <div className="shrink-0">{badge}</div>}
                  </div>
                </div>
                {clickable && !actions && (
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" aria-hidden="true" />
                )}
              </div>

              {/* Detail fields */}
              {mapping.fields.length > 0 && (
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                  {mapping.fields.map((field, i) => {
                    const value = field.render(row)
                    if (field.hideWhenEmpty && (value == null || value === "" || value === "—")) {
                      return null
                    }
                    return (
                      <div key={i} className="min-w-0">
                        <dt className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wide">
                          {field.label}
                        </dt>
                        <dd className="text-[13px] font-medium text-slate-700 truncate mt-0.5">{value}</dd>
                      </div>
                    )
                  })}
                </dl>
              )}

              {/* Explicit action slot — stop propagation so it doesn't trigger row click */}
              {actions && (
                <div
                  className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  {actions}
                </div>
              )}
            </Tag>
          </li>
        )
      })}
    </ul>
  )
}

export default ResponsiveTable
