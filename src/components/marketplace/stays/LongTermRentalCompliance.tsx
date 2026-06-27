import { CheckCircle, Shield, AlertCircle } from 'lucide-react'
import type { PublicLongTermRental } from '@/lib/public-marketplace/types'
import { cn } from '@/lib/utils'

interface LongTermRentalComplianceProps {
  rental: PublicLongTermRental
}

const EPC_COLOURS: Record<string, { bg: string; text: string; label: string }> = {
  A: { bg: 'bg-green-100', text: 'text-green-800', label: 'Most efficient' },
  B: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Very efficient' },
  C: { bg: 'bg-lime-100', text: 'text-lime-800', label: 'Efficient' },
  D: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Average' },
  E: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Below average' },
  F: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Poor' },
  G: { bg: 'bg-red-100', text: 'text-red-800', label: 'Least efficient' },
}

export default function LongTermRentalCompliance({ rental }: LongTermRentalComplianceProps) {
  const epc = rental.epcRating ? EPC_COLOURS[rental.epcRating] : null

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Compliance & certifications</h2>

      <div className="space-y-3">
        {/* EPC */}
        {rental.epcRating && epc && (
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <span className="text-sm text-slate-700 font-medium">EPC Rating</span>
              <p className="text-xs text-slate-400">{epc.label}</p>
            </div>
            <span
              className={cn(
                'inline-block text-base font-extrabold px-3 py-1 rounded-lg',
                epc.bg,
                epc.text,
              )}
            >
              {rental.epcRating}
            </span>
          </div>
        )}

        {/* Council tax */}
        {rental.councilTaxBand && (
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700 font-medium">Council Tax Band</span>
            <span className="text-sm font-semibold text-slate-900">Band {rental.councilTaxBand}</span>
          </div>
        )}

        {/* Licence verified */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-sm text-slate-700 font-medium">HMO / Selective Licence</span>
          {rental.licenceVerified ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
              <CheckCircle className="h-3 w-3" /> Verified
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
              <AlertCircle className="h-3 w-3" /> Not applicable
            </span>
          )}
        </div>

        {/* Landlord verified */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="text-sm text-slate-700 font-medium">Landlord verified</span>
          {rental.landlordVerified ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
              <CheckCircle className="h-3 w-3" /> Verified
            </span>
          ) : (
            <span className="text-xs text-slate-400">Not verified</span>
          )}
        </div>

        {/* Agent verified */}
        {rental.agentVerified && (
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700 font-medium">Agent / company verified</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
              <CheckCircle className="h-3 w-3" /> Verified
            </span>
          </div>
        )}

        {/* Deposit protection */}
        {rental.depositProtectionScheme && (
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-700 font-medium">Deposit protection</span>
            <span className="text-sm font-semibold text-slate-900">{rental.depositProtectionScheme}</span>
          </div>
        )}
      </div>

      {/* Right to Rent */}
      <div className="mt-4 bg-[var(--brand-soft)] rounded-xl p-4 border border-[var(--color-brand-100)]">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-[var(--brand)] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[var(--brand)] mb-0.5">Right to Rent</p>
            <p className="text-xs text-[var(--brand)] leading-relaxed">
              All tenants must pass a Right to Rent check as required by UK law. The landlord will request relevant identity documents before tenancy commencement.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
