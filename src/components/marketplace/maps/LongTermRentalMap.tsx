'use client'

import dynamic from 'next/dynamic'
import type { PublicLongTermRental } from '@/lib/public-marketplace/types'

const LongTermRentalMapInner = dynamic(() => import('./LongTermRentalMapInner'), { ssr: false })

interface LongTermRentalMapProps {
  rentals: PublicLongTermRental[]
  basePath?: string
}

export default function LongTermRentalMap({
  rentals,
  basePath = '/stays/long-term',
}: LongTermRentalMapProps) {
  return (
    <div className="w-full h-full">
      <LongTermRentalMapInner rentals={rentals} basePath={basePath} />
    </div>
  )
}
