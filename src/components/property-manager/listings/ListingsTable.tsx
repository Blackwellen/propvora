'use client'

import { Eye, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import type { Listing } from '@/lib/property-manager/listings/types'
import { cn } from '@/lib/utils'
import ListingChannelBadges from './ListingChannelBadges'

interface ListingsTableProps {
  listings: Listing[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function ListingStatusBadge({ listing }: { listing: Listing }) {
  if (listing.status === 'live') {
    return (
      <div>
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Live
        </span>
        <p className="text-xs text-slate-400 mt-0.5">Published</p>
      </div>
    )
  }
  if (listing.status === 'draft') {
    return (
      <div>
        <span className="inline-flex items-center bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 text-xs font-medium">
          Draft
        </span>
        <p className="text-xs text-slate-400 mt-0.5">Unpublished</p>
      </div>
    )
  }
  if (listing.status === 'needs_attention') {
    return (
      <div>
        <span className="inline-flex items-center bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 text-xs font-medium">
          Needs attention
        </span>
        <p className="text-xs text-slate-400 mt-0.5">Incomplete</p>
      </div>
    )
  }
  return null
}

function DirectPageCell({ listing }: { listing: Listing }) {
  if (listing.direct_page_status === 'live') {
    return (
      <div>
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Live
        </span>
        <Link href="#" className="block text-xs text-blue-600 hover:underline mt-0.5">View</Link>
      </div>
    )
  }
  if (listing.direct_page_status === 'draft') {
    return (
      <div>
        <span className="inline-flex items-center bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 text-xs font-medium">
          Draft
        </span>
        <Link href="#" className="block text-xs text-blue-600 hover:underline mt-0.5">Complete setup</Link>
      </div>
    )
  }
  return (
    <div>
      <span className="text-xs text-slate-400">Draft</span>
      <p className="text-xs text-slate-300">Not created</p>
    </div>
  )
}

export default function ListingsTable({ listings, selectedId, onSelect }: ListingsTableProps) {
  return (
    <div className="mt-4 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" className="rounded border-slate-300" />
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider min-w-[220px]">
                Listing
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-28">
                Type
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider min-w-[160px]">
                Availability
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-36">
                Pricing
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-28">
                Channels
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-28">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-28">
                Performance (MTD)
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-24">
                Direct page
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listings.map((listing) => {
              const isSelected = selectedId === listing.id
              return (
                <tr
                  key={listing.id}
                  onClick={() => onSelect(listing.id)}
                  className={cn(
                    'cursor-pointer hover:bg-slate-50 transition-colors',
                    isSelected && 'bg-sky-50 border-l-2 border-l-blue-600'
                  )}
                >
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded border-slate-300" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      {listing.property_image && (
                        <img
                          src={listing.property_image}
                          alt={listing.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{listing.title}</p>
                        <p className="text-xs text-slate-400">{listing.listing_reference}</p>
                        <p className="text-xs text-slate-400">{listing.property_location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                        listing.listing_type === 'long_term'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      )}>
                        {listing.listing_type === 'long_term' ? 'Long-term' : 'Short stay'}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 text-[10px] font-medium">
                        {listing.space_type === 'entire_home' ? 'Entire home' : listing.space_type === 'private_room' ? 'Private room' : 'Shared room'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className={cn(
                      'text-xs font-medium',
                      listing.availability_status === 'Open' || listing.availability_status === 'Available' ? 'text-emerald-600' : 'text-amber-600'
                    )}>
                      {listing.availability_status}
                    </p>
                    {listing.availability_note && (
                      <p className="text-xs text-slate-400 mt-0.5">{listing.availability_note}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-slate-700">{listing.price_display}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <ListingChannelBadges channels={listing.channels} />
                  </td>
                  <td className="px-4 py-3.5">
                    <ListingStatusBadge listing={listing} />
                  </td>
                  <td className="px-4 py-3.5">
                    {listing.occupancy_mtd != null ? (
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{listing.occupancy_mtd}%</p>
                        <p className="text-xs text-slate-500">{listing.adr_display}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">—</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <DirectPageCell listing={listing} />
                  </td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title="View listing"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title="More options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3.5 border-t border-slate-100">
        <p className="text-sm text-slate-500">Showing 1 to 8 of 130 listings</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((page) => (
            <button
              key={page}
              className={cn(
                'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                page === 1
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {page}
            </button>
          ))}
          <span className="text-slate-400 px-1">...</span>
          <button className="w-8 h-8 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            17
          </button>
        </div>
        <select className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>10 / page</option>
          <option>25 / page</option>
          <option>50 / page</option>
        </select>
      </div>
    </div>
  )
}
