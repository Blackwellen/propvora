'use client'

import Link from 'next/link'
import { Heart, MapPin, Calendar, Users, Clock, CheckCircle } from 'lucide-react'
import { formatPence } from '@/lib/marketplace/money'
import type { PublicLongTermRental } from '@/lib/public-marketplace/types'

interface LongTermRentalEnquiryPanelProps {
  rental: PublicLongTermRental
  isAuthenticated?: boolean
  basePath?: string
}

export default function LongTermRentalEnquiryPanel({
  rental,
  isAuthenticated = false,
  basePath = '/stays/long-term',
}: LongTermRentalEnquiryPanelProps) {
  const availableDate = new Date(rental.availableFrom).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      {/* Price headline */}
      <div>
        <div className="flex items-baseline gap-1 mb-0.5">
          <span className="text-3xl font-extrabold text-slate-900">
            {formatPence(rental.monthlyRentPence)}
          </span>
          <span className="text-slate-500 font-medium">/month</span>
        </div>
        <p className="text-sm text-slate-500">
          Deposit: <span className="font-semibold text-slate-700">{formatPence(rental.depositPence)}</span>
        </p>
      </div>

      {/* Key facts */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="flex items-center gap-2 text-slate-500">
            <Calendar className="h-4 w-4" /> Available from
          </span>
          <span className="font-semibold text-slate-900">{availableDate}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="flex items-center gap-2 text-slate-500">
            <Clock className="h-4 w-4" /> Min tenancy
          </span>
          <span className="font-semibold text-slate-900">{rental.minTenancyMonths} months</span>
        </div>
        {rental.maxTenancyMonths && (
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="flex items-center gap-2 text-slate-500">
              <Clock className="h-4 w-4" /> Max tenancy
            </span>
            <span className="font-semibold text-slate-900">{rental.maxTenancyMonths} months</span>
          </div>
        )}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <span className="flex items-center gap-2 text-slate-500">
            <Users className="h-4 w-4" /> Max occupants
          </span>
          <span className="font-semibold text-slate-900">{rental.maxOccupants}</span>
        </div>
      </div>

      {/* Move-in date input */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          Preferred move-in date
        </label>
        <input
          type="date"
          min={rental.availableFrom}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Action buttons */}
      <div className="space-y-2.5">
        <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
          Request viewing
        </button>
        <button className="w-full py-3 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
          Message landlord
        </button>
        {isAuthenticated ? (
          <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">
            Start application
          </button>
        ) : (
          <Link
            href="/login"
            className="block w-full py-3 border border-emerald-500 text-emerald-700 hover:bg-emerald-50 text-sm font-semibold rounded-xl transition-colors text-center"
          >
            Sign in to apply
          </Link>
        )}
      </div>

      {/* Save + map */}
      <div className="flex items-center justify-between pt-1">
        <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <Heart className="h-4 w-4" /> Save property
        </button>
        <Link
          href={`${basePath}/map`}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <MapPin className="h-4 w-4" /> View on map
        </Link>
      </div>

      {/* Trust note */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
        <div className="flex items-center gap-2 mb-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-xs font-semibold text-slate-700">Propvora protection</span>
        </div>
        <p className="text-xs text-slate-500">
          All payments are secured. We never ask for cash or bank transfers.
        </p>
      </div>
    </div>
  )
}
