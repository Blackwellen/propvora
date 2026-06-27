import type { Metadata } from 'next'
import LongTermRentalCard from '@/components/marketplace/stays/LongTermRentalCard'
import { getPublicLongTermRentals } from '@/lib/public-marketplace/queries'
import { BookmarkPlus, LayoutGrid, ClipboardList } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Long-term Rentals · Propvora',
  description: 'Browse verified long-term rentals and save your search.',
}

export default async function CustomerLongTermRentalsPage() {
  const rentals = await getPublicLongTermRentals()

  return (
    <div className="space-y-5">
      {/* Hero — full shell width, mirrors the Stays page */}
      <section className="rounded-3xl bg-gradient-to-b from-[var(--brand-soft)] to-white px-5 py-8 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">Long-term Rentals</h1>
            <p className="text-[15px] text-slate-500">
              Verified 6+ month lets across the UK — transparent costs, trusted landlords.
            </p>
          </div>
          <span className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{rentals.length}</span> available
          </span>
        </div>
      </section>

      {/* Customer action row */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
          <BookmarkPlus className="h-4 w-4" />
          Save search
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
          <LayoutGrid className="h-4 w-4" />
          Compare selected
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white rounded-lg transition-colors">
          <ClipboardList className="h-4 w-4" />
          Create rental brief
        </button>
      </div>

      {/* Grid */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-stretch">
          {rentals.map((rental) => (
            <LongTermRentalCard
              key={rental.id}
              rental={rental}
              basePath="/customer/stays/long-term"
            />
          ))}
        </div>
      </section>
    </div>
  )
}
