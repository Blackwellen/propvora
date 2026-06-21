'use client'

import dynamic from 'next/dynamic'
import type { PublicStay } from '@/lib/public-marketplace/types'

const StaysMapInner = dynamic(() => import('./StaysMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-50 animate-pulse flex items-center justify-center">
      <div className="text-slate-300 text-sm font-medium">Loading map…</div>
    </div>
  ),
})

export default function StaysMap({ stays, height = 'h-full' }: { stays: PublicStay[]; height?: string }) {
  return (
    <div className={`w-full ${height}`}>
      <StaysMapInner stays={stays} />
    </div>
  )
}
