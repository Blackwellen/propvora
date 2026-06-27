"use client"

import Link from "next/link"
import { Building2 } from "lucide-react"
import { PropertyCard, type PropertyCardData } from "@/components/portfolio/PropertyCard"
import type { HomeProperty } from "../types"

interface HomePortfolioSnapshotCardProps {
  properties: HomeProperty[]
}

/** Map the dashboard's HomeProperty onto the canonical PropertyCard shape so
    the home snapshot renders the exact same card as the Portfolio › Properties
    page (no bespoke mini-card). */
function toCardData(p: HomeProperty): PropertyCardData {
  const units = p.units
  const occupied = p.occupied ?? Math.round((p.occupancyPct / 100) * Math.max(units, 1))
  return {
    id: p.id,
    name: p.name,
    address: p.address ?? p.city ?? "",
    postcode: p.postcode ?? "",
    type: p.type ?? "Other",
    category: p.category ?? null,
    status: p.status ?? "Active",
    units,
    occupied,
    tenants: p.tenants ?? occupied,
    monthlyRent: p.monthlyRent,
    operationProfile: p.operationProfile,
    bedrooms: p.bedrooms,
    coverImageUrl: p.coverImageUrl,
  }
}

export function HomePortfolioSnapshotCard({ properties }: HomePortfolioSnapshotCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-slate-900">Portfolio snapshot</h3>
        <Link href="/property-manager/portfolio/properties" className="text-[12px] font-medium text-[var(--brand)] hover:text-[var(--brand-strong)] transition-colors">
          View all →
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-10">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
            <Building2 className="text-slate-300" style={{ width: 24, height: 24 }} />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-medium text-slate-600">No properties yet</p>
            <p className="text-[12px] text-slate-400 mt-0.5">Add your first property to get started</p>
          </div>
          <Link
            href="/property-manager/portfolio/properties/new"
            className="text-[12px] font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)] transition-colors"
          >
            Add first property →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={toCardData(p)} />
          ))}
        </div>
      )}
    </div>
  )
}
