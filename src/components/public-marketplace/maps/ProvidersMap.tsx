'use client'

import dynamic from 'next/dynamic'
import type { PublicProvider } from '@/lib/public-marketplace/types'

const ProvidersMapInner = dynamic(() => import('./ProvidersMapInner'), { ssr: false })

export default function ProvidersMap({ providers }: { providers: PublicProvider[] }) {
  return (
    <div className="w-full h-full">
      <ProvidersMapInner providers={providers} />
    </div>
  )
}
