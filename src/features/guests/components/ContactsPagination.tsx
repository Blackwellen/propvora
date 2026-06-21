import React from "react"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 24

interface ContactsPaginationProps {
  total: number
  page: number
  onPage: (p: number) => void
}

export function ContactsPagination({ total, page, onPage }: ContactsPaginationProps) {
  const pages = Math.ceil(total / PAGE_SIZE)
  if (pages <= 1) return null

  return (
    <div className="flex items-center justify-between text-xs text-slate-500 mt-4">
      <span>
        Showing{" "}
        <span className="font-semibold text-slate-700">
          {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)}
        </span>{" "}
        of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(pages, 5) }).map((_, i) => {
          const p = i + 1
          return (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-medium transition-colors",
                p === page
                  ? "bg-[#2563EB] text-white"
                  : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
              )}
            >
              {p}
            </button>
          )
        })}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === pages}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export { PAGE_SIZE }
