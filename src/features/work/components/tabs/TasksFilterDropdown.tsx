import React from "react"

interface TasksFilterDropdownProps {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}

export function TasksFilterDropdown({ label, options, value, onChange }: TasksFilterDropdownProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-[12.5px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]/50 appearance-none cursor-pointer"
        aria-label={label}
      >
        {options.map(o => (
          <option key={o} value={o === "All" ? "" : o}>{o}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </div>
  )
}
