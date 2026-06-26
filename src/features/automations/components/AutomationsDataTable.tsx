"use client"

import type { ReactNode } from "react"

export interface DataColumn<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  className?: string
}

/**
 * Reusable bordered table. Header bg-slate-50 uppercase, rows py-3, hover.
 * Optional selectable checkbox column + pagination footer.
 */
export default function AutomationsDataTable<T extends { id: string }>({
  columns,
  rows,
  selectable = false,
  selectedIds = [],
  onToggleRow,
  onToggleAll,
  onRowClick,
  activeRowId,
  page = 1,
  pageSize = 10,
  total,
  onPageChange,
  emptyMessage = "No records to show.",
}: {
  columns: DataColumn<T>[]
  rows: T[]
  selectable?: boolean
  selectedIds?: string[]
  onToggleRow?: (id: string) => void
  onToggleAll?: (checked: boolean) => void
  onRowClick?: (row: T) => void
  activeRowId?: string | null
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  emptyMessage?: string
}) {
  const totalCount = total ?? rows.length
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalCount)
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))
  const allChecked = selectable && rows.length > 0 && rows.every((r) => selectedIds.includes(r.id))

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {selectable && (
                <th scope="col" className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => onToggleAll?.(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.key} scope="col" className={`px-4 py-2.5 ${c.className ?? ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center text-sm text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const active = activeRowId === row.id
                return (
                  <tr
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={onRowClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(row) } } : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "button" : undefined}
                    aria-current={active ? "true" : undefined}
                    className={[
                      "transition",
                      onRowClick ? "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500" : "",
                      active ? "bg-blue-50/60" : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {selectable && (
                      <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={() => onToggleRow?.(row.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          aria-label="Select row"
                        />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.key} className={`px-4 py-3 align-middle ${c.className ?? ""}`}>
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        <span>
          Showing {start} to {end} of {totalCount.toLocaleString()}
        </span>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-500">{pageSize} / page</span>
          <button
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
            disabled={page <= 1}
            aria-label="Previous page"
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="font-medium text-slate-700" aria-live="polite" aria-atomic="true">
            {page} / {pageCount}
          </span>
          <button
            onClick={() => onPageChange?.(Math.min(pageCount, page + 1))}
            disabled={page >= pageCount}
            aria-label="Next page"
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
