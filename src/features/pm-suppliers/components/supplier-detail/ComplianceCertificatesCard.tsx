"use client"

import React from "react"
import Link from "next/link"
import { Upload } from "lucide-react"
import { useWorkspaceJurisdiction } from "@/hooks/useWorkspaceJurisdiction"
import { requiredTradeCredential, taxIdLabel, type WorkType } from "@/lib/work/trade-certs"

export function ComplianceCertificatesCard() {
  const ws = useWorkspaceJurisdiction()
  const trades: { type: WorkType; label: string }[] = [
    { type: "gas", label: "Gas" },
    { type: "electrical", label: "Electrical" },
    { type: "energy", label: "Energy assessor" },
  ]
  const creds = trades
    .map((t) => ({ ...t, cred: requiredTradeCredential(ws.countryCode, t.type) }))
    .filter((t) => t.cred)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Compliance Certificates</h3>
        <Link href="/property-manager/work/suppliers/compliance" className="text-[12px] text-[#2563EB] hover:underline">
          View all
        </Link>
      </div>

      {/* Required trade credentials for this jurisdiction (dim 20). */}
      {creds.length > 0 && (
        <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Required credentials ({ws.countryCode})</p>
          <ul className="space-y-1">
            {creds.map((t) => (
              <li key={t.type} className="flex items-center justify-between gap-2 text-[12px]">
                <span className="text-slate-600">{t.label}</span>
                <span className="text-slate-800 font-medium text-right">
                  {t.cred!.credential}
                  {t.cred!.mandatory && <span className="ml-1 text-[10px] text-red-600">(legal)</span>}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-2 text-[12px] pt-1 border-t border-slate-100">
              <span className="text-slate-600">Tax ID</span>
              <span className="text-slate-800 font-medium">{taxIdLabel(ws.countryCode)}</span>
            </li>
          </ul>
        </div>
      )}

      <p className="text-[12px] text-slate-400 mb-3">No certificates uploaded yet. Upload insurance, registrations and safety docs to track compliance.</p>
      <button className="w-full py-2 border border-dashed border-slate-200 rounded-xl text-[12px] font-medium text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
        <Upload className="w-3.5 h-3.5" /> Upload New Certificate
      </button>
    </div>
  )
}
