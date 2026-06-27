"use client"

import { cn } from "@/lib/utils"

const FILTERS = [
  { id: "active", label: "Active" },
  { id: "assigned", label: "New" },
  { id: "in_progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All" },
] as const

export type JobFilterId = (typeof FILTERS)[number]["id"]

interface JobsFilterPanelProps {
  active: JobFilterId
  onChange: (id: JobFilterId) => void
  counts: Record<string, number>
}

export function JobsFilterPanel({ active, onChange, counts }: JobsFilterPanelProps) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {FILTERS.map((f) => {
        const count = counts[f.id] ?? 0
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={cn(
              "px-3.5 py-2.5 text-sm font-semibold -mb-px border-b-2 whitespace-nowrap transition-colors",
              active === f.id
                ? "border-[var(--brand)] text-[var(--brand)]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {f.label}
            {count > 0 && (
              <span className="ml-1.5 text-[11px] text-slate-400">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
