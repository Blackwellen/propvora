import { cn } from "@/lib/utils"

const inputCls =
  "w-full h-10 px-3 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"

interface WizardPricingStepProps {
  basePrice: string
  onBasePriceChange: (v: string) => void
  cleaningFee: string
  onCleaningFeeChange: (v: string) => void
  minNights: number
  onMinNightsChange: (v: number) => void
}

export function WizardPricingStep({
  basePrice,
  onBasePriceChange,
  cleaningFee,
  onCleaningFeeChange,
  minNights,
  onMinNightsChange,
}: WizardPricingStepProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-600">Base nightly (£) *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
          <input
            value={basePrice}
            onChange={(e) => onBasePriceChange(e.target.value)}
            type="number"
            min="1"
            autoFocus
            className={cn(inputCls, "pl-7")}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-600">Cleaning fee (£)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
          <input
            value={cleaningFee}
            onChange={(e) => onCleaningFeeChange(e.target.value)}
            type="number"
            min="0"
            placeholder="0"
            className={cn(inputCls, "pl-7")}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-600">Minimum nights</label>
        <div className="inline-flex items-center border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => onMinNightsChange(Math.max(1, minNights - 1))}
            className="w-9 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg"
          >
            −
          </button>
          <span className="w-12 text-center text-sm font-semibold text-slate-800 select-none">
            {minNights}
          </span>
          <button
            type="button"
            onClick={() => onMinNightsChange(minNights + 1)}
            className="w-9 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
