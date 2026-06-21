"use client"

import Link from "next/link"
import { Building2 } from "lucide-react"
import type { HomeProperty } from "../types"

interface HomePortfolioSnapshotCardProps {
  properties: HomeProperty[]
}

function OccupancyBar({ pct }: { pct: number }) {
  return (
    <div className="mt-1.5">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-slate-400">Occupancy</span>
        <span className="text-[10px] font-medium text-slate-600">{pct}%</span>
      </div>
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}

function PropertyMiniCard({ property }: { property: HomeProperty }) {
  const gradients = [
    "from-blue-200 to-blue-400",
    "from-slate-300 to-slate-500",
    "from-indigo-200 to-indigo-400",
    "from-emerald-200 to-emerald-400",
    "from-violet-200 to-violet-400",
  ]
  const gradient = property.gradient || gradients[0]
  const cover = property.coverImageUrl

  return (
    <Link
      href={property.href ?? `/property-manager/portfolio/properties/${property.id}`}
      className="flex-1 min-w-0 block rounded-xl overflow-hidden border border-[#E2E8F0] hover:shadow-md transition-shadow group"
    >
      <div className={`relative h-[58px] bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={property.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <Building2 className="text-white/70" style={{ width: 20, height: 20 }} />
        )}
        <div className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
          <span className="text-[9px] font-bold text-slate-700">{property.occupancyPct}%</span>
        </div>
      </div>
      <div className="px-2.5 py-2 bg-white">
        <p className="text-[11px] font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
          {property.name}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[10px] text-slate-500 truncate mr-1">{property.city}</span>
          <span className="text-[10px] font-semibold text-slate-700 shrink-0">
            {`£${property.monthlyRent.toLocaleString("en-GB")}`}
          </span>
        </div>
        <OccupancyBar pct={property.occupancyPct} />
      </div>
    </Link>
  )
}

export function HomePortfolioSnapshotCard({ properties }: HomePortfolioSnapshotCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-slate-900">Portfolio snapshot</h3>
        <Link href="/property-manager/portfolio/properties" className="text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors">
          View all →
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-6">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
            <Building2 className="text-slate-300" style={{ width: 24, height: 24 }} />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-medium text-slate-600">No properties yet</p>
            <p className="text-[12px] text-slate-400 mt-0.5">Add your first property to get started</p>
          </div>
          <Link
            href="/property-manager/portfolio/properties/new"
            className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Add first property →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 flex-1">
          {properties.map((p) => (
            <PropertyMiniCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  )
}
