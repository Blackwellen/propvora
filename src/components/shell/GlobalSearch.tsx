"use client"

// Topbar search trigger. The real search now lives in the global command
// palette (⌘K) mounted in AppShell — this is the visible affordance that opens
// it. Keeping a single search surface avoids duplicating query logic.

import { Search, Command } from "lucide-react"
import { cn } from "@/lib/utils"
import { openCommandPalette } from "@/components/search/CommandPalette"

interface GlobalSearchProps {
  className?: string
}

export default function GlobalSearch({ className }: GlobalSearchProps) {
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      aria-label="Open search (Control or Command K)"
      aria-keyshortcuts="Meta+K Control+K"
      className={cn(
        "group flex items-center gap-2 h-[44px] px-4 rounded-2xl border flex-1 max-w-[560px] text-left transition-all duration-200",
        "bg-[#F8FBFF] border-[#DDE8F7] hover:border-[#B9D2F3] hover:bg-white",
        className,
      )}
    >
      <Search className="w-4 h-4 text-[#94A3B8] shrink-0" aria-hidden />
      <span className="flex-1 text-[13.5px] text-[#94A3B8] truncate">
        Search properties, contacts, tasks…
      </span>
      <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#EBF2FF] text-[#64748B] text-[11px] font-medium shrink-0">
        <Command className="w-2.5 h-2.5" />K
      </kbd>
    </button>
  )
}
