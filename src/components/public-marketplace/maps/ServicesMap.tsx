'use client'

import Image from 'next/image'
import { ChevronDown, Star } from 'lucide-react'
import type { PublicServiceOffer } from '@/lib/public-marketplace/types'

const POINTS = [
  { left: 25, top: 31 }, { left: 39, top: 20 }, { left: 56, top: 27 }, { left: 73, top: 43 },
  { left: 68, top: 68 }, { left: 47, top: 73 }, { left: 31, top: 62 }, { left: 18, top: 47 },
]

export default function ServicesMap({ offers }: { offers: PublicServiceOffer[] }) {
  const active = offers[0]

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#eef6f2]">
      <MapTexture />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <polygon points="39,16 63,24 76,44 70,68 51,77 31,64 26,39" fill="rgba(59,130,246,.15)" stroke="#245cff" strokeWidth=".42" />
        <polyline points="39,16 63,24 76,44 70,68 51,77 31,64 26,39 39,16" fill="none" stroke="#245cff" strokeWidth=".65" />
      </svg>

      {offers.slice(0, 8).map((offer, index) => {
        const point = POINTS[index % POINTS.length]
        return (
          <div key={offer.id} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${point.left}%`, top: `${point.top}%` }}>
            <div className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-extrabold text-white shadow-lg">£{Math.round(offer.basePrice / 100)}</div>
          </div>
        )
      })}

      <span className="absolute left-[42%] top-[45%] text-[13px] font-medium text-slate-600">Rusholme</span>
      <span className="absolute left-[18%] top-[48%] text-[13px] font-medium text-slate-600">Trafford Park</span>
      <span className="absolute left-[55%] top-[20%] text-[13px] font-medium text-slate-600">Pendleton</span>

      {active && (
        <div className="absolute left-[43%] top-[30%] z-20 w-[210px] rounded-xl border-4 border-blue-600 bg-white p-2 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="relative h-[82px] w-[98px] overflow-hidden rounded-md">
              <Image src={active.heroImage} alt={active.title} fill className="object-cover" sizes="100px" />
            </div>
            <ChevronDown className="ml-auto h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-[15px] font-extrabold leading-tight text-slate-950">{active.providerName}</p>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="rounded bg-blue-600 px-1.5 py-0.5 font-bold text-white">Pro</span>
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="font-bold text-slate-900">{active.rating}</span>
          </div>
          <button className="mt-3 h-8 w-full rounded-lg border border-blue-200 text-xs font-bold text-blue-600">View profile</button>
        </div>
      )}
    </div>
  )
}

function MapTexture() {
  return (
    <>
      <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(25deg,transparent_0_48%,rgba(14,165,233,.45)_49%_51%,transparent_52%),linear-gradient(100deg,transparent_0_47%,rgba(14,165,233,.28)_48%_51%,transparent_52%),linear-gradient(0deg,rgba(255,255,255,.65)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.65)_1px,transparent_1px)] [background-size:520px_190px,420px_220px,42px_42px,42px_42px]" />
      <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_20%_74%,rgba(34,197,94,.18)_0_6%,transparent_7%),radial-gradient(circle_at_82%_18%,rgba(34,197,94,.16)_0_7%,transparent_8%)]" />
    </>
  )
}
