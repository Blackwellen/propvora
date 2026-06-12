"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Heart, MoreHorizontal, TrendingUp, Building2, Eye, Edit2, Plus, Users, Archive } from "lucide-react"
import { ActionMenu } from "@/components/portfolio/ActionMenu"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
export interface PropertyCardData {
  id: string
  name: string
  address: string
  postcode: string
  city?: string
  type: "HMO" | "BTL" | "SA" | "R2R" | "Commercial" | "Mixed" | "Holiday Let" | "Other"
  status: "Active" | "Vacant" | "Under Works" | "Archived"
  units: number
  occupied?: number
  tenants: number
  monthlyRent: number
  operationProfile?: string
  coverImageUrl?: string
  bedrooms?: number
  bathrooms?: number
  arrears?: number
  openWork?: number
  healthScore?: "healthy" | "watch" | "at_risk" | "critical"
  yield?: number
  isFavourited?: boolean
}

/* ------------------------------------------------------------------ */
/* Config                                                               */
/* ------------------------------------------------------------------ */
const TYPE_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  SA:            { label: "SA",      bg: "bg-violet-600",  text: "text-white" },
  R2R:           { label: "R2R",     bg: "bg-orange-500",  text: "text-white" },
  HMO:           { label: "HMO",     bg: "bg-blue-600",    text: "text-white" },
  BTL:           { label: "BTL",     bg: "bg-emerald-600", text: "text-white" },
  "Holiday Let": { label: "Holiday", bg: "bg-cyan-600",    text: "text-white" },
  Commercial:    { label: "Comm.",   bg: "bg-slate-600",   text: "text-white" },
  Mixed:         { label: "Mixed",   bg: "bg-indigo-600",  text: "text-white" },
  Other:         { label: "Rental",  bg: "bg-teal-600",    text: "text-white" },
}

const PROFILE_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  "Serviced Accommodation": { label: "SA",      bg: "bg-violet-600",  text: "text-white" },
  "Rent-to-Rent":           { label: "R2R",     bg: "bg-orange-500",  text: "text-white" },
  "HMO":                    { label: "HMO",     bg: "bg-blue-600",    text: "text-white" },
  "Long-Term Let":          { label: "BTL",     bg: "bg-emerald-600", text: "text-white" },
  "Student Let":            { label: "Student", bg: "bg-teal-500",    text: "text-white" },
  "Build-to-Rent":          { label: "BTR",     bg: "bg-sky-600",     text: "text-white" },
  "Co-Living":              { label: "Co-Liv",  bg: "bg-purple-600",  text: "text-white" },
  "Holiday Let":            { label: "Holiday", bg: "bg-cyan-600",    text: "text-white" },
  "Commercial":             { label: "Comm.",   bg: "bg-slate-600",   text: "text-white" },
  "Mixed Use":              { label: "Mixed",   bg: "bg-indigo-600",  text: "text-white" },
  "Social Housing":         { label: "Social",  bg: "bg-green-600",   text: "text-white" },
  "Dev / Flip":             { label: "Dev",     bg: "bg-red-600",     text: "text-white" },
}

const STATUS_CFG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  Active:        { label: "Occupied",    dot: "bg-emerald-400", text: "text-emerald-700", bg: "bg-emerald-50/90 border border-emerald-200/60" },
  Vacant:        { label: "Vacant",      dot: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50/90 border border-amber-200/60" },
  "Under Works": { label: "In Progress", dot: "bg-blue-400",    text: "text-blue-700",    bg: "bg-blue-50/90 border border-blue-200/60" },
  Archived:      { label: "Archived",    dot: "bg-slate-400",   text: "text-slate-600",   bg: "bg-slate-50/90 border border-slate-200/60" },
}

const TYPE_GRADIENTS: Record<string, string> = {
  HMO:          "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
  BTL:          "linear-gradient(135deg, #059669 0%, #10B981 100%)",
  SA:           "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
  R2R:          "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
  Commercial:   "linear-gradient(135deg, #475569 0%, #64748B 100%)",
  Mixed:        "linear-gradient(135deg, #4338CA 0%, #6366F1 100%)",
  "Holiday Let":"linear-gradient(135deg, #0891B2 0%, #0EA5E9 100%)",
  Other:        "linear-gradient(135deg, #374151 0%, #6B7280 100%)",
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)
}

