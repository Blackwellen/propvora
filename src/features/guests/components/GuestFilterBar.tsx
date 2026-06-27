"use client"

import React from "react"
import { Search, X } from "lucide-react"

interface GuestFilterBarProps {
  query: string
  onQueryChange: (value: string) => void
}

export function GuestFilterBar({ query, onQueryChange }: GuestFilterBarProps) {
  return (
    <div className="relative mb-4 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search by guest, email or property…"
        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
      />
      {query && (
        <button
          onClick={() => onQueryChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
