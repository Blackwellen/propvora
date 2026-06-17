'use client'

import dynamic from 'next/dynamic'
import type { PublicServiceOffer } from '@/lib/public-marketplace/types'

const ServicesMapInner = dynamic(() => import('./ServicesMapInner'), { ssr: false })

export default function ServicesMap({ offers }: { offers: PublicServiceOffer[] }) {
  return (
    <div className="w-full h-full">
      <ServicesMapInner offers={offers} />
    </div>
  )
}
