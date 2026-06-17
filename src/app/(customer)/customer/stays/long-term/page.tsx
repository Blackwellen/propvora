import type { Metadata } from 'next'
import StayTypeTabs from '@/components/marketplace/stays/StayTypeTabs'
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
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white pt-12 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <StayTypeTabs basePath="/customer/stays" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Long-term Rentals</h1>
              <p className="text-lg text-slate-500">
                Verified 6+ month lets across the UK — transparent costs, trusted landlords.
              </p>
            </div>
            <span className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900">{rentals.length}</span> available
            </span>
          </div>
        </div>
      </section>

      {/* Customer action row */}
      <div className="border-b border-slate-100 bg-white px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
            <BookmarkPlus className="h-4 w-4" />
            Save search
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
            <LayoutGrid className="h-4 w-4" />
            Compare selected
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <ClipboardList className="h-4 w-4" />
            Create rental brief
          </button>
        </div>
      </div>

      {/* Grid */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {rentals.map((rental) => (
              <LongTermRentalCard
                key={rental.id}
                rental={rental}
                basePath="/customer/stays/long-term"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
