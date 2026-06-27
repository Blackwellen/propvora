'use client'

import { useState, useMemo } from 'react'
import { Filter, Download, Plus, Search } from 'lucide-react'
import type { Booking } from '@/lib/property-manager/bookings/types'
import BookingKpiCards from './BookingKpiCards'
import BookingStatusTabs from './BookingStatusTabs'
import BookingsTable from './BookingsTable'
import BookingPreviewPanel from './BookingPreviewPanel'
import DisputesView from '@/features/bookings/disputes/components/DisputesView'

// Bookings table is not yet migrated to the live schema.
// This section is gated by the bookingManagement feature flag.
// When the migration is applied and the flag is enabled, replace the empty
// array below with a live Supabase query: supabase.from('bookings').select('*')
//   .eq('workspace_id', workspaceId).order('check_in_date', { ascending: false })
// The 42P01 guard should catch missing table errors until migration lands.

// "Arrivals" = confirmed bookings whose check-in date is today or within the next 7 days
function isArrivalSoon(b: Booking): boolean {
  if (b.status !== 'confirmed') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkIn = new Date(b.check_in_date)
  checkIn.setHours(0, 0, 0, 0)
  const diffDays = (checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= 7
}

export default function BookingsPage({ initialTab = 'all' }: { initialTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Live bookings array — empty until bookings table migration is applied and
  // bookingManagement feature flag is enabled. No seed/mock data shown to users.
  const bookings: Booking[] = []

  // Derive counts from the same dataset so tabs always match table totals
  const counts = useMemo(() => ({
    all: bookings.length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    arrivals: bookings.filter(isArrivalSoon).length,
    checked_in: bookings.filter((b) => b.status === 'checked_in').length,
    checked_out: bookings.filter((b) => b.status === 'checked_out').length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    long_term: bookings.filter((b) => b.booking_type === 'long_term').length,
    disputes: 0,
  }), [bookings])

  // Disputes is reachable via ?tab=disputes on the bookings page; render the
  // dedicated disputes workspace inline so the tab stays in context.
  if (activeTab === 'disputes') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="pt-6">
          <BookingStatusTabs activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />
        </div>
        <div className="flex-1 min-h-0">
          <DisputesView />
        </div>
      </div>
    )
  }

  const selectedBooking = bookings.find((b) => b.id === selectedId) ?? null

  const handleSelect = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  const filteredBookings = bookings.filter((b) => {
    if (search) {
      const q = search.toLowerCase()
      return (
        b.guest_name.toLowerCase().includes(q) ||
        b.booking_reference.toLowerCase().includes(q) ||
        b.property_name.toLowerCase().includes(q)
      )
    }
    if (activeTab === 'confirmed') return b.status === 'confirmed'
    if (activeTab === 'arrivals') return isArrivalSoon(b)
    if (activeTab === 'checked_in') return b.status === 'checked_in'
    if (activeTab === 'checked_out') return b.status === 'checked_out'
    if (activeTab === 'pending') return b.status === 'pending'
    if (activeTab === 'cancelled') return b.status === 'cancelled'
    if (activeTab === 'long_term') return b.booking_type === 'long_term'
    return true
  })

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto min-w-0 py-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage reservations, stays, arrivals and guest activity across your portfolio.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="hidden lg:flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button className="hidden lg:flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-1.5 bg-[var(--brand)] text-white rounded-xl px-3 py-2 text-sm font-medium hover:bg-[var(--brand-strong)] transition-colors">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create booking</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <BookingKpiCards bookings={bookings} />

        {/* Status Tabs */}
        <BookingStatusTabs activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />

        {/* Filter row */}
        <div className="mt-4 flex gap-2 items-center flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by guest name, property, booking ref..."
              className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
            />
          </div>
          <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] min-w-[150px]">
            <option>All properties</option>
          </select>
          <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] min-w-[150px]">
            <option>All booking types</option>
            <option>Short stay</option>
            <option>Long-term</option>
          </select>
          <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] min-w-[120px]">
            <option>All sources</option>
            <option>Direct</option>
            <option>Airbnb</option>
            <option>Booking.com</option>
          </select>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
            <span>Date range</span>
          </div>
          <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] min-w-[170px]">
            <option>All payment statuses</option>
            <option>Paid</option>
            <option>Unpaid</option>
            <option>Monthly</option>
          </select>
          <button
            onClick={() => { setSearch(''); setActiveTab('all') }}
            className="text-sm text-[var(--brand)] hover:text-[var(--brand)] transition-colors whitespace-nowrap"
          >
            Clear all
          </button>
        </div>

        {/* Table */}
        <BookingsTable
          bookings={filteredBookings}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      {/* Preview panel */}
      <BookingPreviewPanel
        booking={selectedBooking}
        onClose={() => setSelectedId(null)}
      />
    </div>
  )
}
