"use client"

import React from "react"
import Link from "next/link"
import { Clock, UserPlus, ChevronRight, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SupplierView } from "@/features/suppliers/useSuppliers"

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PendingTabProps {
  /** All suppliers. "Pending" suppliers are those with status === "inactive" or equivalent */
  suppliers: SupplierView[]
  /** Optionally filter further (e.g. status === "pending") — defaults to inactive */
  pendingStatuses?: string[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PendingTab({ suppliers, pendingStatuses = ["inactive", "pending"] }: PendingTabProps) {
  const pending = suppliers.filter((s) => pendingStatuses.includes(s.status))

  if (pending.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-[14px] font-semibold text-slate-700 mb-1">No pending suppliers</p>
        <p className="text-[12.5px] text-slate-500 mb-4">
          Suppliers awaiting approval or response will appear here.
        </p>
        <Link
          href="/property-manager/contacts/new?type=supplier"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-[13px] font-semibold hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Invite Supplier
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {pending.map((s) => (
        <div
          key={s.id}
          className="bg-white border border-amber-200 rounded-2xl p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0", s.avatarBg)}>
              {s.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <Link
                  href={`/property-manager/work/suppliers/${s.id}`}
                  className="text-[13.5px] font-semibold text-slate-900 hover:text-[#2563EB] transition-colors"
                >
                  {s.name}
                </Link>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                  Pending
                </span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{s.trade}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="text-[11.5px] text-slate-500">{s.location}</span>
              </div>
            </div>
            <Link
              href={`/property-manager/work/suppliers/${s.id}`}
              className="shrink-0 p-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      ))}

      <p className="text-xs text-slate-500 pt-1">
        {pending.length} supplier{pending.length === 1 ? "" : "s"} awaiting approval
      </p>
    </div>
  )
}
