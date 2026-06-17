'use client'

import dynamic from 'next/dynamic'
import type { PublicStay } from '@/lib/public-marketplace/types'

const StaysMapInner = dynamic(() => import('./StaysMapInner'), { ssr: false })

export default function StaysMap({ stays }: { stays: PublicStay[] }) {
  return (
    <div className="w-full h-full">
      <StaysMapInner stays={stays} />
    </div>
  )
}
