import React from "react"
import Link from "next/link"
import { AlertCircle, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface BlockedItem {
  title: string
  property: string
  tag: string
  tagColor: string
}

interface BlockedItemsPanelProps {
  blockedItems: BlockedItem[]
}

export function BlockedItemsPanel({ blockedItems }: BlockedItemsPanelProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-900">Blocked Items</h2>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700">
          {blockedItems.length} Blocked
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {blockedItems.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 leading-snug">{item.title}</p>
              <p className="text-xs text-slate-500">{item.property}</p>
              <span className={cn("inline-flex mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md", item.tagColor)}>
                {item.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/property-manager/work/board"
        className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8]"
      >
        View All <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
