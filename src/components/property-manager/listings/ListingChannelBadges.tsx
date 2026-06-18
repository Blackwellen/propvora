'use client'

import { Home } from 'lucide-react'
import type { ListingChannel } from '@/lib/property-manager/listings/types'
import { cn } from '@/lib/utils'

interface ListingChannelBadgesProps {
  channels: ListingChannel[]
  maxVisible?: number
}

function ChannelBadge({ name }: { name: ListingChannel['name'] }) {
  if (name === 'airbnb') {
    return (
      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
        A
      </div>
    )
  }
  if (name === 'booking_com') {
    return (
      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
        B
      </div>
    )
  }
  if (name === 'direct') {
    return (
      <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0">
        <Home className="w-3 h-3" />
      </div>
    )
  }
  if (name === 'vrbo') {
    return (
      <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
        V
      </div>
    )
  }
  if (name === 'rightmove') {
    return (
      <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
        R
      </div>
    )
  }
  return null
}

export default function ListingChannelBadges({ channels, maxVisible = 3 }: ListingChannelBadgesProps) {
  const visible = channels.slice(0, maxVisible)
  const extra = channels.length - maxVisible

  return (
    <div className="flex items-center gap-1">
      {visible.map((ch, i) => (
        <ChannelBadge key={i} name={ch.name} />
      ))}
      {extra > 0 && (
        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-[10px] font-semibold shrink-0">
          +{extra}
        </div>
      )}
    </div>
  )
}
