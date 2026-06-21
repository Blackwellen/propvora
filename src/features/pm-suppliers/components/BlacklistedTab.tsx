"use client"

import React from "react"
import Link from "next/link"
import { Ban, MapPin, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SupplierView } from "@/features/suppliers/useSuppliers"

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BlacklistedTabProps {
  /** All suppliers — this tab filters to archived/blocked ones */
  suppliers: SupplierView[]
  /** Statuses that indicate a blocked/blacklisted supplier. Defaults to "archived" */
  blockedStatuses?: string[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BlacklistedTab({ suppliers, blockedStatuses = ["archived"] }: BlacklistedTabProps) {
  const blocked = suppliers.filter((s) => blockedStatuses.includes(s.status))

  if (blocked.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
        <Ban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-[14px] font-semibold text-slate-700 mb-1">No blacklisted suppliers</p>
        <p className="text-[12.5px] text-slate-500">
          Suppliers you block or archive will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {blocked.map((s) => (
        <div
          key={s.id}
          className="bg-white border border-red-200 rounded-2xl p-4 hover:shadow-sm transition-shadow opacity-80"
        >
          <div className="flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 grayscale", s.avatarBg)}>
              {s.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className="text-[13.5px] font-semibold text-slate-700 line-through">
                  {s.name}
                </span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold flex items-center gap-1">
                  <Ban className="w-3 h-3" /> Blocked
                </span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">{s.trade}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="text-[11.5px] text-slate-400">{s.location}</span>
              </div>
            </div>
            <Link
              href={`/property-manager/work/suppliers/${s.id}`}
              className="shrink-0 p-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
          </div>
        </div>
      ))}

      <p className="text-xs text-slate-500 pt-1">
        {blocked.length} blocked supplier{blocked.length === 1 ? "" : "s"}
      </p>
    </div>
  )
}
