"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BedDouble, Bath, Maximize2, Car,
  Calendar, AlertTriangle, Sofa, ChevronRight, Building2,
  Eye, Plus, Users, Archive,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ActionMenu } from "@/components/portfolio/ActionMenu"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
export interface UnitCardData {
  id: string
  property_id: string
  property_name?: string
  unit_name: string
  unit_type: string | null
  floor?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  floor_area_sqm?: number | null
  target_rent?: number | null
  status: "occupied" | "vacant" | "under_works" | "reserved"
  tenant_name?: string | null
  tenant_avatar?: string | null
  tenancy_end?: string | null
  cover_image?: string | null
  coverImageUrl?: string | null
  furnished?: boolean | null
  has_parking?: boolean | null
  has_balcony?: boolean | null
  has_ensuite?: boolean | null
}

/* ------------------------------------------------------------------ */
/* Config                                                               */
/* ------------------------------------------------------------------ */
const ROOM_GRADIENTS = [
  "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
  "linear-gradient(135deg, #059669 0%, #10B981 100%)",
  "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
  "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
  "linear-gradient(135deg, #0891B2 0%, #0EA5E9 100%)",
  "linear-gradient(135deg, #DB2777 0%, #EC4899 100%)",
]

const STATUS_CFG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  occupied:    { label: "Occupied",    dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border border-emerald-200" },
  vacant:      { label: "Vacant",      dot: "bg-slate-400",   text: "text-slate-600",   bg: "bg-slate-100 border border-slate-200" },
  under_works: { label: "Maintenance", dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50 border border-amber-200" },
  reserved:    { label: "Reserved",    dot: "bg-violet-500",  text: "text-violet-700",  bg: "bg-violet-50 border border-violet-200" },
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)
}

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

/* ------------------------------------------------------------------ */
/* UnitCard — compact (20-30% shorter)                                */
/* ------------------------------------------------------------------ */
export function UnitCard({ unit }: { unit: UnitCardData }) {
  const router = useRouter()
  const [imgError, setImgError] = useState(false)
  const cfg = STATUS_CFG[unit.status] ?? STATUS_CFG.vacant
  const gradIdx = unit.id.charCodeAt(unit.id.length - 1) % ROOM_GRADIENTS.length
  const coverGradient = ROOM_GRADIENTS[gradIdx]
  const coverUrl = unit.coverImageUrl ?? unit.cover_image ?? null
  const showImage = !!coverUrl && !imgError

  const daysLeft = unit.tenancy_end ? daysUntil(unit.tenancy_end) : null
  const endingSoon = daysLeft != null && daysLeft >= 0 && daysLeft <= 60
  const urgent = daysLeft != null && daysLeft >= 0 && daysLeft <= 30

  const typeLabel = unit.unit_type
    ? unit.unit_type.charAt(0).toUpperCase() + unit.unit_type.slice(1).replace("_", " ")
    : "Unit"

  return (
    <Link href={`/property-manager/portfolio/units/${unit.id}`} className="block group">
      <article className={cn(
        "relative bg-white rounded-2xl overflow-hidden",
        "border border-slate-200/80",
        "shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
        "hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)]",
        "hover:-translate-y-0.5 transition-all duration-250",
      )}>
        {/* ── Cover — uploaded photo or gradient fallback ── */}
        <div className="relative mx-3 mt-3 rounded-xl h-36 overflow-hidden"
          style={!showImage ? { background: coverGradient } : undefined}>
          {showImage ? (
            <Image
              src={coverUrl!}
              alt={unit.unit_name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 360px"
              unoptimized={(coverUrl ?? "").includes("/api/files")}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <Building2 size={40} className="text-white" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* 3-dot */}
          <div className="absolute top-2 right-2" onClick={(e) => e.preventDefault()}>
            <ActionMenu
              align="right"
              items={[
                { label: "View unit", icon: Eye, onClick: () => router.push(`/property-manager/portfolio/units/${unit.id}`) },
                { label: "Create tenancy", icon: Users, onClick: () => router.push(`/property-manager/portfolio/tenancies/new?unitId=${unit.id}`) },
                { label: "Add work order", icon: Plus, onClick: () => router.push(`/property-manager/portfolio/maintenance/new?unitId=${unit.id}`) },
                { label: "Archive unit", icon: Archive, onClick: () => {} },
              ]}
            />
          </div>

          {/* Unit type tag */}
          <span className="absolute bottom-2 left-2.5 text-[10px] font-semibold text-white/90 bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
            {typeLabel}
          </span>
        </div>

        {/* ── Body ── */}
        <div className="px-3 pt-1.5 pb-2">
          {/* Header row: name + status */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="text-[13.5px] font-bold text-slate-900 truncate group-hover:text-[#2563EB] transition-colors flex-1">
              {unit.unit_name}
            </h3>
            <span className={cn(
              "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0",
              cfg.bg, cfg.text
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
              {cfg.label}
            </span>
          </div>

          {/* Property name */}
          {unit.property_name && (
            <p className="text-[11px] text-slate-500 truncate mb-2">{unit.property_name}</p>
          )}

          {/* Specs + rent row */}
          <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5">
            {/* Specs */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
              {unit.bedrooms != null && (
                <span className="flex items-center gap-0.5">
                  <BedDouble className="w-3 h-3 text-slate-400" />{unit.bedrooms}
                </span>
              )}
              {unit.bathrooms != null && (
                <span className="flex items-center gap-0.5">
                  <Bath className="w-3 h-3 text-slate-400" />{unit.bathrooms}
                </span>
              )}
              {unit.floor_area_sqm && (
                <span className="flex items-center gap-0.5">
                  <Maximize2 className="w-3 h-3 text-slate-400" />{unit.floor_area_sqm}m²
                </span>
              )}
              {unit.has_parking && (
                <span className="flex items-center gap-0.5"><Car className="w-3 h-3 text-slate-400" /></span>
              )}
              {unit.furnished !== false && (
                <span className="flex items-center gap-0.5 text-emerald-600">
                  <Sofa className="w-3 h-3" />
                </span>
              )}
            </div>

            {/* Rent */}
            <div className="text-right shrink-0">
              <p className="text-[14px] font-black text-slate-900 leading-none">
                {fmt(unit.target_rent ?? 0)}
              </p>
              <p className="text-[9.5px] text-slate-500 mt-0.5">/mo</p>
            </div>
          </div>

          {/* Ending soon / urgent alert — compact */}
          {endingSoon && unit.status === "occupied" && (
            <div className={cn(
              "flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg text-[10px] font-semibold",
              urgent ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
            )}>
              <AlertTriangle className="w-3 h-3 shrink-0" />
              Ends in {daysLeft}d
            </div>
          )}

          {/* Footer: tenant or vacant CTA */}
          {unit.status === "occupied" && unit.tenant_name && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100">
              {unit.tenant_avatar ? (
                <Image src={unit.tenant_avatar} alt={unit.tenant_name} width={20} height={20}
                  className="w-5 h-5 rounded-full object-cover border border-white shadow-sm" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-[9px] font-bold">
                  {unit.tenant_name.charAt(0)}
                </div>
              )}
              <span className="text-[11px] text-slate-600 font-medium truncate">{unit.tenant_name}</span>
              <ChevronRight className="w-3 h-3 text-slate-300 ml-auto" />
            </div>
          )}
          {unit.status === "vacant" && (
            <div className="flex items-center mt-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-[#2563EB] flex items-center gap-0.5">
                <Calendar className="w-3 h-3" />List unit
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
