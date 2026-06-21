"use client"

import { Plus } from "lucide-react"

interface ListingsHeaderProps {
  count: number
  onNew: () => void
}

export function ListingsHeader({ count, onNew }: ListingsHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Listings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {count} booking listing{count === 1 ? "" : "s"}
        </p>
      </div>
      <button
        onClick={onNew}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" />
        New listing
      </button>
    </div>
  )
}
