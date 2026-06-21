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

interface ServicesMapProps {
  offers: PublicServiceOffer[]
  basePath?: string
}

export default function ServicesMap({ offers, basePath, height = 'h-full' }: ServicesMapProps & { height?: string }) {
  return (
    <div className={`w-full ${height}`}>
      <ServicesMapInner offers={offers} basePath={basePath} />
    </div>
  )
}
