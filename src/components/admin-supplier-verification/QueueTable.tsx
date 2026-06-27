"use client"

import React from "react"
import Link from "next/link"
import { FileText, ShieldCheck, ScrollText, AlertTriangle, ChevronRight } from "lucide-react"
import { SupplierStatusBadge, LevelBadge } from "./badges"
import type { SupplierQueueRow } from "./data"

function fmtDate(d: string | null) {
  return d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—"
}

/**
 * Supplier verification review queue. Desktop table + mobile card list. Each row
 * links to the detail page where the explicit, recorded decision is made.
 */
export default function QueueTable({ rows }: { rows: SupplierQueueRow[] }) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2.5 font-medium">Supplier</th>
              <th className="px-4 py-2.5 font-medium">Level</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Evidence</th>
              <th className="px-4 py-2.5 font-medium">Submitted</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/supplier-verification/${r.id}`} className="block">
                    <span className="font-medium text-slate-800">
                      {r.supplierName ?? "Supplier"}
                    </span>
                    <span className="block text-[11px] text-slate-400 font-mono">
                      {r.supplierWorkspaceId.slice(0, 8)}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <LevelBadge level={r.level} label={r.levelLabel} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <SupplierStatusBadge status={r.status} />
                    {r.openRiskFlags > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#B45309]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {r.openRiskFlags}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 text-[11.5px] text-slate-500">
                    <span className="inline-flex items-center gap-1" title="ID documents">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />{r.documentCount}
                    </span>
                    <span className="inline-flex items-center gap-1" title="Insurance policies">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />{r.insuranceCount}
                    </span>
                    <span className="inline-flex items-center gap-1" title="Licences">
                      <ScrollText className="w-3.5 h-3.5 text-slate-400" />{r.licenceCount}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[12px] text-slate-500">{fmtDate(r.submittedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/supplier-verification/${r.id}`}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--brand)] hover:underline"
                  >
                    Review <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {rows.map((r) => (
          <Link
            key={r.id}
            href={`/admin/supplier-verification/${r.id}`}
            className="block rounded-xl border border-[#E2E8F0] bg-white p-4 active:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 truncate">{r.supplierName ?? "Supplier"}</p>
                <p className="text-[11px] text-slate-400 font-mono">{r.supplierWorkspaceId.slice(0, 8)}</p>
              </div>
              <SupplierStatusBadge status={r.status} />
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <LevelBadge level={r.level} label={r.levelLabel} />
              <span className="text-[11px] text-slate-400">{fmtDate(r.submittedAt)}</span>
            </div>
            <div className="mt-2.5 flex items-center gap-3 text-[11.5px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />{r.documentCount} docs
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />{r.insuranceCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <ScrollText className="w-3.5 h-3.5 text-slate-400" />{r.licenceCount}
              </span>
              {r.openRiskFlags > 0 && (
                <span className="inline-flex items-center gap-1 text-[#B45309] ml-auto">
                  <AlertTriangle className="w-3.5 h-3.5" />{r.openRiskFlags}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
