'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const STAYS_AREAS = ['All areas', 'City Centre', 'Spinningfields', 'Northern Quarter', 'Salford Quays', 'Didsbury', 'Chorlton']
const SERVICES_AREAS = ['All areas', 'City Centre', 'Salford', 'Northern Quarter', 'Didsbury', 'Chorlton', 'Stockport']
const PROVIDERS_AREAS = ['All areas', 'City Centre', 'Salford', 'Trafford', 'Stockport', 'Bury', 'Oldham']

export default function MapAreaChips({ variant = 'stays' }: { variant?: 'stays' | 'services' | 'providers' }) {
  const [active, setActive] = useState('All areas')
  const areas = variant === 'stays' ? STAYS_AREAS : variant === 'services' ? SERVICES_AREAS : PROVIDERS_AREAS

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
      {areas.map(area => (
        <button
          key={area}
          onClick={() => setActive(area)}
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap',
            active === area
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
          )}
        >
          {area}
        </button>
      ))}
      <button className="shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border bg-white text-slate-600 border-slate-200 hover:border-slate-300 whitespace-nowrap">
        More…
      </button>
    </div>
  )
}
