"use client"

import React from "react"
import { FileText, AlertTriangle, CheckCircle, FileCheck2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSupplierDocuments } from "@/features/suppliers/useSupplierTabs"

// ─── Expiry state ─────────────────────────────────────────────────────────────

function docExpiryState(expiry: string | null): { label: string; cls: string } | null {
  if (!expiry) return null
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86_400_000)
  if (days < 0)   return { label: "Expired",                              cls: "text-red-600 bg-red-50 border-red-100"     }
  if (days <= 30) return { label: `Expires in ${days}d`,                  cls: "text-amber-600 bg-amber-50 border-amber-100" }
  return               { label: `Valid · ${new Date(expiry).toLocaleDateString("en-GB")}`, cls: "text-emerald-600 bg-emerald-50 border-emerald-100" }
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DocumentsTabProps {
  workspaceId: string | undefined
  supplierId: string | undefined
  /** When true only shows compliance-related document types */
  complianceOnly?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DocumentsTab({ workspaceId, supplierId, complianceOnly }: DocumentsTabProps) {
  const { data: docs = [], isLoading } = useSupplierDocuments(workspaceId, supplierId)
  const filtered = complianceOnly
    ? docs.filter((d) =>
        /insurance|certificate|registration|gas|electrical|compliance|dbs|liability|qualification/i.test(
          `${d.doc_type} ${d.name}`
        )
      )
    : docs
  const title = complianceOnly ? "Compliance Documents" : "Documents"

  const verifiedCount = filtered.filter((d) => d.is_verified).length
  const expiredCount  = filtered.filter((d) => d.expiry_date && new Date(d.expiry_date).getTime() < Date.now()).length

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-[var(--brand)]" />
          <h3 className="text-sm font-semibold text-slate-900">
            {title} <span className="text-slate-400 font-normal ml-1">({filtered.length})</span>
          </h3>
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> {verifiedCount} verified
            </span>
            {expiredCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" /> {expiredCount} expired
              </span>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[88px] rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <FileCheck2 className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-900 mb-1">No {title.toLowerCase()} on file</p>
          <p className="text-[12.5px] text-slate-500">
            Verified certificates and documents for this supplier will appear here.
          </p>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((d) => {
            const exp = docExpiryState(d.expiry_date)
            return (
              <div
                key={d.id}
                className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 hover:border-[var(--brand)]/40 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-soft)] to-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[var(--brand)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[13px] font-semibold text-slate-800 truncate">{d.name}</p>
                    {d.is_verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 capitalize mt-0.5">{d.doc_type.replace(/_/g, " ")}</p>
                  {d.notes && <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{d.notes}</p>}
                  {exp && (
                    <span className={cn("inline-flex mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border", exp.cls)}>
                      {exp.label}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
