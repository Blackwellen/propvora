import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'

export default function LongTermRentalInfoPanel() {
  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Long-term rentals</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Perfect for relocations, families, professionals and 6+ month moves.
        </p>
      </div>

      <ul className="space-y-2.5">
        {[
          'Verified homes',
          'Transparent costs',
          'Flexible move-in',
          'Trusted landlords',
        ].map((point) => (
          <li key={point} className="flex items-center gap-2.5 text-sm text-slate-700">
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            {point}
          </li>
        ))}
      </ul>

      <div className="border-t border-slate-200 pt-5">
        <p className="text-sm text-slate-500 mb-3">Need something shorter?</p>
        <Link
          href="/stays"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand)] transition-colors"
        >
          Browse short stays
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="bg-[var(--brand-soft)] rounded-xl p-4 border border-[var(--color-brand-100)]">
        <p className="text-xs font-semibold text-[var(--brand)] mb-1">Looking to list a property?</p>
        <p className="text-xs text-[var(--brand)] mb-3">
          Reach thousands of verified tenants looking for quality rentals.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-strong)] px-3 py-1.5 rounded-lg transition-colors"
        >
          List a property
        </Link>
      </div>
    </div>
  )
}
