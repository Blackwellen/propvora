"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

export interface SupplierFilterBarProps {
  search: string
  onSearchChange: (v: string) => void
}

export function SupplierFilterBar({ search, onSearchChange }: SupplierFilterBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search suppliers…"
        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] bg-white"
      />
    </div>
  )
}

export default SupplierFilterBar
