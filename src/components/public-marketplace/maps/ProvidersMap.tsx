'use client'

import type { PublicProvider } from '@/lib/public-marketplace/types'

const POINTS = [
  { left: 46, top: 38 }, { left: 24, top: 31 }, { left: 68, top: 35 }, { left: 63, top: 60 },
  { left: 36, top: 67 }, { left: 55, top: 76 }, { left: 73, top: 52 }, { left: 28, top: 54 },
]

export default function ProvidersMap({ providers }: { providers: PublicProvider[] }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#eef6f2]">
      <MapTexture />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <circle cx="46" cy="40" r="19" fill="rgba(59,130,246,.13)" stroke="#38bdf8" strokeWidth=".35" strokeDasharray="1 1" />
        <circle cx="63" cy="62" r="13" fill="rgba(59,130,246,.11)" stroke="#38bdf8" strokeWidth=".35" strokeDasharray="1 1" />
        <circle cx="35" cy="67" r="10" fill="rgba(59,130,246,.10)" stroke="#38bdf8" strokeWidth=".35" strokeDasharray="1 1" />
        <circle cx="68" cy="35" r="9" fill="rgba(59,130,246,.10)" stroke="#38bdf8" strokeWidth=".35" strokeDasharray="1 1" />
      </svg>

      <div className="absolute left-[42%] top-[40%] text-[28px] font-extrabold text-slate-900">Manchester</div>
      {['Salford', 'Prestwich', 'Stockport', 'Didsbury', 'Wilmslow', 'Altrincham', 'Hyde'].map((label, index) => (
        <span key={label} className="absolute text-[13px] font-medium text-slate-600" style={{ left: `${[16, 47, 64, 48, 55, 34, 80][index]}%`, top: `${[38, 19, 70, 54, 83, 72, 35][index]}%` }}>
          {label}
        </span>
      ))}

      {providers.slice(0, 8).map((provider, index) => {
        const point = POINTS[index % POINTS.length]
        return (
          <div key={provider.id} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${point.left}%`, top: `${point.top}%` }}>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white text-sm font-extrabold text-white shadow-xl"
              style={{ backgroundColor: provider.pinColor }}
            >
              {provider.initials}
            </div>
          </div>
        )
      })}

      <div className="absolute left-[17%] top-[28%] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-extrabold text-yellow-300 shadow-xl">ME</div>
      <div className="absolute left-[67%] top-[27%] z-10 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-800 text-sm font-extrabold text-white shadow-xl">NW</div>
    </div>
  )
}

function MapTexture() {
  return (
    <>
      <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(25deg,transparent_0_48%,rgba(14,165,233,.45)_49%_51%,transparent_52%),linear-gradient(100deg,transparent_0_47%,rgba(14,165,233,.28)_48%_51%,transparent_52%),linear-gradient(0deg,rgba(255,255,255,.65)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.65)_1px,transparent_1px)] [background-size:520px_190px,420px_220px,42px_42px,42px_42px]" />
      <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_15%_82%,rgba(34,197,94,.16)_0_6%,transparent_7%),radial-gradient(circle_at_82%_18%,rgba(34,197,94,.16)_0_7%,transparent_8%),radial-gradient(circle_at_50%_88%,rgba(34,197,94,.12)_0_8%,transparent_9%)]" />
    </>
  )
}
