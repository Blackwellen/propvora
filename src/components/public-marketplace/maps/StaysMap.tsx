'use client'

import Image from 'next/image'
import type { PublicStay } from '@/lib/public-marketplace/types'

const POINTS = [
  { left: 35, top: 25 }, { left: 67, top: 28 }, { left: 78, top: 47 }, { left: 62, top: 65 },
  { left: 41, top: 72 }, { left: 29, top: 55 }, { left: 22, top: 41 }, { left: 55, top: 38 },
]

export default function StaysMap({ stays }: { stays: PublicStay[] }) {
  const featured = stays[0]

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#eef6f2]">
      <MapTexture />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <polygon points="36,20 68,27 77,49 64,68 42,73 28,58 31,37" fill="rgba(59,130,246,.14)" stroke="#1d4ed8" strokeWidth=".35" />
        <circle cx="50" cy="53" r="18" fill="rgba(14,165,233,.10)" stroke="#38bdf8" strokeWidth=".25" strokeDasharray="1 1" />
      </svg>

      <div className="absolute left-[42%] top-[38%] text-[28px] font-extrabold text-slate-900">Manchester</div>
      {['Salford', 'Spinningfields', 'Northern Quarter', 'Didsbury', 'Chorlton', 'Stockport', 'Ancoats'].map((label, index) => (
        <span key={label} className="absolute text-[13px] font-medium text-slate-600" style={{ left: `${[12, 34, 58, 50, 35, 72, 54][index]}%`, top: `${[33, 42, 35, 72, 80, 77, 28][index]}%` }}>
          {label}
        </span>
      ))}

      {stays.slice(0, 8).map((stay, index) => {
        const point = POINTS[index % POINTS.length]
        return (
          <div key={stay.id} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${point.left}%`, top: `${point.top}%` }}>
            <div className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-extrabold text-white shadow-lg">£{Math.round(stay.pricePerNight / 100)}</div>
          </div>
        )
      })}

      {featured && (
        <div className="absolute left-[32%] top-[25%] z-20 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="relative h-14 w-28">
            <Image src={featured.heroImage} alt={featured.title} fill className="object-cover" sizes="112px" />
          </div>
          <p className="px-2 py-1 text-center text-sm font-extrabold text-slate-900">£{Math.round(featured.pricePerNight / 100)}</p>
        </div>
      )}
    </div>
  )
}

function MapTexture() {
  return (
    <>
      <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(25deg,transparent_0_48%,rgba(14,165,233,.45)_49%_51%,transparent_52%),linear-gradient(100deg,transparent_0_47%,rgba(14,165,233,.28)_48%_51%,transparent_52%),linear-gradient(0deg,rgba(255,255,255,.65)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.65)_1px,transparent_1px)] [background-size:520px_190px,420px_220px,42px_42px,42px_42px]" />
      <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_22%_77%,rgba(34,197,94,.20)_0_5%,transparent_6%),radial-gradient(circle_at_82%_18%,rgba(34,197,94,.16)_0_7%,transparent_8%),radial-gradient(circle_at_18%_20%,rgba(34,197,94,.14)_0_6%,transparent_7%)]" />
    </>
  )
}
