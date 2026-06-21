"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BadgeCheck,
  MapPin,
  Star,
  Mail,
  Phone,
  Eye,
  Briefcase,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierAccreditationChip } from "@/features/suppliers/components/SupplierAccreditationChip"
import { SupplierComplianceStatus } from "@/features/suppliers/components/SupplierComplianceStatus"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import type { SupplierView } from "@/features/suppliers/useSuppliers"

// ─── Star rating ──────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "w-3.5 h-3.5",
            s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"
          )}
        />
      ))}
      <span className="text-[12.5px] font-semibold text-slate-700 ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

// ─── Card skeleton ────────────────────────────────────────────────────────────

export function SupplierCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-3.5 w-1/3 bg-slate-200 rounded" />
          <div className="h-3 w-1/4 bg-slate-100 rounded" />
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="h-8 bg-slate-100 rounded" />
            <div className="h-8 bg-slate-100 rounded" />
            <div className="h-8 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SupplierCardProps {
  supplier: SupplierView
  /** Called when the preferred star/action is toggled */
  onTogglePreferred: (s: SupplierView) => void
  /** Seeded rating (deterministic from supplier.id) */
  rating?: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SupplierCard({ supplier, onTogglePreferred, rating }: SupplierCardProps) {
  const router = useRouter()
  const href = `/property-manager/work/suppliers/${supplier.id}`
  const displayRating = rating ?? (4.5 + ((supplier.id.charCodeAt(0) % 5) / 10))

  return (
    <div
      onClick={() => router.push(href)}
      className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold", supplier.avatarBg)}>
            {supplier.initials}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-[13.5px] font-semibold text-slate-900">{supplier.name}</h3>
            {supplier.preferred && <BadgeCheck className="w-4 h-4 text-[#2563EB] shrink-0" />}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-blue-50 text-blue-700 border-blue-200">
              {supplier.trade}
            </span>
          </div>

          <div className="flex items-center gap-1 mb-2">
            <StarRating rating={displayRating} />
            <span className="text-[11px] text-slate-400">· {supplier.category}</span>
          </div>

          <div className="flex items-center gap-1.5 mb-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[12px] text-slate-600">{supplier.location}</span>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {supplier.tags
              .filter((t) => t !== "preferred")
              .slice(0, 4)
              .map((t) => (
                <SupplierAccreditationChip key={t} label={t} />
              ))}
            {supplier.tags.filter((t) => t !== "preferred").length === 0 && (
              <SupplierAccreditationChip label="Verified" />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Contact</p>
              <div className="space-y-0.5">
                {supplier.email && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-600 truncate">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-600">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    {supplier.phone}
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Status</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 capitalize">
                {supplier.status}
              </span>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Compliance</p>
              <SupplierComplianceStatus status="valid" nextReview="12 Jun 2026" />
            </div>
          </div>

          {/* Mobile action row */}
          <div className="flex sm:hidden items-center gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
            <Link
              href={href}
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-center"
            >
              View Profile
            </Link>
            <Link
              href={`/property-manager/work/jobs/new?supplierId=${supplier.id}`}
              className="flex-1 px-3 py-2.5 rounded-xl bg-[#2563EB] text-white text-[12.5px] font-semibold hover:bg-[#1d4ed8] transition-colors text-center"
            >
              Assign to Job
            </Link>
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden sm:flex flex-col items-end gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <ActionMenu
            items={[
              { label: "View Profile", icon: Eye, onClick: () => router.push(href) },
              { label: "Assign to Job", icon: Briefcase, onClick: () => router.push(`/property-manager/work/jobs/new?supplierId=${supplier.id}`) },
              {
                label: supplier.preferred ? "Remove from Preferred" : "Mark Preferred",
                icon: Star,
                onClick: () => onTogglePreferred(supplier),
              },
            ]}
          />
          <div className="flex flex-col gap-2 mt-2">
            <Link
              href={href}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap text-center"
            >
              View Profile
            </Link>
            <Link
              href={`/property-manager/work/jobs/new?supplierId=${supplier.id}`}
              className="px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-[12px] font-semibold hover:bg-[#1d4ed8] transition-colors whitespace-nowrap text-center"
            >
              Assign to Job
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
