import { formatPence } from '@/lib/marketplace/money'
import type { PublicLongTermRental } from '@/lib/public-marketplace/types'
import { Info, Zap } from 'lucide-react'

interface LongTermRentalCostBreakdownProps {
  rental: PublicLongTermRental
}

export default function LongTermRentalCostBreakdown({ rental }: LongTermRentalCostBreakdownProps) {
  const moveInTotal = rental.monthlyRentPence + rental.depositPence + (rental.holdingDepositPence ?? 0)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Cost breakdown</h2>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-sm text-slate-600">Monthly rent</span>
          <span className="text-sm font-semibold text-slate-900">
            {formatPence(rental.monthlyRentPence)}/mo
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div>
            <span className="text-sm text-slate-600">Security deposit</span>
            {rental.depositProtectionScheme && (
              <p className="text-xs text-slate-400">Protected by {rental.depositProtectionScheme}</p>
            )}
          </div>
          <span className="text-sm font-semibold text-slate-900">
            {formatPence(rental.depositPence)}
          </span>
        </div>

        {rental.holdingDepositPence !== undefined && rental.holdingDepositPence > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <span className="text-sm text-slate-600">Holding deposit</span>
              <p className="text-xs text-slate-400">Credited against first month</p>
            </div>
            <span className="text-sm font-semibold text-slate-900">
              {formatPence(rental.holdingDepositPence)}
            </span>
          </div>
        )}

        {rental.billsIncluded && (
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="flex items-center gap-1.5 text-sm text-sky-700">
              <Zap className="h-3.5 w-3.5" />
              Bills included
            </span>
            <span className="text-sm font-semibold text-sky-700">Included</span>
          </div>
        )}

        {rental.councilTaxBand && (
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">Council tax band</span>
            <span className="text-sm font-semibold text-slate-900">Band {rental.councilTaxBand}</span>
          </div>
        )}

        {/* Move-in total */}
        <div className="flex items-center justify-between pt-2 mt-1">
          <div>
            <span className="text-sm font-bold text-slate-900">Estimated move-in cost</span>
            <p className="text-xs text-slate-400">First month + deposit</p>
          </div>
          <span className="text-base font-extrabold text-slate-900">
            {formatPence(moveInTotal)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
        <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          Security deposits are protected under a government-approved scheme and must be returned within 10 days of tenancy end, minus any agreed deductions.
        </p>
      </div>
    </div>
  )
}
