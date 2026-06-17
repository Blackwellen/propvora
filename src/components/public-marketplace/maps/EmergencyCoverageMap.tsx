'use client'

import dynamic from 'next/dynamic'

const EmergencyCoverageMapInner = dynamic(() => import('./EmergencyCoverageMapInner'), { ssr: false })

interface EmergencyCoverageMapProps {
  lat: number
  lng: number
  radiusMiles?: number
}

export default function EmergencyCoverageMap({ lat, lng, radiusMiles }: EmergencyCoverageMapProps) {
  return (
    <div className="w-full h-full">
      <EmergencyCoverageMapInner lat={lat} lng={lng} radiusMiles={radiusMiles} />
    </div>
  )
}
