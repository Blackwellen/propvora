'use client'

import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import type { Listing } from '@/lib/property-manager/listings/types'
import { cn } from '@/lib/utils'
import ListingChannelBadges from './ListingChannelBadges'

interface ListingPreviewPanelProps {
  listing: Listing | null
  onClose: () => void
}

const LISTING_IMAGES = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600',
]

const READINESS_ITEMS = [
  { label: 'Photos (18 high quality)', done: true },
  { label: 'Location', done: true },
  { label: 'Description', done: true },
  { label: 'Availability settings', done: true },
  { label: 'Amenities', done: true },
  { label: 'Policies', done: true },
  { label: 'House rules', done: true },
  { label: 'ID verification', done: false },
  { label: 'Pricing & fees', done: true },
]

export default function ListingPreviewPanel({ listing, onClose }: ListingPreviewPanelProps) {
  const [imgIdx, setImgIdx] = useState(0)

  if (!listing) {
    return (
      <div className="hidden lg:flex w-80 shrink-0 border-l border-slate-200 bg-white overflow-y-auto items-center justify-center">
        <p className="text-slate-400 text-sm text-center px-6">
          Select a listing to view availability, pricing, channels and performance details.
        </p>
      </div>
    )
  }

  const score = listing.quality_score ?? 0

  return (
    <div className="hidden lg:flex w-80 shrink-0 border-l border-slate-200 bg-white overflow-y-auto flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{listing.listing_reference}</span>
          {listing.status === 'live' && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          )}
          {listing.status === 'draft' && (
            <span className="inline-flex items-center bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 text-xs font-medium">
              Draft
            </span>
          )}
          {listing.status === 'needs_attention' && (
            <span className="inline-flex items-center bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 text-xs font-medium">
              Needs attention
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 flex-1">
        {/* Image carousel */}
        <div className="relative aspect-video rounded-xl overflow-hidden">
          <img
            src={LISTING_IMAGES[imgIdx]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-2 left-2 bg-slate-900/70 text-white text-xs px-2 py-0.5 rounded-full">
            {imgIdx + 1} / 18
          </span>
          <button
            onClick={() => setImgIdx((p) => Math.max(0, p - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 text-slate-700 flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setImgIdx((p) => Math.min(LISTING_IMAGES.length - 1, p + 1))}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 text-slate-700 flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Title & info */}
        <div>
          <h3 className="text-xl font-bold text-slate-900">{listing.title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{listing.property_location}</p>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            <span className="bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs px-2 py-0.5">
              {listing.listing_type === 'short_stay' ? 'Short stay' : 'Long-term'}
            </span>
            <span className="bg-slate-50 text-slate-600 border border-slate-100 rounded-full text-xs px-2 py-0.5">
              {listing.space_type === 'entire_home' ? 'Entire home' : listing.space_type === 'private_room' ? 'Private room' : 'Shared room'}
            </span>
          </div>
        </div>

        {/* Channels + Next available */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1.5">Channels</p>
            <ListingChannelBadges channels={listing.channels} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1.5">Next available</p>
            <p className="text-sm font-medium text-slate-700">24 Jun 2026</p>
          </div>
        </div>

        {/* Min stay + Notice */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Minimum stay</p>
            <p className="text-sm font-medium text-slate-700">2 nights</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Notice</p>
            <p className="text-sm font-medium text-slate-700">3 days</p>
          </div>
        </div>

        {/* Price */}
        <div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Price snapshot (from)</p>
          <p className="text-2xl font-bold text-slate-900">£180 / night</p>
          <p className="text-xs text-slate-400 mt-0.5">Cleaning fee £40 • Service fee £30</p>
        </div>

        {/* Direct booking */}
        {listing.direct_page_status && (
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1.5">Direct-booking page</p>
            <div className="flex items-center gap-2">
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                listing.direct_page_status === 'live' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                'bg-slate-100 text-slate-500'
              )}>
                {listing.direct_page_status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                {listing.direct_page_status === 'live' ? 'Live' : 'Draft'}
              </span>
            </div>
            <a
              href="#"
              className="text-xs text-blue-600 hover:underline mt-1 flex items-center gap-1 truncate"
            >
              propvora.com/listings/{listing.listing_reference.toLowerCase()}
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        )}

        {/* Sync health */}
        <div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1.5">Sync health</p>
          <div className="flex items-center gap-1.5 mb-1">
            <ListingChannelBadges channels={listing.channels} maxVisible={4} />
            <span className="text-emerald-600 font-bold text-sm ml-1">100%</span>
          </div>
          <p className="text-xs text-slate-500">All channels up to date</p>
          <p className="text-xs text-slate-400">Last synced 2 mins ago</p>
        </div>

        {/* Quality score */}
        <div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1.5">Quality score</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{score} / 100</span>
            <span className="text-sm text-emerald-600">
              {score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'Needs improvement'}
            </span>
          </div>
          <div className="mt-2 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Readiness checklist */}
        <div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">Readiness checklist</p>
          <div className="grid grid-cols-2 gap-1.5">
            {READINESS_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={item.done ? 'text-emerald-500' : 'text-amber-400'}>
                  {item.done ? '✅' : '○'}
                </span>
                <span className="text-xs text-slate-600 truncate">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">Quick actions</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              'Edit listing', 'Open calendar',
              'Update pricing', 'Manage availability',
              'Open direct page', 'Channel sync',
              'View performance', 'Duplicate listing',
            ].map((action) => (
              <button
                key={action}
                className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-left"
              >
                {action}
              </button>
            ))}
          </div>
          <button className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
            More actions ▾
          </button>
        </div>
      </div>
    </div>
  )
}
