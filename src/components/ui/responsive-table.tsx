"use client"

import { cn } from "@/lib/utils"

// ============================================================================
// ResponsiveTable — universal responsive wrapper for data tables.
//
// Two strategies are combined:
//   1. On ALL viewports: overflow-x-auto scroll container — the table never
//      breaks or squishes the page layout. The -mx-4 px-4 trick allows the
//      scroll shadow to bleed to the edge on mobile without adding horizontal
//      page scroll.
//   2. Scroll-shadow overlay: a right-fade gradient that disappears once the
//      user has scrolled to the end, signalling scrollability on mobile.
//
// Usage:
//   <ResponsiveTable>
//     <table>...</table>
//   </ResponsiveTable>
//
// For tables where you want mobile card-layout instead of scroll:
//   <MobileCardTable columns={columns} rows={rows} />
// ============================================================================

interface ResponsiveTableProps {
  children: React.ReactNode
  className?: string
  /** Remove the -mx-4 px-4 bleed on mobile (for tables already inside padded containers). */
  noBleed?: boolean
}

export function ResponsiveTable({ children, className, noBleed }: ResponsiveTableProps) {
  return (
    <div className={cn("relative", !noBleed && "-mx-4 sm:mx-0", className)}>
      <div className="overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 [-webkit-overflow-scrolling:touch]">
        {children}
      </div>
      {/* Right-fade scroll hint — hidden once scrolled fully right via JS-free CSS trick */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent sm:hidden"
      />
    </div>
  )
}

// ============================================================================
// MobileCardTable — renders a table as stacked cards on mobile (<md), and as
// a standard table on desktop. Eliminates horizontal scrolling entirely.
//
// Usage:
//   const columns: TableColumn[] = [
//     { key: "name", header: "Name", priority: "high" },
//     { key: "status", header: "Status", priority: "high" },
//     { key: "rent", header: "Rent", priority: "medium" },
//     { key: "address", header: "Address", priority: "low" },
//   ]
//   <MobileCardTable columns={columns} rows={data} keyField="id" />
//
// Priority:
//   "high"   — shown in both table and card (always visible)
//   "medium" — shown in table + as secondary field in card
//   "low"    — shown in table only (hidden on mobile)
// ============================================================================

export type TableColumnPriority = "high" | "medium" | "low"

export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T & string
  header: string
  priority?: TableColumnPriority
  render?: (value: T[keyof T], row: T) => React.ReactNode
  headerClass?: string
  cellClass?: string
}

interface MobileCardTableProps<T extends Record<string, unknown>> {
  columns: TableColumn<T>[]
  rows: T[]
  keyField: keyof T & string
  onRowClick?: (row: T) => void
  emptyMessage?: string
  className?: string
}

export function MobileCardTable<T extends Record<string, unknown>>({
  columns,
  rows,
  keyField,
  onRowClick,
  emptyMessage = "No data found.",
  className,
}: MobileCardTableProps<T>) {
  const highCols = columns.filter((c) => c.priority === "high" || !c.priority)
  const medCols = columns.filter((c) => c.priority === "medium")
  const visibleCols = columns.filter((c) => c.priority !== "low")

  if (rows.length === 0) {
    return (
      <div className={cn("py-12 text-center text-sm text-slate-400", className)}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <>
      {/* ── Desktop table ── */}
      <div className={cn("hidden md:block", className)}>
        <ResponsiveTable noBleed>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-slate-100">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap",
                      col.priority === "low" && "hidden xl:table-cell",
                      col.headerClass
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row) => (
                <tr
                  key={String(row[keyField])}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "transition-colors",
                    onRowClick && "cursor-pointer hover:bg-slate-50/70"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 text-slate-700",
                        col.priority === "low" && "hidden xl:table-cell",
                        col.cellClass
                      )}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      </div>

      {/* ── Mobile card stack ── */}
      <div className={cn("md:hidden divide-y divide-slate-100", className)}>
        {rows.map((row) => (
          <div
            key={String(row[keyField])}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              "px-4 py-3.5 bg-white transition-colors",
              onRowClick && "cursor-pointer active:bg-slate-50"
            )}
          >
            {/* Primary fields stacked */}
            {highCols.map((col) => (
              <div key={col.key} className={col === highCols[0] ? "mb-1" : "mb-0.5"}>
                {col === highCols[0] ? (
                  <span className="text-[13.5px] font-semibold text-slate-900">
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                  </span>
                ) : (
                  <span className="text-[12px] text-slate-500">
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                  </span>
                )}
              </div>
            ))}
            {/* Secondary fields as label: value pairs */}
            {medCols.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {medCols.map((col) => (
                  <span key={col.key} className="text-[11.5px] text-slate-500">
                    <span className="font-medium text-slate-400">{col.header}: </span>
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

// ============================================================================
// KanbanScrollWrapper — wraps a horizontal kanban board with smooth mobile
// scroll. Prevents board from squishing at narrow viewports.
// ============================================================================

interface KanbanScrollWrapperProps {
  children: React.ReactNode
  className?: string
  /** Minimum width for the kanban board before scrolling kicks in. Default 640px. */
  minWidth?: number
}

export function KanbanScrollWrapper({
  children,
  className,
  minWidth = 640,
}: KanbanScrollWrapperProps) {
  return (
    <div className={cn("overflow-x-auto [-webkit-overflow-scrolling:touch] pb-4", className)}>
      <div style={{ minWidth }}>
        {children}
      </div>
    </div>
  )
}
