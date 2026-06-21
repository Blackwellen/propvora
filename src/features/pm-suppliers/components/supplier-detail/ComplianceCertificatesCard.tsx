"use client"

import React from "react"
import Link from "next/link"
import { Upload } from "lucide-react"

export function ComplianceCertificatesCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Compliance Certificates</h3>
        <Link href="/property-manager/work/suppliers/compliance" className="text-[12px] text-[#2563EB] hover:underline">
          View all
        </Link>
      </div>
      <p className="text-[12px] text-slate-400 mb-3">No certificates uploaded yet. Upload insurance, registrations and safety docs to track compliance.</p>
      <button className="w-full py-2 border border-dashed border-slate-200 rounded-xl text-[12px] font-medium text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
        <Upload className="w-3.5 h-3.5" /> Upload New Certificate
      </button>
    </div>
  )
}
