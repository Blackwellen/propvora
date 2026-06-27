"use client"

import React from "react"
import { Upload } from "lucide-react"

export function FaviconSection() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-1">Favicon</h3>
      <p className="text-[12px] text-slate-500 mb-4">
        Shown in browser tabs. Recommended size: 32×32px ICO or PNG.
      </p>
      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-[var(--brand)] transition-colors cursor-pointer group max-w-[200px]">
        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[var(--brand-soft)] flex items-center justify-center mx-auto mb-2 transition-colors">
          <Upload className="w-4 h-4 text-slate-400 group-hover:text-[var(--brand)] transition-colors" />
        </div>
        <p className="text-[12px] font-semibold text-slate-700 group-hover:text-[var(--brand)] transition-colors">
          Upload favicon
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">ICO or PNG · 32×32px</p>
      </div>
    </div>
  )
}
