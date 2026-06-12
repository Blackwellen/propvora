"use client"

import { Plus, ChevronDown } from "lucide-react"

export default function QuickCreateButton() {
  return (
    <button className="flex items-center gap-2 h-[44px] px-5 rounded-2xl bg-[#2563EB] text-white text-[13.5px] font-semibold hover:bg-[#1d4ed8] active:scale-95 transition-all shadow-[0_4px_14px_rgba(37,99,235,0.30)] shrink-0">
      <Plus className="w-4 h-4" />
      New
      <ChevronDown className="w-3.5 h-3.5 opacity-70" />
    </button>
  )
}
