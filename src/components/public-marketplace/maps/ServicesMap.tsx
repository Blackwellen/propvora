'use client'

import dynamic from 'next/dynamic'
import type { PublicServiceOffer } from '@/lib/public-marketplace/types'

const ServicesMapInner = dynamic(() => import('./ServicesMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-50 animate-pulse flex items-center justify-center">
      <div className="text-slate-300 text-sm font-medium">Loading map…</div>
    </div>
  ),
})

export default function ServicesMap({ offers }: { offers: PublicServiceOffer[] }) {
  return <ServicesMapInner offers={offers} />
}
