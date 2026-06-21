'use client'

import dynamic from 'next/dynamic'
import type { PublicProvider } from '@/lib/public-marketplace/types'

const ProvidersMapInner = dynamic(() => import('./ProvidersMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-50 animate-pulse flex items-center justify-center">
      <div className="text-slate-300 text-sm font-medium">Loading map…</div>
    </div>
  ),
})

interface ProvidersMapProps {
  providers: PublicProvider[]
  /** Base path for "View profile" links. Defaults to /property-manager/marketplace/suppliers-hub */
  basePath?: string
}

export default function ProvidersMap({ providers, basePath, height = 'h-full' }: ProvidersMapProps & { height?: string }) {
  return (
    <div className={`w-full ${height}`}>
      <ProvidersMapInner providers={providers} basePath={basePath} />
    </div>
  )
}
