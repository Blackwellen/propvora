import { cn } from "@/lib/utils"

export type BillingCycle = "monthly" | "annual"

interface Props {
  billing: BillingCycle
  onChange: (cycle: BillingCycle) => void
}

export default function PricingToggle({ billing, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
      <button
        onClick={() => onChange("monthly")}
        className={cn(
          "px-5 py-2 rounded-lg text-sm font-semibold transition-all",
          billing === "monthly"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        )}
      >
        Monthly
      </button>
      <button
        onClick={() => onChange("annual")}
        className={cn(
          "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all",
          billing === "annual"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        )}
      >
        Annual
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-xs font-bold",
            billing === "annual"
              ? "bg-emerald-400 text-slate-900"
              : "bg-emerald-100 text-emerald-700"
          )}
        >
          Save 2 months
        </span>
      </button>
    </div>
  )
}
