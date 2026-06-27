"use client"

export type LeadSourceFilter = "all" | "quote_request" | "enquiry"

interface LeadsSourceFilterProps {
  value: LeadSourceFilter
  onChange: (src: LeadSourceFilter) => void
}

export function LeadsSourceFilter({ value, onChange }: LeadsSourceFilterProps) {
  const options: { key: LeadSourceFilter; label: string }[] = [
    { key: "all", label: "All types" },
    { key: "quote_request", label: "Quote requests" },
    { key: "enquiry", label: "Enquiries" },
  ]

  return (
    <div className="flex items-center gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-3 h-7 rounded-lg text-[12px] font-semibold transition-colors ${
            value === opt.key
              ? "bg-[var(--brand)] text-white"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