/* ------------------------------------------------------------------ */
/* PropertyCard — compact (40-50% shorter than before)                */
/* ------------------------------------------------------------------ */
export function PropertyCard({ property }: { property: PropertyCardData }) {
  const router = useRouter()
  const [fav, setFav] = useState(property.isFavourited ?? false)
  const [imgError, setImgError] = useState(false)

  const badge = (property.operationProfile ? PROFILE_BADGE[property.operationProfile] : null) ?? TYPE_BADGE[property.type] ?? TYPE_BADGE.Other
  const status = STATUS_CFG[property.status] ?? STATUS_CFG.Active
  const cover = TYPE_GRADIENTS[property.type] ?? TYPE_GRADIENTS.Other
  const showImage = !!property.coverImageUrl && !imgError
  const occupancyPct = property.units > 0
    ? Math.round(((property.occupied ?? property.tenants) / property.units) * 100)
    : 0
  const yieldVal = property.yield
    ?? (property.monthlyRent > 0 ? ((property.monthlyRent * 12 / 400000) * 100).toFixed(1) : null)

  return (
    <Link href={`/app/portfolio/properties/${property.id}`} className="block group">
      <article className={cn(
        "relative bg-white rounded-2xl overflow-hidden",
        "border border-slate-200/80",
        "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]",
        "hover:shadow-[0_8px_24px_rgba(0,0,0,0.10),0_2px_6px_rgba(0,0,0,0.06)]",
        "hover:-translate-y-0.5 transition-all duration-250",
      )}>
        {/* ── Cover — uploaded photo or gradient fallback ── */}
        <div className="relative h-40 overflow-hidden"
          style={!showImage ? { background: cover } : undefined}>
          {showImage ? (
            <Image
              src={property.coverImageUrl!}
              alt={property.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 400px"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <Building2 size={48} className="text-white" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />

          {/* Type badge */}
          <span className={cn(
            "absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm backdrop-blur-sm",
            badge.bg, badge.text
          )}>
            {badge.label}
          </span>

          {/* Actions */}
          <div className="absolute top-2 right-2 flex items-center gap-1" onClick={(e) => e.preventDefault()}>
            <button
              onClick={(e) => { e.preventDefault(); setFav(v => !v) }}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm transition-all",
                fav ? "bg-red-500/90 text-white" : "bg-white/85 text-slate-500 hover:text-red-500"
              )}
              aria-label="Favourite"
            >
              <Heart className={cn("w-3 h-3", fav && "fill-current")} />
            </button>
            <div onClick={(e) => e.preventDefault()}>
              <ActionMenu
                items={[
                  { label: "View property", icon: Eye, onClick: () => router.push(`/app/portfolio/properties/${property.id}`) },
                  { label: "Add unit", icon: Plus, onClick: () => router.push(`/app/portfolio/units/new?propertyId=${property.id}`) },
                  { label: "Create tenancy", icon: Users, onClick: () => router.push(`/app/portfolio/tenancies/new?propertyId=${property.id}`) },
                  { label: "Archive", icon: Archive, onClick: () => {} },
                ]}
              />
            </div>
          </div>

          {/* Status pill */}
          <span className={cn(
            "absolute bottom-2 left-2.5 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm",
            status.bg, status.text
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", status.dot)} />
            {status.label}
          </span>

          {/* Occupancy bar — overlay bottom right */}
          <div className="absolute bottom-2 right-2.5 flex items-center gap-1">
            <div className="w-14 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", occupancyPct === 100 ? "bg-emerald-400" : occupancyPct >= 70 ? "bg-amber-400" : "bg-red-400")}
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
            <span className="text-[9px] font-bold text-white/90 leading-none">{occupancyPct}%</span>
          </div>
        </div>

        {/* ── Body — tight padding ── */}
        <div className="px-3.5 pt-2.5 pb-3">
          {/* Name + address */}
          <h3 className="text-[13.5px] font-bold text-slate-900 leading-snug truncate group-hover:text-[#2563EB] transition-colors">
            {property.name}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            {property.address}{property.postcode ? `, ${property.postcode}` : ""}
          </p>

          {/* Metrics row */}
          <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-slate-100">
            <div className="flex-1">
              <p className="text-[15px] font-black text-slate-900 leading-none">
                {property.monthlyRent > 0 ? fmt(property.monthlyRent) : <span className="text-slate-300 text-sm">—</span>}
              </p>
              <p className="text-[9.5px] text-slate-400 mt-0.5 uppercase tracking-wide font-medium">Monthly</p>
            </div>
            <div className="flex items-center gap-3 text-center shrink-0">
              <div>
                <p className="text-[12px] font-bold text-slate-800">{property.units}</p>
                <p className="text-[9.5px] text-slate-400">Units</p>
              </div>
              {property.bedrooms != null && (
                <div>
                  <p className="text-[12px] font-bold text-slate-800">{property.bedrooms}</p>
                  <p className="text-[9.5px] text-slate-400">Beds</p>
                </div>
              )}
              {yieldVal && (
                <div>
                  <p className="text-[12px] font-bold text-emerald-700 flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" />{yieldVal}%
                  </p>
                  <p className="text-[9.5px] text-slate-400">Yield</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
