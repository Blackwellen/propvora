"use client"

import React from "react"
import Link from "next/link"
import { Users, BadgeCheck, MapPin, Star, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { SupplierAccreditationChip } from "@/features/suppliers/components/SupplierAccreditationChip"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import type { SupplierView } from "@/features/suppliers/useSuppliers"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function seededRating(id: string) {
  return 4.3 + ((id.charCodeAt(0) % 7) / 10)
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn("w-3 h-3", s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")}
        />
      ))}
      <span className="text-[11px] font-semibold text-slate-600 ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ApprovedSuppliersTabProps {
  /** All suppliers — this tab filters to preferred/approved ones */
  suppliers: SupplierView[]
  onTogglePreferred: (s: SupplierView) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ApprovedSuppliersTab({ suppliers, onTogglePreferred }: ApprovedSuppliersTabProps) {
  const approved = suppliers.filter((s) => s.preferred)

  if (approved.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
        <BadgeCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-[14px] font-semibold text-slate-700 mb-1">No approved suppliers yet</p>
        <p className="text-[12.5px] text-slate-500 mb-4">
          Mark suppliers as preferred from the directory to add them here.
        </p>
        <Link
          href="/property-manager/suppliers/directory"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--brand)] text-white rounded-lg text-[13px] font-semibold hover:bg-[var(--brand-strong)] transition-colors"
        >
          Browse Directory
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {approved.map((s) => {
        const rating = seededRating(s.id)
        return (
          <div
            key={s.id}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold", s.avatarBg)}>
                  {s.initials}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Link
                    href={`/property-manager/work/suppliers/${s.id}`}
                    className="text-[13.5px] font-semibold text-slate-900 hover:text-[var(--brand)] transition-colors"
                  >
                    {s.name}
                  </Link>
                  <BadgeCheck className="w-4 h-4 text-[var(--brand)] shrink-0" />
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--color-brand-100)]">
                    {s.trade}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <StarRating rating={rating} />
                  <span className="text-[11px] text-slate-400">· {s.category}</span>
                </div>

                <div className="flex items-center gap-1.5 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[12px] text-slate-600">{s.location}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {s.tags
                    .filter((t) => t !== "preferred")
                    .slice(0, 4)
                    .map((t) => (
                      <SupplierAccreditationChip key={t} label={t} />
                    ))}
                  {s.tags.filter((t) => t !== "preferred").length === 0 && (
                    <SupplierAccreditationChip label="Verified" />
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onTogglePreferred(s)}
                  className="p-2 rounded-lg border bg-amber-50 border-amber-200 text-amber-500"
                  title="Remove from preferred"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                </button>
                <ActionMenu
                  items={[
                    { label: "View profile", onClick: () => window.location.assign(`/property-manager/work/suppliers/${s.id}`) },
                    { label: "View in marketplace", onClick: () => window.location.assign(`/property-manager/marketplace/suppliers/${s.id}`) },
                    { label: "Create job", onClick: () => window.location.assign("/property-manager/work/jobs/new") },
                    { label: "Remove from preferred", onClick: () => onTogglePreferred(s) },
                  ]}
                />
              </div>
            </div>
          </div>
        )
      })}

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-slate-500">{approved.length} approved supplier{approved.length === 1 ? "" : "s"}</p>
        <Link
          href="/property-manager/suppliers/directory"
          className="flex items-center gap-1 text-[12px] text-[var(--brand)] hover:underline font-medium"
        >
          Browse directory <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
